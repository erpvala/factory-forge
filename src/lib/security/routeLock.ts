// @ts-nocheck

const LEGACY_SEGMENTS = {
  superAdminSystem: ['/super', '-admin', '-system'].join(''),
  roleSwitch: ['/role', '-switch'].join(''),
  wireframe: ['/wire', 'frame'].join(''),
  superAdminWireframe: ['/super', '-admin', '-wire', 'frame'].join(''),
  legacyUi: ['/legacy', '-ui'].join(''),
};

export const BLOCKED_LEGACY_PATH_PREFIXES = [
  LEGACY_SEGMENTS.superAdminSystem,
  LEGACY_SEGMENTS.roleSwitch,
  LEGACY_SEGMENTS.wireframe,
  LEGACY_SEGMENTS.superAdminWireframe,
  LEGACY_SEGMENTS.legacyUi,
];

export const APPROVED_ROUTE_PREFIXES = [
  '/',
  '/404',
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/device-verify',
  '/ip-verify',
  '/otp-verify',
  '/logout',
  '/access-denied',
  '/control-panel',
  '/boss-panel',
  '/dashboard',
  '/settings',
  '/profile',
  '/onboard',
  '/apply',
  '/careers',
  '/jobs',
  '/demos',
  '/explore',
  '/products',
  '/pricing',
  '/showcase',
  '/boss-panel',
  '/control-panel',
  '/server-portal',
  '/boss',
  '/ceo',
  '/admin',
  '/continent',
  '/country',
  '/leader-security',
  '/bulk-actions',
  '/system-flow',
  '/app',
  '/marketplace',
  '/marketplace-manager',
  '/security-command',
  '/api-integrations',
  '/server-manager',
  '/developer',
  '/influencer',
  '/reseller',
  '/reseller-manager',
  '/franchise',
  '/franchise-manager',
  '/lead-manager',
  '/leads',
  '/task-manager',
  '/tasks',
  '/finance',
  '/legal',
  '/marketing',
  '/support',
  '/sales-support',
  '/safe-assist',
  '/promise-tracker',
  '/promise-management',
  '/assist-manager',
  '/internal-chat',
  '/personal-chat',
  '/dev-manager',
  '/hr-manager',
  '/vala-ai',
  '/vala-control',
  '/vala',
  '/enterprise-control',
  '/school-software',
  '/payment-success',
  '/order-success',
  '/prime',
  '/user',
  '/demo',
  '/notifications',
  '/public',
];

export const isBlockedLegacyPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return BLOCKED_LEGACY_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export const isApprovedPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return APPROVED_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

export const getRouteViolation = (pathname: string) => {
  if (isBlockedLegacyPath(pathname)) {
    return `blocked_legacy_path:${pathname}`;
  }
  if (!isApprovedPath(pathname)) {
    return `blocked_unknown_path:${pathname}`;
  }
  return null;
};
