// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { callEdgeRoute } from '@/lib/api/edge-client';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useMarketplaceEcosystemStore } from '@/stores/marketplaceEcosystemStore';
import { queue_async_job, track_marketplace_event } from '@/marketplace/workflow';

export interface MarketplaceProduct {
  product_id: string;
  product_name: string;
  category: string | null;
  description: string | null;
  pricing_model: string | null;
  lifetime_price: number | null;
  monthly_price: number | null;
  features: string[];
  tech_stack: string[];
  demo_id: string | null;
  has_broken_demo: boolean;
}

export interface MarketplaceCategory {
  id: string;
  label: string;
  count: number;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  category: string | null;
  final_amount: number;
  gross_amount: number;
  discount_percent: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  license_key: string | null;
  client_domain: string | null;
  requirements: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface CatalogResponse {
  items: MarketplaceProduct[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  categories: MarketplaceCategory[];
}

interface OrdersResponse {
  items: MarketplaceOrder[];
}

interface CreateOrderInput {
  productId: string;
  paymentMethod: 'wallet' | 'upi' | 'bank' | 'crypto';
  clientDomain?: string;
  requirements?: string;
  externalReference?: string;
}

interface JoinFranchiseInput {
  selectedPlan: string;
  city: string;
  businessType: string;
  businessName?: string;
}

interface JoinFranchiseResponse {
  success: boolean;
  message: string;
  franchise_id: string;
  dashboard_route: string;
  manager_route: string;
  redirect_to: string;
  linked_products: number;
  linked_revenue_orders: number;
}

interface JoinResellerInput {
  country: string;
  state?: string;
  city?: string;
  businessType: string;
  businessName?: string;
}

interface JoinResellerResponse {
  success: boolean;
  message: string;
  reseller_id: string;
  dashboard_route: string;
  manager_route: string;
  redirect_to: string;
  linked_products: number;
  linked_revenue_orders: number;
}

interface JoinInfluencerInput {
  fullName?: string;
  platform: string;
  niche: string;
  followersCount?: number;
  socialHandle?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
}

interface JoinInfluencerResponse {
  success: boolean;
  message: string;
  influencer_id: string;
  dashboard_route: string;
  manager_route: string;
  redirect_to: string;
  linked_products: number;
  link_id: string | null;
  status: string;
}

interface JoinDeveloperResponse {
  success: boolean;
  message: string;
  application_id: string;
  redirect_to: string;
}

const PAGE_SIZE = 18;
const CATALOG_CACHE_TTL_MS = 120_000;
const catalogCache = new Map<string, { payload: CatalogResponse; timestamp: number }>();

interface FavouriteItem {
  product_id: string;
}

interface FavouriteListResponse {
  items: FavouriteItem[];
}

interface FavouriteToggleResponse {
  action: 'added' | 'removed';
  product_id: string;
}

export function useMarketplace() {
  const { log } = useActivityLogger();
  const trackApplyClick = useMarketplaceEcosystemStore((state) => state.trackApplyClick);
  const trackFavourite = useMarketplaceEcosystemStore((state) => state.trackFavourite);
  const createPendingCheckout = useMarketplaceEcosystemStore((state) => state.createPendingCheckout);
  const sendNotification = useMarketplaceEcosystemStore((state) => state.sendNotification);
  const setCountryContext = useMarketplaceEcosystemStore((state) => state.setCountryContext);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([{ id: 'all', label: 'All Products', count: 0 }]);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isJoiningFranchise, setIsJoiningFranchise] = useState(false);
  const [isJoiningReseller, setIsJoiningReseller] = useState(false);
  const [isJoiningInfluencer, setIsJoiningInfluencer] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCatalog = useCallback(async (nextPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsCatalogLoading(true);
    }

    try {
      const cacheKey = JSON.stringify({ page: nextPage, search, category });
      const cached = catalogCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CATALOG_CACHE_TTL_MS) {
        const data = cached.payload;
        setProducts((prev) => {
          if (!append) return data.items;
          const existing = new Set(prev.map((item) => item.product_id));
          return [...prev, ...data.items.filter((item) => !existing.has(item.product_id))];
        });
        setCategories([{ id: 'all', label: 'All Products', count: data.total }, ...data.categories]);
        setPage(data.page);
        setHasMore(data.page < data.total_pages);
        return;
      }

      const response = await callEdgeRoute<CatalogResponse>('api-marketplace', 'catalog', {
        query: {
          page: nextPage,
          limit: PAGE_SIZE,
          search: search || undefined,
          category: category === 'all' ? undefined : category,
        },
      });

      setProducts((prev) => {
        if (!append) {
          return response.data.items;
        }

        const existing = new Set(prev.map((item) => item.product_id));
        const merged = [...prev];
        response.data.items.forEach((item) => {
          if (!existing.has(item.product_id)) {
            merged.push(item);
          }
        });
        return merged;
      });
      setCategories([{ id: 'all', label: 'All Products', count: response.data.total }, ...response.data.categories]);
      setPage(response.data.page);
      setHasMore(response.data.page < response.data.total_pages);
      catalogCache.set(cacheKey, { payload: response.data, timestamp: Date.now() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load marketplace');
    } finally {
      setIsCatalogLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, search]);

  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const response = await callEdgeRoute<OrdersResponse>('api-marketplace', 'orders');
      setOrders(response.data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || isLoadingMore || isCatalogLoading) {
      return;
    }

    await fetchCatalog(page + 1, true);
  }, [fetchCatalog, hasMore, isCatalogLoading, isLoadingMore, page]);

