// @ts-nocheck
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export const ROLE_DASHBOARD_MAP: Record<AppRole, string> = {
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

const ROLE_PRIORITY: AppRole[] = [
  'boss_owner',
  'ceo',
  'super_admin',
  'admin',
  'developer',
  'continent_admin',
  'country_admin',
  'security_manager',
  'server_manager',
  'api_ai_manager',
  'finance_manager',
  'lead_manager',
  'marketing_manager',
  'seo_manager',
  'sales_support',
  'legal_manager',
  'hr_manager',
  'pro_manager',
  'task_manager',
  'product_manager',
  'demo_manager',
  'franchise_owner',
  'franchise_manager',
  'reseller',
  'reseller_manager',
  'influencer',
  'influencer_manager',
  'marketplace_manager',
  'license_manager',
  'deployment_manager',
  'analytics_manager',
  'notification_manager',
  'integration_manager',
  'audit_manager',
  'prime_user',
  'user',
];

export const selectBestRole = (roles: AppRole[]): AppRole | null => {
  if (roles.length === 0) return null;
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return roles[0];
};

export const getDashboardRouteForRole = (role: AppRole | null) => {
  if (!role) return '/user/dashboard';
  return ROLE_DASHBOARD_MAP[role] || '/user/dashboard';
};
