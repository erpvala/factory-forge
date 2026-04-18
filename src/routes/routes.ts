// @ts-nocheck

export const ROUTES = {
  home: '/',
  app: '/app',
  notFound: '/404',
  controlPanelBase: '/control-panel',
  controlPanelDashboard: '/control-panel/dashboard',

  // Auth
  auth: '/auth',
  login: '/login',
  register: '/register',
  pendingApproval: '/login',
  pendingApprovalLegacy: '/pending-approval',
  dashboardPending: '/login',
  accessDenied: '/access-denied',

  // Apply flow
  applyBase: '/apply',
  applyDeveloper: '/apply/developer',
  applyInfluencer: '/apply/influencer',
  applyReseller: '/apply/reseller',
  applyFranchise: '/apply/franchise',
  applyJob: '/apply/job',
  bossApplications: '/control-panel',

  // Control Panel and role dashboards
  controlPanel: '/control-panel',
  bossPanel: '/control-panel',
  developerDashboard: '/control-panel/developer-dashboard',
  influencerDashboard: '/control-panel/influencer-dashboard',
  resellerDashboard: '/control-panel/reseller-dashboard',
  franchiseDashboard: '/control-panel/franchise-dashboard',
  userDashboard: '/control-panel',
} as const;

export const APPLY_ROUTE_BY_ROLE = {
  developer: ROUTES.applyDeveloper,
  influencer: ROUTES.applyInfluencer,
  reseller: ROUTES.applyReseller,
  franchise: ROUTES.applyFranchise,
  job: ROUTES.applyJob,
} as const;

export const ROLE_DASHBOARD_ROUTE: Record<string, string> = {
  boss_owner: ROUTES.bossPanel,
  ceo: '/control-panel/ceo-dashboard',
  super_admin: ROUTES.bossPanel,
  admin: ROUTES.bossPanel,
  developer: '/control-panel/developer-dashboard',
  franchise_owner: ROUTES.franchiseDashboard,
  franchise: ROUTES.franchiseDashboard,
  franchise_manager: '/control-panel/franchise-manager',
  reseller: ROUTES.resellerDashboard,
  reseller_manager: '/control-panel/reseller-manager',
  influencer: ROUTES.influencerDashboard,
  influencer_manager: '/control-panel/influencer-manager',
  lead_manager: '/control-panel/lead-manager',
  marketing_manager: '/control-panel/marketing-manager',
  seo_manager: '/control-panel/seo-manager',
  sales_support: '/control-panel/customer-support',
  finance_manager: '/control-panel/finance-manager',
  legal_manager: '/control-panel/legal-manager',
  hr_manager: '/hr',
  task_manager: '/control-panel/task-manager',
  product_manager: '/control-panel/product-manager',
  demo_manager: '/control-panel/demo-manager',
  server_manager: '/control-panel/server-manager',
  api_ai_manager: '/control-panel/ai-api-manager',
  continent_admin: '/control-panel/continent-admin',
  country_admin: '/control-panel/country-admin',
  security_manager: '/control-panel/security-manager',
  marketplace_manager: '/control-panel/marketplace-manager',
  license_manager: '/control-panel/license-manager',
  deployment_manager: '/control-panel/deployment-manager',
  analytics_manager: '/control-panel/analytics-manager',
  notification_manager: '/control-panel/notification-manager',
  integration_manager: '/control-panel/integration-manager',
  audit_manager: '/control-panel/audit-logs-manager',
  prime_user: '/control-panel/pro-manager',
  user: ROUTES.controlPanelBase,
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
  ROUTES.developerDashboard,
  ROUTES.influencerDashboard,
  ROUTES.resellerDashboard,
  ROUTES.franchiseDashboard,
  ROUTES.notFound,
] as const;

export const getRoleDashboardRoute = (role?: string | null) => {
  return ROLE_DASHBOARD_ROUTE[role || ''] || '/control-panel?module=user-dashboard';
};
