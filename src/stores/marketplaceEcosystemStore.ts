// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildLicenseLock } from '@/ai/license-engine';
import { create_uuid } from '@/marketplace/workflow';

export type ApplyProgram = 'reseller' | 'franchise' | 'influencer' | 'developer';

export interface MarketplaceBanner {
  id: string;
  title: string;
  type: 'campaign' | 'featured_product';
  subtitle: string;
  target: string;
  productId?: string;
  accent: string;
}

export interface CountryOffer {
  country: string;
  festival: string;
  discountPercent: number;
  highlightedCategories: string[];
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  category?: string | null;
  licenseRequired: boolean;
}

export interface MarketplaceApplication {
  applicationId: string;
  program: ApplyProgram;
  userId: string | null;
  status: 'pending' | 'approved';
  createdAt: string;
  redirectTo: string;
}

export interface MarketplaceAnalyticsEvent {
  id: string;
  type:
    | 'apply_click'
    | 'banner_click'
    | 'product_view'
    | 'add_favorite'
    | 'add_cart'
    | 'checkout'
    | 'payment_success'
    | 'license_issued'
    | 'support_ticket'
    | 'notification_sent';
  userId?: string | null;
  productId?: string | null;
  orderId?: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface MarketplaceLicense {
  licenseId: string;
  orderId: string;
  userId: string;
  productId: string;
  accessStatus: 'active' | 'revoked';
  deviceBound: boolean;
  domain?: string | null;
  createdAt: string;
  lock: ReturnType<typeof buildLicenseLock>;
}

export interface SupportTicket {
  ticketId: string;
  productId: string;
  userId?: string | null;
  issue: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface MarketplaceNotification {
  id: string;
  type: 'email' | 'in_app';
  subject: string;
  message: string;
  userId?: string | null;
  createdAt: string;
}

export interface MarketplaceAIPulse {
  id: string;
  productId?: string | null;
  action: 'boost_product' | 'suggest_discount' | 'trigger_banner';
  reason: string;
  createdAt: string;
}

const DEFAULT_BANNERS: MarketplaceBanner[] = [
  {
    id: 'bnr-growth-stack',
    title: 'Growth Stack Campaign',
    type: 'campaign',
    subtitle: 'Push high-conversion ERP, CRM, and POS suites this week.',
    target: '/marketplace',
    accent: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'bnr-featured-hms',
    title: 'Featured Product: Hospital HMS',
    type: 'featured_product',
    subtitle: 'High-ticket product with strong franchise demand.',
    target: '/marketplace',
    productId: 'prod-hospital-hms',
    accent: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'bnr-license-fastlane',
    title: 'Instant License Issuance',
    type: 'campaign',
    subtitle: 'Wallet purchases activate access and provisioning in one pass.',
    target: '/marketplace',
    accent: 'from-amber-500/20 to-orange-500/20',
  },
];

const COUNTRY_OFFERS: CountryOffer[] = [
  { country: 'India', festival: 'Gudi Padwa Launch', discountPercent: 40, highlightedCategories: ['ERP', 'POS', 'CRM'] },
  { country: 'UAE', festival: 'Ramadan Commerce Push', discountPercent: 40, highlightedCategories: ['Retail', 'Payments', 'Marketplace'] },
  { country: 'Nigeria', festival: 'Growth Sprint', discountPercent: 40, highlightedCategories: ['CRM', 'School', 'Finance'] },
  { country: 'Singapore', festival: 'APAC Expansion Week', discountPercent: 40, highlightedCategories: ['AI', 'HRM', 'Enterprise'] },
  { country: 'United States', festival: 'Spring Revenue Drive', discountPercent: 40, highlightedCategories: ['SaaS', 'Support', 'Automation'] },
];

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function detectCountry() {
  const locale = typeof navigator !== 'undefined' ? navigator.language || 'en-IN' : 'en-IN';
  const region = locale.split('-')[1]?.toUpperCase();
  const regionMap: Record<string, string> = {
    IN: 'India',
    AE: 'UAE',
    NG: 'Nigeria',
    SG: 'Singapore',
    US: 'United States',
    GB: 'United Kingdom',
  };
  return regionMap[region || 'IN'] || 'India';
}

interface MarketplaceEcosystemState {
  detectedCountry: string;
  countryOffer: CountryOffer;
  banners: MarketplaceBanner[];
  cart: CartItem[];
  applications: MarketplaceApplication[];
  analytics: MarketplaceAnalyticsEvent[];
  licenses: MarketplaceLicense[];
  supportTickets: SupportTicket[];
  notifications: MarketplaceNotification[];
  aiPulses: MarketplaceAIPulse[];
  bossOverrides: Record<string, { priceOverride?: number; enabled?: boolean }>;
  setCountryContext: (country?: string) => void;
  trackApplyClick: (program: ApplyProgram, userId?: string | null) => MarketplaceApplication;
  trackBannerClick: (banner: MarketplaceBanner, userId?: string | null) => void;
  trackProductView: (product: { productId: string; category?: string | null }, userId?: string | null) => void;
  trackFavourite: (productId: string, userId?: string | null) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createPendingCheckout: (params: { productId: string; userId?: string | null; amount: number; paymentMethod: string }) => string;
  markPaymentSuccess: (params: { orderId: string; productId: string; userId: string; clientDomain?: string | null }) => MarketplaceLicense;
  createSupportTicket: (params: { productId: string; userId?: string | null; issue: string }) => SupportTicket;
  sendNotification: (params: { type: 'email' | 'in_app'; subject: string; message: string; userId?: string | null }) => void;
  setBossOverride: (productId: string, override: { priceOverride?: number; enabled?: boolean }) => void;
}

export const useMarketplaceEcosystemStore = create<MarketplaceEcosystemState>()(
  persist(
    (set, get) => ({
      detectedCountry: detectCountry(),
      countryOffer: COUNTRY_OFFERS.find((offer) => offer.country === detectCountry()) || COUNTRY_OFFERS[0],
      banners: DEFAULT_BANNERS,
      cart: [],
      applications: [],
      analytics: [],
      licenses: [],
      supportTickets: [],
      notifications: [],
      aiPulses: [],
      bossOverrides: {},

      setCountryContext: (country) => {
        const nextCountry = country || detectCountry();
        const offer = COUNTRY_OFFERS.find((entry) => entry.country === nextCountry) || COUNTRY_OFFERS[0];
        set({ detectedCountry: nextCountry, countryOffer: offer });
      },

      trackApplyClick: (program, userId) => {
        const redirectMap: Record<ApplyProgram, string> = {
          reseller: '/reseller/dashboard',
          franchise: '/franchise/dashboard',
          influencer: '/influencer/dashboard',
          developer: '/developer/dashboard',
        };
        const application = {
          applicationId: uid('APP-'),
          program,
          userId: userId || null,
          status: 'approved' as const,
          createdAt: now(),
          redirectTo: redirectMap[program],
        };
        set((state) => ({
          applications: [application, ...state.applications].slice(0, 100),
          analytics: [{ id: uid('EVT-'), type: 'apply_click', userId: userId || null, metadata: { program }, createdAt: now() }, ...state.analytics].slice(0, 400),
          notifications: [{ id: uid('NTF-'), type: 'in_app', subject: 'Application Submitted', message: `${program} access approved in demo mode.`, userId: userId || null, createdAt: now() }, ...state.notifications].slice(0, 300),
        }));
        return application;
      },

      trackBannerClick: (banner, userId) => {
        set((state) => ({
          analytics: [{ id: uid('EVT-'), type: 'banner_click', userId: userId || null, productId: banner.productId || null, metadata: { bannerId: banner.id, target: banner.target }, createdAt: now() }, ...state.analytics].slice(0, 400),
        }));
      },

      trackProductView: (product, userId) => {
        const previousViews = get().analytics.filter((entry) => entry.productId === product.productId && entry.type === 'product_view').length;
        set((state) => ({
          analytics: [{ id: uid('EVT-'), type: 'product_view', userId: userId || null, productId: product.productId, metadata: { category: product.category || null }, createdAt: now() }, ...state.analytics].slice(0, 400),
          aiPulses: previousViews >= 2
            ? [{ id: uid('AI-'), productId: product.productId, action: 'boost_product', reason: 'Repeated product views detected with no checkout.', createdAt: now() }, ...state.aiPulses].slice(0, 120)
            : state.aiPulses,
        }));
      },

      trackFavourite: (productId, userId) => {
        set((state) => ({
          analytics: [{ id: uid('EVT-'), type: 'add_favorite', userId: userId || null, productId, metadata: {}, createdAt: now() }, ...state.analytics].slice(0, 400),
        }));
      },

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((entry) => entry.productId === item.productId);
          return {
            cart: existing
              ? state.cart.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry)
              : [...state.cart, { ...item, quantity: 1 }],
            analytics: [{ id: uid('EVT-'), type: 'add_cart', productId: item.productId, metadata: { category: item.category || null }, createdAt: now() }, ...state.analytics].slice(0, 400),
          };
        });
      },

      removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((entry) => entry.productId !== productId) })),

      clearCart: () => set({ cart: [] }),

      createPendingCheckout: ({ productId, userId, amount, paymentMethod }) => {
        const orderId = create_uuid();
        set((state) => ({
          analytics: [{ id: uid('EVT-'), type: 'checkout', productId, userId: userId || null, orderId, metadata: { amount, paymentMethod }, createdAt: now() }, ...state.analytics].slice(0, 400),
        }));
        return orderId;
      },

      markPaymentSuccess: ({ orderId, productId, userId, clientDomain }) => {
        const license = {
          licenseId: uid('LIC-'),
          orderId,
          userId,
          productId,
          accessStatus: 'active' as const,
          deviceBound: true,
          domain: clientDomain || null,
          createdAt: now(),
          lock: buildLicenseLock({ userId, orderId, productId, domain: clientDomain || null }),
        };
        set((state) => ({
          licenses: [license, ...state.licenses].slice(0, 300),
          analytics: [
            { id: uid('EVT-'), type: 'payment_success', productId, userId, orderId, metadata: {}, createdAt: now() },
            { id: uid('EVT-'), type: 'license_issued', productId, userId, orderId, metadata: { licenseId: license.licenseId }, createdAt: now() },
            ...state.analytics,
          ].slice(0, 400),
          notifications: [
            { id: uid('NTF-'), type: 'email', subject: 'Order Success', message: `Order ${orderId} completed successfully.`, userId, createdAt: now() },
            { id: uid('NTF-'), type: 'in_app', subject: 'License Issued', message: `License ${license.licenseId} is now active.`, userId, createdAt: now() },
            ...state.notifications,
          ].slice(0, 300),
        }));
        return license;
      },

      createSupportTicket: ({ productId, userId, issue }) => {
        const ticket = { ticketId: uid('TCK-'), productId, userId: userId || null, issue, status: 'open' as const, createdAt: now() };
        set((state) => ({
          supportTickets: [ticket, ...state.supportTickets].slice(0, 200),
          analytics: [{ id: uid('EVT-'), type: 'support_ticket', userId: userId || null, productId, metadata: { issue }, createdAt: now() }, ...state.analytics].slice(0, 400),
        }));
        return ticket;
      },

      sendNotification: ({ type, subject, message, userId }) => {
        set((state) => ({
          notifications: [{ id: uid('NTF-'), type, subject, message, userId: userId || null, createdAt: now() }, ...state.notifications].slice(0, 300),
          analytics: [{ id: uid('EVT-'), type: 'notification_sent', userId: userId || null, metadata: { subject, channel: type }, createdAt: now() }, ...state.analytics].slice(0, 400),
        }));
      },

      setBossOverride: (productId, override) => {
        set((state) => ({
          bossOverrides: { ...state.bossOverrides, [productId]: { ...state.bossOverrides[productId], ...override } },
          aiPulses: [{ id: uid('AI-'), productId, action: 'trigger_banner', reason: 'Boss panel product override updated.', createdAt: now() }, ...state.aiPulses].slice(0, 120),
        }));
      },
    }),
    {
      name: 'marketplace-ecosystem-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        detectedCountry: state.detectedCountry,
        countryOffer: state.countryOffer,
        cart: state.cart,
        applications: state.applications,
        analytics: state.analytics,
        licenses: state.licenses,
        supportTickets: state.supportTickets,
        notifications: state.notifications,
        aiPulses: state.aiPulses,
        bossOverrides: state.bossOverrides,
      }),
    },
  ),
);