import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;

type RouteContext = {
  req: Request;
  supabase: any;
  user: { id: string } | null;
  role: string | null;
  params: Record<string, string>;
  body: JsonRecord;
};

type ServiceResult<T> = {
  ok: boolean;
  status: number;
  message: string;
  data?: T;
  fallback_ui?: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

const ADMIN_ROLES = new Set(["admin", "super_admin", "boss_owner", "master"]);

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function responseOk<T>(message: string, data?: T, status = 200): ServiceResult<T> {
  return { ok: true, status, message, data };
}

function responseErr(message: string, status = 400, fallback = false): ServiceResult<never> {
  return { ok: false, status, message, fallback_ui: fallback };
}

function toApiResponse<T>(result: ServiceResult<T>): Response {
  return jsonResponse(
    {
      ok: result.ok,
      message: result.message,
      data: result.data ?? null,
      fallback_ui: result.fallback_ui ?? false,
    },
    result.status,
  );
}

function parsePath(pathname: string, baseSegment: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === baseSegment);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

function matchPath(parts: string[], pattern: string): { matched: boolean; params: Record<string, string> } {
  const routeParts = pattern.split("/").filter(Boolean);
  if (routeParts.length !== parts.length) return { matched: false, params: {} };

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i];
    const pp = parts[i];
    if (rp.startsWith(":")) {
      params[rp.slice(1)] = decodeURIComponent(pp);
      continue;
    }
    if (rp !== pp) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

async function withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastErr = err;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, (i + 1) * 150));
      }
    }
  }
  throw lastErr;
}

async function resolveAuthUser(supabase: any, req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { user: null, role: null };
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, role: null };
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return { user: { id: data.user.id }, role: roleRow?.role ?? null };
}

function requireAuth(ctx: RouteContext): ServiceResult<never> | null {
  if (!ctx.user) return responseErr("Unauthorized", 401, true);
  return null;
}

function requireAdmin(ctx: RouteContext): ServiceResult<never> | null {
  const authError = requireAuth(ctx);
  if (authError) return authError;
  if (!ctx.role || !ADMIN_ROLES.has(ctx.role)) return responseErr("Forbidden: admin role required", 403, true);
  return null;
}