  const refreshCatalog = useCallback(async () => {
    await fetchCatalog(1, false);
  }, [fetchCatalog]);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    setIsSubmittingOrder(true);
    try {
      if (!input.productId) {
        throw new Error('product_id is required');
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw authError;
      }

      const user = authData.user;
      if (!user) {
        throw new Error('Please sign in before purchasing');
      }

      const pendingOrderId = createPendingCheckout({
        productId: input.productId,
        userId: user.id,
        amount: 0,
        paymentMethod: input.paymentMethod,
      });

      track_marketplace_event({
        event_type: 'click',
        product_id: input.productId,
        user_id: user.id,
        metadata: {
          payment_method: input.paymentMethod,
          pending_order_id: pendingOrderId,
        },
      });

      void log({
        actionType: 'checkout_attempt',
        entityType: 'marketplace_product',
        entityId: input.productId,
        severity: 'info',
        metadata: {
          payment_method: input.paymentMethod,
          client_domain: input.clientDomain || null,
          pending_order_id: pendingOrderId,
        },
      });

      const response = await callEdgeRoute<{
        payment_url: string;
        order_id: string;
      }>('api-create-payment', '', {
        method: 'POST',
        body: {
          product_id: input.productId,
          user_id: user.id,
        },
      });

      if (!response.data.payment_url) {
        throw new Error('Payment URL was not returned');
      }

      sendNotification({
        type: 'in_app',
        subject: 'Checkout Started',
        message: `Order ${response.data.order_id} is pending payment verification.`,
        userId: user.id,
      });

      queue_async_job('email', {
        user_id: user.id,
        product_id: input.productId,
        order_id: response.data.order_id,
        template: 'checkout_started',
      });

      window.location.assign(response.data.payment_url);
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
      return null;
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [createPendingCheckout, log, sendNotification]);

