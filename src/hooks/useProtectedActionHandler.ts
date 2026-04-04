// @ts-nocheck
/**
 * Role → Dashboard route mapping for all 34+ roles
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';

export const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login';
export const REDIRECT_AFTER_LOGIN_ROLE_KEY = 'redirect_after_login_role';

export const setRedirectAfterLogin = (route: string, role?: AppRole | null) => {
  localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, route);
  if (role) localStorage.setItem(REDIRECT_AFTER_LOGIN_ROLE_KEY, role);
  else localStorage.removeItem(REDIRECT_AFTER_LOGIN_ROLE_KEY);
};

export const getRedirectAfterLogin = () => localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
export const getRedirectRoleAfterLogin = (): AppRole | null =>
  (localStorage.getItem(REDIRECT_AFTER_LOGIN_ROLE_KEY) as AppRole | null) || null;

export const clearRedirectAfterLogin = () => {
  localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
  localStorage.removeItem(REDIRECT_AFTER_LOGIN_ROLE_KEY);
};

/** Maps each role to its primary dashboard route */
export const getDefaultDashboardRoute = (role?: AppRole | null): string => {
  const map: Record<string, string> = {
    boss_owner: '/boss-panel',
    ceo: '/ai-ceo',
    super_admin: '/super-admin',
    admin: '/super-admin-system',
    developer: '/developer',
    franchise_owner: '/franchise',
    franchise_manager: '/franchise-manager',
    reseller: '/reseller',
    reseller_manager: '/reseller-manager',
    influencer: '/influencer',
    influencer_manager: '/influencer-manager',
    lead_manager: '/lead-manager',
    marketing_manager: '/marketing-manager',
    seo_manager: '/seo-manager',
    sales_support: '/sales-support',
    finance_manager: '/finance',
    legal_manager: '/legal-manager',
    hr_manager: '/hr-manager',
    pro_manager: '/pro-manager',
    task_manager: '/task-manager',
    product_manager: '/product-manager',
    demo_manager: '/demo-manager',
    server_manager: '/server-manager',
    api_ai_manager: '/api-ai-manager',
    continent_admin: '/continent-super-admin',
    country_admin: '/country-dashboard',
    security_manager: '/security-command',
    marketplace_manager: '/marketplace-manager',
    license_manager: '/boss-panel',
    deployment_manager: '/server-manager',
    analytics_manager: '/boss-panel',
    notification_manager: '/boss-panel',
    integration_manager: '/boss-panel',
    audit_manager: '/boss-panel',
    prime_user: '/prime',
    user: '/user/dashboard',
  };
  return map[role || ''] || '/user/dashboard';
};

export const useProtectedActionHandler = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleAction = useCallback((actionKey: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const route = getDefaultDashboardRoute(userRole);
    navigate(route);
  }, [user, userRole, navigate]);

  return { handleAction };
};

export default useProtectedActionHandler;