// DB layer
const db = {
  async listPublishedProducts(supabase: any) {
    const { data, error } = await supabase
      .from("products")
      .select("product_id,name,category_id,status,base_price")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPublicProduct(supabase: any, productId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("product_id,name,category_id,status,base_price")
      .eq("product_id", productId)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPlansByProduct(supabase: any, productId: string) {
    const { data, error } = await supabase
      .from("plans")
      .select("plan_id,product_id,price,features")
      .eq("product_id", productId)
      .order("price", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async insertCartItem(supabase: any, row: JsonRecord) {
    const { data, error } = await supabase
      .from("cart")
      .upsert(row, { onConflict: "user_id,product_id,plan_id" })
      .select("cart_id,user_id,product_id,plan_id,quantity")
      .single();
    if (error) throw error;
    return data;
  },

  async listCartByUser(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from("cart")
      .select("cart_id,user_id,product_id,plan_id,quantity,products(name,base_price),plans(price,features)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createOrder(supabase: any, row: JsonRecord) {
    const { data, error } = await supabase
      .from("orders")
      .insert(row)
      .select("order_id,user_id,product_id,plan_id,status,amount,created_at")
      .single();
    if (error) throw error;
    return data;
  },

  async getOrderById(supabase: any, orderId: string, userId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("order_id,user_id,product_id,plan_id,status,amount,payment_id")
      .eq("order_id", orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateOrderPaymentStatus(supabase: any, orderId: string, status: string, paymentId: string) {
    const { data, error } = await supabase
      .from("orders")
      .update({ status, payment_id: paymentId, updated_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .select("order_id,user_id,product_id,plan_id,status,amount,payment_id")
      .single();
    if (error) throw error;
    return data;
  },

  async insertWalletSplit(supabase: any, payload: JsonRecord) {
    const { error } = await supabase.from("marketplace_wallet_splits").insert(payload);
    if (error) throw error;
  },

  async upsertLicense(supabase: any, payload: JsonRecord) {
    const { data, error } = await supabase
      .from("licenses")
      .upsert(payload, { onConflict: "user_id,product_id,order_id" })
      .select("license_id,user_id,product_id,status,order_id")
      .single();
    if (error) throw error;
    return data;
  },

  async hasActiveLicense(supabase: any, userId: string, productId: string) {
    const { data, error } = await supabase
      .from("licenses")
      .select("license_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.license_id);
  },

  async createProduct(supabase: any, payload: JsonRecord) {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("product_id,name,category_id,status,base_price")
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(supabase: any, productId: string, payload: JsonRecord) {
    const { data, error } = await supabase
      .from("products")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("product_id", productId)
      .select("product_id,name,category_id,status,base_price")
      .single();
    if (error) throw error;
    return data;
  },

  async publishProduct(supabase: any, productId: string) {
    const { data, error } = await supabase
      .from("products")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("product_id", productId)
      .select("product_id,name,category_id,status,base_price")
      .single();
    if (error) throw error;
    return data;
  },

  async logAnalytics(supabase: any, payload: JsonRecord) {
    const { error } = await supabase.from("marketplace_analytics_events").insert(payload);
    if (error) throw error;
  },

  async logAiAction(supabase: any, payload: JsonRecord) {
    const { error } = await supabase.from("marketplace_ai_actions").insert(payload);
    if (error) throw error;
  },
};

// Service layer
const marketplaceService = {
  async runAiOptimizer(supabase: any, signal: "product_view" | "cart_drop" | "sales", productId: string, context: JsonRecord) {
    let actionType: "boost_product" | "suggest_discount" | "trigger_banner" = "boost_product";
    if (signal === "cart_drop") actionType = "suggest_discount";
    if (signal === "sales") actionType = "trigger_banner";

    await db.logAiAction(supabase, {
      input_signal: signal,
      action_type: actionType,
      product_id: productId,
      context,
    });

    return { signal, action_type: actionType };
  },

  async listMarketplace(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const products = await db.listPublishedProducts(ctx.supabase);
    return responseOk("Marketplace loaded", { products });
  },

  async getProduct(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const productId = ctx.params.product_id;
    const product = await db.getPublicProduct(ctx.supabase, productId);
    if (!product) return responseErr("Product not found or not visible", 404, true);

    const plans = await db.getPlansByProduct(ctx.supabase, productId);
    await db.logAnalytics(ctx.supabase, {
      user_id: ctx.user?.id ?? null,
      product_id: productId,
      event_type: "product_view",
      payload: { route: "GET /product/:product_id" },
    });
    const ai = await marketplaceService.runAiOptimizer(ctx.supabase, "product_view", productId, {
      viewed_at: new Date().toISOString(),
    });

    return responseOk("Product loaded", { product, plans, ai });
  },

  async addToCart(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const auth = requireAuth(ctx);
    if (auth) return auth;

    const productId = String(ctx.body.product_id || "");
    const planId = String(ctx.body.plan_id || "");
    const quantity = Number(ctx.body.quantity ?? 1);

    if (!productId || !planId) return responseErr("product_id and plan_id are required", 400, true);

    const product = await db.getPublicProduct(ctx.supabase, productId);
    if (!product) return responseErr("Product not visible", 403, true);

    const cartItem = await db.insertCartItem(ctx.supabase, {
      user_id: ctx.user!.id,
      product_id: productId,
      plan_id: planId,
      quantity,
      updated_at: new Date().toISOString(),
    });

    await db.logAnalytics(ctx.supabase, {
      user_id: ctx.user!.id,
      product_id: productId,
      event_type: "cart_add",
      payload: { plan_id: planId, quantity },
    });

    return responseOk("Added to cart", { cart_item: cartItem }, 201);
  },

  async getCart(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const auth = requireAuth(ctx);
    if (auth) return auth;

    const items = await db.listCartByUser(ctx.supabase, ctx.user!.id);
    return responseOk("Cart fetched", { items });
  },

  async createOrder(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const auth = requireAuth(ctx);
    if (auth) return auth;

    const cartId = String(ctx.body.cart_id || "");
    let productId = String(ctx.body.product_id || "");
    let planId = String(ctx.body.plan_id || "");

    if (cartId) {
      const items = await db.listCartByUser(ctx.supabase, ctx.user!.id);
      const selected = items.find((i: any) => i.cart_id === cartId);
      if (!selected) return responseErr("Cart item not found", 404, true);
      productId = selected.product_id;
      planId = selected.plan_id;
    }

    if (!productId || !planId) return responseErr("Provide cart_id or product_id + plan_id", 400, true);

    const product = await db.getPublicProduct(ctx.supabase, productId);
    if (!product) return responseErr("Product not visible", 403, true);

    const plans = await db.getPlansByProduct(ctx.supabase, productId);
    const selectedPlan = plans.find((p: any) => p.plan_id === planId);
    if (!selectedPlan) return responseErr("Plan not found", 404, true);

    const order = await db.createOrder(ctx.supabase, {
      user_id: ctx.user!.id,
      product_id: productId,
      plan_id: planId,
      status: "pending",
      amount: selectedPlan.price,
    });

    await db.logAnalytics(ctx.supabase, {
      user_id: ctx.user!.id,
      product_id: productId,
      order_id: order.order_id,
      event_type: "order_create",
      payload: { plan_id: planId, amount: selectedPlan.price },
    });

    return responseOk("Order created", { order }, 201);
  },

  async verifyPayment(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const auth = requireAuth(ctx);
    if (auth) return auth;

    const orderId = String(ctx.body.order_id || "");
    const paymentId = String(ctx.body.payment_id || "");
    const paymentStatus = String(ctx.body.payment_status || "verified");

    if (!orderId || !paymentId) return responseErr("order_id and payment_id are required", 400, true);

    const order = await db.getOrderById(ctx.supabase, orderId, ctx.user!.id);
    if (!order) return responseErr("Order not found", 404, true);

    if (order.status === "paid" || order.status === "fulfilled") {
      const hasLicense = await db.hasActiveLicense(ctx.supabase, ctx.user!.id, order.product_id);
      return responseOk("Payment already verified", {
        order,
        access_granted: hasLicense,
      });
    }

    if (paymentStatus !== "verified") {
      await db.updateOrderPaymentStatus(ctx.supabase, orderId, "failed", paymentId);
      await db.logAnalytics(ctx.supabase, {
        user_id: ctx.user!.id,
        product_id: order.product_id,
        order_id: orderId,
        event_type: "payment_failed",
        payload: { payment_id: paymentId },
      });
      return responseErr("Payment verification failed", 402, true);
    }

    const updatedOrder = await withRetry(
      () => db.updateOrderPaymentStatus(ctx.supabase, orderId, "paid", paymentId),
      2,
    );

    const total = Number(updatedOrder.amount || 0);
    const sellerAmount = Number((total * 0.8).toFixed(2));
    const platformAmount = Number((total * 0.2).toFixed(2));

    await withRetry(
      () =>
        db.insertWalletSplit(ctx.supabase, {
          order_id: updatedOrder.order_id,
          user_id: updatedOrder.user_id,
          total_amount: total,
          seller_amount: sellerAmount,
          platform_amount: platformAmount,
          currency: "USD",
        }),
      2,
    );

    const license = await withRetry(
      () =>
        db.upsertLicense(ctx.supabase, {
          user_id: ctx.user!.id,
          product_id: updatedOrder.product_id,
          order_id: updatedOrder.order_id,
          status: "active",
          issued_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      2,
    );

    await db.logAnalytics(ctx.supabase, {
      user_id: ctx.user!.id,
      product_id: updatedOrder.product_id,
      order_id: updatedOrder.order_id,
      event_type: "sales",
      payload: { payment_id: paymentId, amount: total },
    });

    const ai = await marketplaceService.runAiOptimizer(ctx.supabase, "sales", updatedOrder.product_id, {
      order_id: updatedOrder.order_id,
      amount: total,
    });

    return responseOk("Payment verified, wallet split applied, license generated", {
      order: updatedOrder,
      wallet_split: {
        total_amount: total,
        seller_amount: sellerAmount,
        platform_amount: platformAmount,
      },
      license,
      access_granted: license.status === "active",
      ai,
    });
  },

  async createProduct(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const guard = requireAdmin(ctx);
    if (guard) return guard;

    const name = String(ctx.body.name || "").trim();
    const categoryId = String(ctx.body.category_id || "").trim() || null;
    const basePrice = Number(ctx.body.base_price ?? 0);
    if (!name) return responseErr("name is required", 400, true);

    const product = await db.createProduct(ctx.supabase, {
      name,
      category_id: categoryId,
      status: "draft",
      base_price: basePrice,
    });

    return responseOk("Product created", { product }, 201);
  },

  async updateProduct(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const guard = requireAdmin(ctx);
    if (guard) return guard;

    const productId = ctx.params.id;
    const updates: JsonRecord = {};
    if (ctx.body.name !== undefined) updates.name = String(ctx.body.name);
    if (ctx.body.category_id !== undefined) updates.category_id = String(ctx.body.category_id);
    if (ctx.body.base_price !== undefined) updates.base_price = Number(ctx.body.base_price);
    if (ctx.body.status !== undefined) updates.status = String(ctx.body.status);

    const product = await db.updateProduct(ctx.supabase, productId, updates);
    return responseOk("Product updated", { product });
  },

  async publishProduct(ctx: RouteContext): Promise<ServiceResult<unknown>> {
    const guard = requireAdmin(ctx);
    if (guard) return guard;

    const productId = ctx.params.id;
    const product = await db.publishProduct(ctx.supabase, productId);
    return responseOk("Product published", { product });
  },
};

// Controller layer
const controller = {
  async getMarketplace(ctx: RouteContext) {
    return marketplaceService.listMarketplace(ctx);
  },

  async getProduct(ctx: RouteContext) {
    return marketplaceService.getProduct(ctx);
  },

  async addCart(ctx: RouteContext) {
    return marketplaceService.addToCart(ctx);
  },

  async getCart(ctx: RouteContext) {
    return marketplaceService.getCart(ctx);
  },

  async createOrder(ctx: RouteContext) {
    return marketplaceService.createOrder(ctx);
  },

  async verifyPayment(ctx: RouteContext) {
    return marketplaceService.verifyPayment(ctx);
  },

  async createProduct(ctx: RouteContext) {
    return marketplaceService.createProduct(ctx);
  },

  async updateProduct(ctx: RouteContext) {
    return marketplaceService.updateProduct(ctx);
  },

  async publishProduct(ctx: RouteContext) {
    return marketplaceService.publishProduct(ctx);
  },
};

const routes: Array<{
  method: string;
  path: string;
  handler: (ctx: RouteContext) => Promise<ServiceResult<unknown>>;
}> = [
  { method: "GET", path: "marketplace", handler: controller.getMarketplace },
  { method: "GET", path: "product/:product_id", handler: controller.getProduct },
  { method: "POST", path: "cart/add", handler: controller.addCart },
  { method: "GET", path: "cart", handler: controller.getCart },
  { method: "POST", path: "order/create", handler: controller.createOrder },
  { method: "POST", path: "payment/verify", handler: controller.verifyPayment },
  { method: "POST", path: "products", handler: controller.createProduct },
  { method: "PUT", path: "products/:id", handler: controller.updateProduct },
  { method: "POST", path: "products/:id/publish", handler: controller.publishProduct },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const url = new URL(req.url);
  const parts = parsePath(url.pathname, "marketplace");
  const body = req.method === "GET" ? {} : ((await req.json().catch(() => ({}))) as JsonRecord);

  const { user, role } = await resolveAuthUser(supabase, req);

  try {
    for (const route of routes) {
      if (route.method !== req.method) continue;
      const matched = matchPath(parts, route.path);
      if (!matched.matched) continue;

      const ctx: RouteContext = {
        req,
        supabase,
        user,
        role,
        params: matched.params,
        body,
      };

      const result = await route.handler(ctx);
      return toApiResponse(result);
    }

    return toApiResponse(responseErr("Route not found", 404, true));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    try {
      await db.logAnalytics(supabase, {
        user_id: user?.id ?? null,
        event_type: "error",
        payload: { path: url.pathname, message },
      });
    } catch {
      // Do not fail error response if logging fails.
    }

    return toApiResponse(responseErr(message, 500, true));
  }
});