  const joinFranchise = useCallback(async (input: JoinFranchiseInput) => {
    setIsJoiningFranchise(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        trackApplyClick('franchise', null);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return null;
      }

      const response = await callEdgeRoute<JoinFranchiseResponse>('api-marketplace', 'join-franchise', {
        method: 'POST',
        body: {
          selected_plan: input.selectedPlan,
          city: input.city,
          business_type: input.businessType,
          business_name: input.businessName,
        },
      });

      trackApplyClick('franchise', authData.user.id);
      void log({ actionType: 'franchise_apply', entityType: 'application', severity: 'info', metadata: { city: input.city, plan: input.selectedPlan } });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join franchise');
      return null;
    } finally {
      setIsJoiningFranchise(false);
    }
  }, [log, trackApplyClick]);

  const joinReseller = useCallback(async (input: JoinResellerInput) => {
    setIsJoiningReseller(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        trackApplyClick('reseller', null);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return null;
      }

      const response = await callEdgeRoute<JoinResellerResponse>('api-marketplace', 'join-reseller', {
        method: 'POST',
        body: {
          country: input.country,
          state: input.state,
          city: input.city,
          business_type: input.businessType,
          business_name: input.businessName,
        },
      });

      trackApplyClick('reseller', authData.user.id);
      void log({ actionType: 'reseller_inquiry', entityType: 'application', severity: 'info', metadata: { country: input.country, city: input.city || null } });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join reseller');
      return null;
    } finally {
      setIsJoiningReseller(false);
    }
  }, [log, trackApplyClick]);

  const joinInfluencer = useCallback(async (input: JoinInfluencerInput) => {
    setIsJoiningInfluencer(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        trackApplyClick('influencer', null);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return null;
      }

      const response = await callEdgeRoute<JoinInfluencerResponse>('api-marketplace', 'join-influencer', {
        method: 'POST',
        body: {
          full_name: input.fullName,
          platform: input.platform,
          niche: input.niche,
          followers_count: input.followersCount,
          social_handle: input.socialHandle,
          city: input.city,
          state: input.state,
          country: input.country,
          bio: input.bio,
        },
      });

      trackApplyClick('influencer', authData.user.id);
      void log({ actionType: 'influencer_join', entityType: 'application', severity: 'info', metadata: { platform: input.platform, niche: input.niche } });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join influencer program');
      return null;
    } finally {
      setIsJoiningInfluencer(false);
    }
  }, [log, trackApplyClick]);

  const joinDeveloper = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        trackApplyClick('developer', null);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return null;
      }

      const application = trackApplyClick('developer', authData.user.id);

      await supabase.from('role_requests').insert({
        user_id: authData.user.id,
        requested_role: 'developer',
        status: 'approved',
      });

      await supabase.from('user_roles').upsert({
        user_id: authData.user.id,
        role: 'developer',
        approval_status: 'approved',
      }, {
        onConflict: 'user_id,role',
      });

      sendNotification({
        type: 'email',
        subject: 'Developer Access Approved',
        message: 'Developer dashboard access is now active in demo mode.',
        userId: authData.user.id,
      });

      void log({ actionType: 'job_apply', entityType: 'application', entityId: application.applicationId, severity: 'info', metadata: { role: 'developer' } });

      const response: JoinDeveloperResponse = {
        success: true,
        message: 'Developer access approved in demo mode.',
        application_id: application.applicationId,
        redirect_to: application.redirectTo,
      };
      toast.success(response.message);
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join developer program');
      return null;
    }
  }, [log, sendNotification, trackApplyClick]);

  useEffect(() => {
    setCountryContext();
  }, [setCountryContext]);

  useEffect(() => {
    void fetchCatalog(1, false);
  }, [fetchCatalog]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const fetchFavourites = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const response = await callEdgeRoute<FavouriteListResponse>('api-marketplace', 'favourite/list');
      const ids = new Set((response.data.items || []).map((f) => f.product_id));
      setFavourites(ids);
    } catch {
      // Silently fail - favourites are a non-critical feature
    }
  }, []);

  const toggleFavourite = useCallback(async (productId: string) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error('Please sign in to save favourites');
      return;
    }
    // Optimistic update
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
    try {
      const response = await callEdgeRoute<FavouriteToggleResponse>('api-marketplace', 'favourite/toggle', {
        method: 'POST',
        body: { product_id: productId },
      });
      if (response.data.action === 'added') {
        trackFavourite(productId, authData.user.id);
        toast.success('Added to favourites');
      } else {
        toast.success('Removed from favourites');
      }
    } catch (error) {
      // Revert optimistic update on failure
      setFavourites((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to update favourite');
    }
  }, [trackFavourite]);

  useEffect(() => {
    void fetchFavourites();
  }, [fetchFavourites]);

  return {
    products,
    orders,
    categories,
    favourites,
    search,
    setSearch,
    category,
    setCategory,
    isCatalogLoading,
    isOrdersLoading,
    isSubmittingOrder,
    isJoiningFranchise,
    isJoiningReseller,
    isJoiningInfluencer,
    isLoadingMore,
    hasMore,
    refreshCatalog,
    refreshOrders: fetchOrders,
    createOrder,
    toggleFavourite,
    joinFranchise,
    joinReseller,
    joinInfluencer,
    joinDeveloper,
    loadMoreProducts,
  };
}
