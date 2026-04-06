-- Marketplace core schema hardening
-- Covers: products, plans, orders, cart, favorites, licenses
-- Goal: UUID strict IDs, constraints, and performance indexes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  monthly_price NUMERIC,
  lifetime_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  feature_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, plan_name)
);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
  plan_id UUID REFERENCES public.marketplace_plans(plan_id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refund')),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  license_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_cart (
  cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.marketplace_plans(plan_id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, plan_id)
);

CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Some code references public.licenses already; keep compatibility and harden if table exists.
CREATE TABLE IF NOT EXISTS public.licenses (
  license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(product_id) ON DELETE SET NULL,
  license_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure legacy tables with id columns have UUID defaults where present.
DO $$
BEGIN
  IF to_regclass('public.marketplace_orders') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'marketplace_orders' AND column_name = 'id'
    ) THEN
      EXECUTE 'ALTER TABLE public.marketplace_orders ALTER COLUMN id SET DEFAULT gen_random_uuid()';
      -- Backfill order_id from id if order_id exists and is null.
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'marketplace_orders' AND column_name = 'order_id'
      ) THEN
        EXECUTE 'UPDATE public.marketplace_orders SET order_id = id WHERE order_id IS NULL';
      END IF;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.licenses') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'id'
    ) THEN
      EXECUTE 'ALTER TABLE public.licenses ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    END IF;
  END IF;
END $$;

-- UUID strict check constraints for text-id legacy fields where applicable
DO $$
BEGIN
  IF to_regclass('public.marketplace_orders') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'marketplace_orders' AND column_name = 'order_number' AND data_type IN ('text', 'character varying')
    ) THEN
      BEGIN
        EXECUTE $$ALTER TABLE public.marketplace_orders
          ADD CONSTRAINT marketplace_orders_order_number_uuid_chk
          CHECK (order_number IS NULL OR order_number ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')$$;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;
  END IF;
END $$;

-- Indexes: search, filter, order monitor, wallet sync, favorites
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products (is_active, category);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm_like ON public.products (product_name);
CREATE INDEX IF NOT EXISTS idx_marketplace_plans_product ON public.marketplace_plans (product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_created ON public.marketplace_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_product_status ON public.marketplace_orders (product_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payment_status ON public.marketplace_orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_user ON public.marketplace_cart (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user ON public.marketplace_favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_licenses_user_product ON public.licenses (user_id, product_id);

-- Optional RLS enablement for marketplace tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Safe baseline policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can view active products'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_cart' AND policyname = 'Users manage own cart'
  ) THEN
    EXECUTE 'CREATE POLICY "Users manage own cart" ON public.marketplace_cart FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_favorites' AND policyname = 'Users manage own favorites'
  ) THEN
    EXECUTE 'CREATE POLICY "Users manage own favorites" ON public.marketplace_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_orders' AND policyname = 'Users view own orders'
  ) THEN
    EXECUTE 'CREATE POLICY "Users view own orders" ON public.marketplace_orders FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'licenses' AND policyname = 'Users view own licenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users view own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
