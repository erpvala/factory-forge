// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ProductStatus = 'DRAFT' | 'PENDING' | 'READY' | 'ACTIVE' | 'INACTIVE';
export type Visibility = 'public' | 'restricted';
export type OrderStatus = 'pending' | 'paid' | 'refund';

export interface ProductPlan {
  name: 'basic' | 'pro' | 'enterprise';
  price: number;
  featureLimits: Record<string, number | string | boolean>;
  usageLimits: Record<string, number>;
}

export interface ProductVersion {
  productVersionId: string;
  snapshot: any;
  createdAt: string;
  createdBy: string;
}

export interface MarketplaceManagerProduct {
  productId: string;
  productVersionId: string;
  name: string;
  categoryId: string;
  description: string;
  basePrice: number;
  features: string[];
  plans: ProductPlan[];
  licenseRequired: boolean;
  visibility: Visibility;
  tags: string[];
  keywords: string[];
  status: ProductStatus;
  enabled: boolean;
  discountPercent: number;
  stockLimited: boolean;
  stock: number | null;
  regionLocks: string[];
  featureFlags: Record<string, boolean>;
  dependencies: string[];
  abTest?: {
    enabled: boolean;
    variantA: number;
    variantB: number;
    splitPercent: number;
  };
  conversionRate: number;
  views: number;
  sales: number;
  revenue: number;
  versions: ProductVersion[];
  qualityRating: number;
  ratingModerationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description?: string;
  productIds: string[];
}

export interface MarketplaceOrder {
  orderId: string;
  productId: string;
  amount: number;
  status: OrderStatus;
  userId?: string;
  createdAt: string;
}

