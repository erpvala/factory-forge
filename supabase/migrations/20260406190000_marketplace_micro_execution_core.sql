-- Marketplace Micro Execution Core
-- Route + DB + ERD + API + AI connected

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core catalog
CREATE TABLE IF NOT EXISTS products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

CREATE TABLE IF NOT EXISTS plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_product_id ON plans(product_id);

-- Transactional layer
CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES plans(plan_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'fulfilled')),
  payment_id TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS cart (
  cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

CREATE TABLE IF NOT EXISTS licenses (
  license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_product_id ON licenses(product_id);

-- Supporting micro-flow tables
CREATE TABLE IF NOT EXISTS marketplace_wallet_splits (
  split_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL,
  seller_amount NUMERIC(12,2) NOT NULL,
  platform_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_splits_order_id ON marketplace_wallet_splits(order_id);

CREATE TABLE IF NOT EXISTS marketplace_analytics_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_event_type ON marketplace_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_product_id ON marketplace_analytics_events(product_id);

CREATE TABLE IF NOT EXISTS marketplace_ai_actions (
  ai_action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_signal TEXT NOT NULL CHECK (input_signal IN ('product_view', 'cart_drop', 'sales')),
  action_type TEXT NOT NULL CHECK (action_type IN ('boost_product', 'suggest_discount', 'trigger_banner')),
  product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_ai_actions_product_id ON marketplace_ai_actions(product_id);

-- Basic RLS enablement
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wallet_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_ai_actions ENABLE ROW LEVEL SECURITY;

-- Public read for published products and plans
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products
FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS plans_public_read ON plans;
CREATE POLICY plans_public_read ON plans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.product_id = plans.product_id
      AND p.status = 'published'
  )
);

-- User scoped CRUD for cart/orders/favorites/licenses/analytics
DROP POLICY IF EXISTS cart_user_rw ON cart;
CREATE POLICY cart_user_rw ON cart
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS favorites_user_rw ON favorites;
CREATE POLICY favorites_user_rw ON favorites
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS orders_user_rw ON orders;
CREATE POLICY orders_user_rw ON orders
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS licenses_user_read ON licenses;
CREATE POLICY licenses_user_read ON licenses
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS wallet_splits_user_read ON marketplace_wallet_splits;
CREATE POLICY wallet_splits_user_read ON marketplace_wallet_splits
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS analytics_user_insert ON marketplace_analytics_events;
CREATE POLICY analytics_user_insert ON marketplace_analytics_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS ai_actions_internal_read ON marketplace_ai_actions;
CREATE POLICY ai_actions_internal_read ON marketplace_ai_actions
FOR SELECT USING (true);
