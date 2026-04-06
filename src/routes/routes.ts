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

  // Core role dashboards
  bossPanel: '/boss-panel',
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
  boss_owner: ROUTES.bossPanel,
  ceo: '/ai-ceo',
  super_admin: ROUTES.bossPanel,
  admin: ROUTES.bossPanel,
  developer: ROUTES.developerDashboard,
  franchise_owner: ROUTES.franchiseDashboard,
  franchise: ROUTES.franchiseDashboard,
  franchise_manager: '/franchise-manager',
  reseller: ROUTES.resellerDashboard,
  reseller_manager: '/reseller-manager/dashboard',
  influencer: ROUTES.influencerDashboard,
  influencer_manager: '/influencer-manager',
  lead_manager: '/lead-manager',
  marketing_manager: '/marketing-manager',
  seo_manager: '/seo-manager',
  sales_support: '/sales-support-manager',
  finance_manager: '/finance',
  legal_manager: '/legal',
  hr_manager: '/hr',
  task_manager: '/task-manager',
  product_manager: '/product-manager',
  demo_manager: '/demo-manager',
  server_manager: '/server-manager',
  api_ai_manager: '/api-ai-manager',
  continent_admin: '/continent-super-admin',
  country_admin: '/country-dashboard',
  security_manager: '/security-command',
  marketplace_manager: '/marketplace-manager/dashboard',
  license_manager: ROUTES.bossPanel,
  deployment_manager: '/server-manager',
  analytics_manager: ROUTES.bossPanel,
  notification_manager: ROUTES.bossPanel,
  integration_manager: ROUTES.bossPanel,
  audit_manager: ROUTES.bossPanel,
  prime_user: '/prime',
  user: ROUTES.userDashboard,
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
  ROUTES.developerDashboard,
  ROUTES.influencerDashboard,
  ROUTES.resellerDashboard,
  ROUTES.franchiseDashboard,
  ROUTES.bossApplications,
  ROUTES.notFound,
] as const;

export const getRoleDashboardRoute = (role?: string | null) => {
  return ROLE_DASHBOARD_ROUTE[role || ''] || ROUTES.app;
};
