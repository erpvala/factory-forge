// @ts-nocheck

export const ROUTES = {
  home: '/',
  app: '/app',
  notFound: '/404',

  // Auth
  auth: '/auth',
  login: '/login',
  register: '/register',
  pendingApproval: '/dashboard/pending',
  pendingApprovalLegacy: '/pending-approval',
  dashboardPending: '/dashboard/pending',
  accessDenied: '/access-denied',

  // Apply flow
  applyBase: '/apply',
  applyDeveloper: '/apply/developer',
  applyInfluencer: '/apply/influencer',
  applyReseller: '/apply/reseller',
  applyFranchise: '/apply/franchise',
  applyJob: '/apply/job',
  bossApplications: '/boss/applications',

  // Control Panel (single source of truth)
  controlPanel: '/control-panel',
  bossPanel: '/control-panel',

  // Legacy aliases kept for code compatibility
  developerDashboard: '/developer/dashboard',
  influencerDashboard: '/influencer/dashboard',
  resellerDashboard: '/reseller/dashboard',
  franchiseDashboard: '/franchise/dashboard',
  userDashboard: '/user/dashboard',
} as const;

export const APPLY_ROUTE_BY_ROLE = {
  developer: ROUTES.applyDeveloper,
  influencer: ROUTES.applyInfluencer,
  reseller: ROUTES.applyReseller,
  franchise: ROUTES.applyFranchise,
  job: ROUTES.applyJob,
} as const;

export const ROLE_DASHBOARD_ROUTE: Record<string, string> = {
  boss_owner: '/control-panel?module=boss-dashboard',
  ceo: '/control-panel?module=ceo-dashboard',
  super_admin: '/control-panel?module=boss-dashboard',
  admin: '/control-panel?module=boss-dashboard',
  developer: '/control-panel?module=developer-dashboard',
  franchise_owner: '/control-panel?module=franchise-manager',
  franchise: '/control-panel?module=franchise-manager',
  franchise_manager: '/control-panel?module=franchise-manager',
  reseller: '/control-panel?module=reseller-manager',
  reseller_manager: '/control-panel?module=reseller-manager',
  influencer: '/control-panel?module=influencer-manager',
  influencer_manager: '/control-panel?module=influencer-manager',
  lead_manager: '/control-panel?module=lead-manager',
  marketing_manager: '/control-panel?module=marketing-manager',
  seo_manager: '/control-panel?module=seo-manager',
  sales_support: '/control-panel?module=sales-manager',
  finance_manager: '/control-panel?module=finance-manager',
  legal_manager: '/control-panel?module=legal-manager',
  hr_manager: '/control-panel?module=hr-manager',
  pro_manager: '/control-panel?module=pro-manager',
  task_manager: '/control-panel?module=task-manager',
  product_manager: '/control-panel?module=product-manager',
  demo_manager: '/control-panel?module=demo-manager',
  server_manager: '/control-panel?module=server-manager',
  api_ai_manager: '/control-panel?module=ai-api-manager',
  continent_admin: '/control-panel?module=continent-admin',
  country_admin: '/control-panel?module=country-admin',
  security_manager: '/control-panel?module=security-manager',
  marketplace_manager: '/control-panel?module=marketplace-manager',
  license_manager: '/control-panel?module=license-manager',
  deployment_manager: '/control-panel?module=deployment-manager',
  analytics_manager: '/control-panel?module=analytics-manager',
  notification_manager: '/control-panel?module=notification-manager',
  integration_manager: '/control-panel?module=integration-manager',
  audit_manager: '/control-panel?module=audit-logs-manager',
  prime_user: '/control-panel?module=user-dashboard',
  user: '/control-panel?module=user-dashboard',
};

export const CORE_ROUTE_REGISTRY = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.applyDeveloper,
  ROUTES.applyInfluencer,
  ROUTES.applyReseller,
  ROUTES.applyFranchise,
  ROUTES.applyJob,
  ROUTES.dashboardPending,
  ROUTES.pendingApprovalLegacy,
  ROUTES.pendingApproval,
  ROUTES.controlPanel,
  ROUTES.bossApplications,
  ROUTES.notFound,
] as const;

export const getRoleDashboardRoute = (role?: string | null) => {
  return ROLE_DASHBOARD_ROUTE[role || ''] || '/control-panel?module=user-dashboard';
};