export interface RevenueEntry {
  productId: string;
  revenue: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityId?: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface NotificationEntry {
  id: string;
  type: 'product_update' | 'offer_launch' | 'approval' | 'refund' | 'ops';
  title: string;
  message: string;
  createdAt: string;
}

export interface SeoSignal {
  id: string;
  productId: string;
  keywords: string[];
  tags: string[];
  createdAt: string;
}

export interface LeadSignal {
  id: string;
  productId: string;
  source: 'product_view' | 'cart' | 'checkout';
  createdAt: string;
}

export interface SupportSignal {
  id: string;
  productId: string;
  issue: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AICeoSignal {
  id: string;
  productId: string;
  type: 'trending' | 'failing' | 'drop';
  suggestion: string;
  createdAt: string;
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

const defaultPlans = (): ProductPlan[] => ([
  { name: 'basic', price: 199, featureLimits: { seats: 5, support: 'email' }, usageLimits: { projects: 10, apiCalls: 10000 } },
  { name: 'pro', price: 499, featureLimits: { seats: 25, support: 'priority' }, usageLimits: { projects: 100, apiCalls: 100000 } },
  { name: 'enterprise', price: 999, featureLimits: { seats: 250, support: 'dedicated' }, usageLimits: { projects: 1000, apiCalls: 1000000 } },
]);

interface MarketplaceManagerAdminState {
  products: MarketplaceManagerProduct[];
  categories: MarketplaceCategory[];
  orders: MarketplaceOrder[];
  audits: AuditEntry[];
  notifications: NotificationEntry[];
  seoSignals: SeoSignal[];
  leadSignals: LeadSignal[];
  supportSignals: SupportSignal[];
  aiSignals: AICeoSignal[];
  cacheVersion: number;
  offers: {
    globalDiscountPercent: number;
    countryDiscount: Record<string, number>;
  };

  createProduct: (input: {
    name: string;
    categoryId: string;
    description: string;
    basePrice: number;
    features: string[];
    userId: string;
  }) => { ok: boolean; product?: MarketplaceManagerProduct; error?: string };

  autoSaveDraft: (productId: string, patch: Partial<MarketplaceManagerProduct>, userId: string) => void;
  configureProduct: (productId: string, patch: {
    plans?: ProductPlan[];
    licenseRequired?: boolean;
  }, userId: string) => void;
  publishProduct: (productId: string, patch: {
    visibility: Visibility;
    tags: string[];
    keywords: string[];
  }, userId: string) => void;
  updateProduct: (productId: string, patch: Partial<MarketplaceManagerProduct>, userId: string) => void;
  setProductControl: (productId: string, control: { enabled?: boolean; basePrice?: number; discountPercent?: number }, userId: string) => void;

  cloneProduct: (productId: string, userId: string) => void;
  rollbackProductVersion: (productId: string, productVersionId: string, userId: string) => void;
  requestApproval: (productId: string, userId: string) => void;
  approveProduct: (productId: string, userId: string) => void;

  bulkAction: (input: {
    productIds: string[];
    action: 'enable' | 'disable' | 'price_update';
    value?: number;
    userId: string;
  }) => void;

  upsertCategory: (input: { id?: string; name: string; description?: string; productIds?: string[]; userId: string }) => void;

  setInventory: (productId: string, input: { stockLimited: boolean; stock: number | null; userId: string }) => void;
  setRegionLock: (productId: string, countries: string[], userId: string) => void;
  setFeatureFlag: (productId: string, flag: string, enabled: boolean, userId: string) => void;
  setABTest: (productId: string, test: { enabled: boolean; variantA: number; variantB: number; splitPercent: number }, userId: string) => void;
  setDependency: (productId: string, dependencies: string[], userId: string) => void;
  setPlanLimit: (productId: string, plan: ProductPlan['name'], limits: Record<string, number>, userId: string) => void;

  createOrderMock: (input: { productId: string; amount: number; status: OrderStatus; userId?: string }) => void;
  approveRefund: (orderId: string, userId: string) => void;

  sendSeoSignal: (productId: string) => void;
  createLeadSignal: (productId: string, source: LeadSignal['source']) => void;
  createSupportSignal: (productId: string, issue: string) => void;
  runAICeo: () => void;

  setOffer: (input: { globalDiscountPercent?: number; country?: string; percent?: number; userId: string }) => void;
  canAccessProduct: (input: { productId: string; hasLicense: boolean; hasSubscription: boolean; country?: string }) => boolean;

  getDashboardMetrics: () => {
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    totalRevenue: number;
    topProducts: Array<{ productId: string; name: string; sales: number; revenue: number }>;
    lowConversion: Array<{ productId: string; name: string; conversionRate: number }>;
  };
}

function pushVersion(product: MarketplaceManagerProduct, userId: string): MarketplaceManagerProduct {
  const snapshot = JSON.parse(JSON.stringify(product));
  const version: ProductVersion = {
    productVersionId: uid('PV-'),
    snapshot,
    createdAt: now(),
    createdBy: userId,
  };
  return {
    ...product,
    productVersionId: version.productVersionId,
    versions: [version, ...product.versions].slice(0, 20),
  };
}

function logAudit(state: MarketplaceManagerAdminState, userId: string, action: string, entityId?: string, payload?: Record<string, any>) {
  const entry: AuditEntry = {
    id: uid('AUD-'),
    userId,
    action,
    entityId,
    timestamp: now(),
    payload,
  };
  return [entry, ...state.audits].slice(0, 800);
}

function notify(state: MarketplaceManagerAdminState, type: NotificationEntry['type'], title: string, message: string) {
  const next: NotificationEntry = {
    id: uid('NTF-'),
    type,
    title,
    message,
    createdAt: now(),
  };
  return [next, ...state.notifications].slice(0, 400);
}

export const useMarketplaceManagerAdminStore = create<MarketplaceManagerAdminState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [
        { id: 'cat-crm', name: 'CRM', description: 'Sales and relationship products', productIds: [] },
        { id: 'cat-pos', name: 'POS', description: 'Retail and transaction products', productIds: [] },
        { id: 'cat-erp', name: 'ERP', description: 'Enterprise operation products', productIds: [] },
      ],
      orders: [],
      audits: [],
      notifications: [],
      seoSignals: [],
      leadSignals: [],
      supportSignals: [],
      aiSignals: [],
      cacheVersion: 1,
      offers: {
        globalDiscountPercent: 0,
        countryDiscount: {},
      },

      createProduct: (input) => {
        const requiredMissing = !input.name.trim() || !input.categoryId.trim() || !input.description.trim() || !Number.isFinite(input.basePrice);
        if (requiredMissing) {
          return { ok: false, error: 'Missing required product fields' };
        }

        const duplicate = get().products.some((item) => item.name.trim().toLowerCase() === input.name.trim().toLowerCase());
        if (duplicate) {
          return { ok: false, error: 'Duplicate product name detected' };
        }

        const base: MarketplaceManagerProduct = {
          productId: uid('PRD-'),
          productVersionId: uid('PV-'),
          name: input.name.trim(),
          categoryId: input.categoryId,
          description: input.description.trim(),
          basePrice: input.basePrice,
          features: input.features || [],
          plans: defaultPlans(),
          licenseRequired: true,
          visibility: 'restricted',
          tags: [],
          keywords: [],
          status: 'DRAFT',
          enabled: false,
          discountPercent: 0,
          stockLimited: false,
          stock: null,
          regionLocks: [],
          featureFlags: {},
          dependencies: [],
          conversionRate: 0,
          views: 0,
          sales: 0,
          revenue: 0,
          versions: [],
          qualityRating: 5,
          ratingModerationRequired: false,
          createdAt: now(),
          updatedAt: now(),
        };

        const withVersion = pushVersion(base, input.userId);

        set((state) => ({
          products: [withVersion, ...state.products],
          audits: logAudit(state, input.userId, 'product_created', withVersion.productId, { status: withVersion.status }),
          notifications: notify(state, 'product_update', 'Product Draft Created', `${withVersion.name} created in DRAFT state.`),
        }));

        return { ok: true, product: withVersion };
      },

      autoSaveDraft: (productId, patch, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            const merged = pushVersion({ ...product, ...patch, updatedAt: now(), status: product.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT' }, userId);
            return merged;
          }),
          audits: logAudit(state, userId, 'product_draft_autosave', productId),
        }));
      },

      configureProduct: (productId, patch, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            const merged = pushVersion({
              ...product,
              plans: patch.plans || product.plans,
              licenseRequired: typeof patch.licenseRequired === 'boolean' ? patch.licenseRequired : product.licenseRequired,
              status: 'READY',
              updatedAt: now(),
            }, userId);
            return merged;
          }),
          audits: logAudit(state, userId, 'configure_product', productId),
          notifications: notify(state, 'product_update', 'Product Configured', `Product ${productId} moved to READY.`),
        }));
      },

      publishProduct: (productId, patch, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            return pushVersion({
              ...product,
              visibility: patch.visibility,
              tags: patch.tags,
              keywords: patch.keywords,
              status: 'PENDING',
              updatedAt: now(),
            }, userId);
          }),
          cacheVersion: state.cacheVersion + 1,
          seoSignals: state.products
            .filter((item) => item.productId === productId)
            .map((item) => ({ id: uid('SEO-'), productId, keywords: patch.keywords, tags: patch.tags, createdAt: now() }))
            .concat(state.seoSignals)
            .slice(0, 200),
          audits: logAudit(state, userId, 'publish_product_requested', productId, { visibility: patch.visibility }),
          notifications: notify(state, 'approval', 'Product Pending Approval', `Product ${productId} is waiting for Boss approval.`),
        }));
      },

      updateProduct: (productId, patch, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            return pushVersion({ ...product, ...patch, updatedAt: now() }, userId);
          }),
          cacheVersion: state.cacheVersion + 1,
          audits: logAudit(state, userId, 'update_product', productId),
          notifications: notify(state, 'product_update', 'Product Updated', `Product ${productId} updated and cache refreshed.`),
        }));
      },

      setProductControl: (productId, control, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            const next = pushVersion({
              ...product,
              enabled: typeof control.enabled === 'boolean' ? control.enabled : product.enabled,
              basePrice: Number.isFinite(control.basePrice) ? Number(control.basePrice) : product.basePrice,
              discountPercent: Number.isFinite(control.discountPercent) ? Number(control.discountPercent) : product.discountPercent,
              status: typeof control.enabled === 'boolean' && !control.enabled ? 'INACTIVE' : product.status,
              updatedAt: now(),
            }, userId);
            return next;
          }),
          cacheVersion: state.cacheVersion + 1,
          audits: logAudit(state, userId, 'product_control_update', productId, control),
        }));
      },

      cloneProduct: (productId, userId) => {
        const source = get().products.find((product) => product.productId === productId);
        if (!source) return;
        const cloned = pushVersion({
          ...source,
          productId: uid('PRD-'),
          name: `${source.name} Copy`,
          status: 'DRAFT',
          enabled: false,
          sales: 0,
          views: 0,
          revenue: 0,
          createdAt: now(),
          updatedAt: now(),
          versions: [],
        }, userId);
        set((state) => ({
          products: [cloned, ...state.products],
          audits: logAudit(state, userId, 'clone_product', cloned.productId, { sourceProductId: productId }),
        }));
      },

      rollbackProductVersion: (productId, productVersionId, userId) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (product.productId !== productId) return product;
            const selected = product.versions.find((version) => version.productVersionId === productVersionId);
            if (!selected) return product;
            return pushVersion({ ...selected.snapshot, productId, updatedAt: now() }, userId);
          }),
          cacheVersion: state.cacheVersion + 1,
          audits: logAudit(state, userId, 'rollback_product_version', productId, { productVersionId }),
        }));
      },

      requestApproval: (productId, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId ? { ...product, status: 'PENDING', updatedAt: now() } : product),
          audits: logAudit(state, userId, 'product_approval_requested', productId),
        }));
      },

      approveProduct: (productId, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId ? { ...product, status: 'ACTIVE', enabled: true, updatedAt: now() } : product),
          cacheVersion: state.cacheVersion + 1,
          audits: logAudit(state, userId, 'product_approved_live', productId),
          notifications: notify(state, 'approval', 'Product Live', `Product ${productId} is now LIVE.`),
        }));
      },

      bulkAction: ({ productIds, action, value, userId }) => {
        set((state) => ({
          products: state.products.map((product) => {
            if (!productIds.includes(product.productId)) return product;
            if (action === 'enable') return { ...product, enabled: true, status: 'ACTIVE', updatedAt: now() };
            if (action === 'disable') return { ...product, enabled: false, status: 'INACTIVE', updatedAt: now() };
            if (action === 'price_update' && Number.isFinite(value)) return { ...product, basePrice: Number(value), updatedAt: now() };
            return product;
          }),
          cacheVersion: state.cacheVersion + 1,
          audits: logAudit(state, userId, 'bulk_action', undefined, { productIds, action, value }),
        }));
      },

      upsertCategory: (input) => {
        set((state) => {
          if (input.id) {
            return {
              categories: state.categories.map((cat) => cat.id === input.id ? { ...cat, name: input.name, description: input.description, productIds: input.productIds || cat.productIds } : cat),
              audits: logAudit(state, input.userId, 'update_category', input.id),
            };
          }
          const id = uid('CAT-');
          return {
            categories: [{ id, name: input.name, description: input.description, productIds: input.productIds || [] }, ...state.categories],
            audits: logAudit(state, input.userId, 'create_category', id),
          };
        });
      },

      setInventory: (productId, input) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId
            ? { ...product, stockLimited: input.stockLimited, stock: input.stockLimited ? input.stock : null, updatedAt: now() }
            : product),
          audits: logAudit(state, input.userId, 'set_inventory', productId, input),
        }));
      },

      setRegionLock: (productId, countries, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId ? { ...product, regionLocks: countries, updatedAt: now() } : product),
          audits: logAudit(state, userId, 'set_region_lock', productId, { countries }),
        }));
      },

      setFeatureFlag: (productId, flag, enabled, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId
            ? { ...product, featureFlags: { ...product.featureFlags, [flag]: enabled }, updatedAt: now() }
            : product),
          audits: logAudit(state, userId, 'set_feature_flag', productId, { flag, enabled }),
        }));
      },

      setABTest: (productId, test, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId ? { ...product, abTest: test, updatedAt: now() } : product),
          audits: logAudit(state, userId, 'set_ab_test', productId, test),
        }));
      },

      setDependency: (productId, dependencies, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId ? { ...product, dependencies, updatedAt: now() } : product),
          audits: logAudit(state, userId, 'set_product_dependency', productId, { dependencies }),
        }));
      },

      setPlanLimit: (productId, plan, limits, userId) => {
        set((state) => ({
          products: state.products.map((product) => product.productId === productId
            ? {
                ...product,
                plans: product.plans.map((entry) => entry.name === plan ? { ...entry, usageLimits: { ...entry.usageLimits, ...limits } } : entry),
                updatedAt: now(),
              }
            : product),
          audits: logAudit(state, userId, 'set_plan_limit', productId, { plan, limits }),
        }));
      },

      createOrderMock: (input) => {
        const order: MarketplaceOrder = {
          orderId: uid('ORD-'),
          productId: input.productId,
          amount: input.amount,
          status: input.status,
          userId: input.userId,
          createdAt: now(),
        };
        set((state) => ({
          orders: [order, ...state.orders].slice(0, 500),
          products: state.products.map((product) => product.productId === input.productId
            ? {
                ...product,
                sales: input.status === 'paid' ? product.sales + 1 : product.sales,
                revenue: input.status === 'paid' ? product.revenue + input.amount : product.revenue,
                views: product.views + 1,
                conversionRate: product.views > 0 ? ((input.status === 'paid' ? product.sales + 1 : product.sales) / (product.views + 1)) * 100 : product.conversionRate,
              }
            : product),
        }));
      },

      approveRefund: (orderId, userId) => {
        set((state) => {
          const order = state.orders.find((entry) => entry.orderId === orderId);
          if (!order) return {} as any;
          return {
            orders: state.orders.map((entry) => entry.orderId === orderId ? { ...entry, status: 'refund' } : entry),
            products: state.products.map((product) => product.productId === order.productId
              ? { ...product, revenue: Math.max(0, product.revenue - order.amount), sales: Math.max(0, product.sales - 1) }
              : product),
            audits: logAudit(state, userId, 'refund_approved_reverse_commission', orderId, { amount: order.amount }),
            notifications: notify(state, 'refund', 'Refund Approved', `Refund processed for ${orderId} and commission reversed.`),
          };
        });
      },

      sendSeoSignal: (productId) => {
        const product = get().products.find((item) => item.productId === productId);
        if (!product) return;
        set((state) => ({
          seoSignals: [{ id: uid('SEO-'), productId, keywords: product.keywords, tags: product.tags, createdAt: now() }, ...state.seoSignals].slice(0, 300),
        }));
      },

      createLeadSignal: (productId, source) => {
        set((state) => ({
          leadSignals: [{ id: uid('LED-'), productId, source, createdAt: now() }, ...state.leadSignals].slice(0, 300),
        }));
      },

      createSupportSignal: (productId, issue) => {
        set((state) => ({
          supportSignals: [{ id: uid('SUP-'), productId, issue, status: 'open', createdAt: now() }, ...state.supportSignals].slice(0, 300),
        }));
      },

      runAICeo: () => {
        set((state) => {
          const signals: AICeoSignal[] = [];
          state.products.forEach((product) => {
            if (product.conversionRate < 2 && product.views > 10) {
              signals.push({
                id: uid('AI-'),
                productId: product.productId,
                type: 'failing',
                suggestion: 'Low conversion detected. Suggest price A/B and campaign boost.',
                createdAt: now(),
              });
            } else if (product.sales > 10) {
              signals.push({
                id: uid('AI-'),
                productId: product.productId,
                type: 'trending',
                suggestion: 'Trending product. Increase visibility and SEO spend.',
                createdAt: now(),
              });
            }
            if (product.views > 20 && product.sales === 0) {
              signals.push({
                id: uid('AI-'),
                productId: product.productId,
                type: 'drop',
                suggestion: 'High view drop-off. Trigger discount and checkout UX test.',
                createdAt: now(),
              });
            }
           });
           return {
             aiSignals: [...signals, ...state.aiSignals].slice(0, 300),
           };
         });
       },

      setOffer: (input) => {
        set((state) => {
          const nextOffers = {
            globalDiscountPercent: Number.isFinite(input.globalDiscountPercent) ? Number(input.globalDiscountPercent) : state.offers.globalDiscountPercent,
            countryDiscount: { ...state.offers.countryDiscount },
          };
          if (input.country && Number.isFinite(input.percent)) {
            nextOffers.countryDiscount[input.country] = Number(input.percent);
          }
          return {
            offers: nextOffers,
            audits: logAudit(state, input.userId, 'set_offer', undefined, input),
            notifications: notify(state, 'offer_launch', 'Offer Updated', 'Global/Country offer updated for UI pricing layer.'),
          };
        });
      },

      canAccessProduct: ({ productId, hasLicense, hasSubscription, country }) => {
        const product = get().products.find((entry) => entry.productId === productId);
        if (!product || !product.enabled || product.status !== 'ACTIVE') return false;
        if (product.regionLocks.length > 0 && country && !product.regionLocks.includes(country)) return false;
        if (product.licenseRequired && !hasLicense && !hasSubscription) return false;
        if (product.stockLimited && (product.stock || 0) <= 0) return false;
        return true;
      },

      getDashboardMetrics: () => {
        const products = get().products;
        const totalProducts = products.length;
        const activeProducts = products.filter((entry) => entry.status === 'ACTIVE' && entry.enabled).length;
        const totalSales = products.reduce((sum, entry) => sum + entry.sales, 0);
        const totalRevenue = products.reduce((sum, entry) => sum + entry.revenue, 0);
        const topProducts = [...products]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((entry) => ({ productId: entry.productId, name: entry.name, sales: entry.sales, revenue: entry.revenue }));
        const lowConversion = [...products]
          .filter((entry) => entry.views > 0)
          .sort((a, b) => a.conversionRate - b.conversionRate)
          .slice(0, 5)
          .map((entry) => ({ productId: entry.productId, name: entry.name, conversionRate: entry.conversionRate }));

        return { totalProducts, activeProducts, totalSales, totalRevenue, topProducts, lowConversion };
      },
    }),
    {
      name: 'marketplace-manager-admin-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        orders: state.orders,
        audits: state.audits,
        notifications: state.notifications,
        seoSignals: state.seoSignals,
        leadSignals: state.leadSignals,
        supportSignals: state.supportSignals,
        aiSignals: state.aiSignals,
        cacheVersion: state.cacheVersion,
        offers: state.offers,
      }),
    },
  ),
);
