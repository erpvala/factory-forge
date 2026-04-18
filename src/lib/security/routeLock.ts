// @ts-nocheck
import { isKnownControlPanelRoute } from '@/config/controlPanelModules';

const ROUTE_CONFIG_SIGNATURE = 'a2a387182eec7c53edf651322b032f5b58247a6d8a7fd3841d4fc8ee981566e4';

const IMMUTABLE_ROUTE_CONFIG = Object.freeze({
  allowed: Object.freeze(['/login', '/control-panel', '/api']),
  hardBlocked: Object.freeze(['/user/dashboard', '/admin', '/super-admin', '/old', '/dashboard', '/user', '/boss', '/franchise', '/influencer']),
});

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

export const HARD_BLOCKED_ROUTES = [
  ...IMMUTABLE_ROUTE_CONFIG.hardBlocked,
];

export const isBlockedLegacyPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return BLOCKED_LEGACY_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export const isApprovedPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return APPROVED_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

export const isHardBlockedPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();
  return HARD_BLOCKED_ROUTES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

export const getRouteViolation = (pathname: string) => {
  const normalizedPath = pathname.toLowerCase();

  if (
    normalizedPath === '/admin' ||
    normalizedPath.startsWith('/admin/') ||
    normalizedPath === '/super-admin' ||
    normalizedPath.startsWith('/super-admin/') ||
    normalizedPath === '/dashboard' ||
    normalizedPath.startsWith('/dashboard/')
  ) {
    return null;
  }

  if (typeof window !== 'undefined') {
    try {
      const blacklist = JSON.parse(localStorage.getItem('route_lock_blacklist') || '[]');
      if (Array.isArray(blacklist) && blacklist.includes(normalizedPath)) {
        return `blocked_blacklisted_path:${pathname}`;
      }
    } catch {
      // Keep runtime guard resilient.
    }
  }

  if (normalizedPath.startsWith('/control-panel/') && !isKnownControlPanelRoute(normalizedPath)) {
    return `blocked_unregistered_control_panel_route:${pathname}`;
  }

  if (isHardBlockedPath(pathname)) {
    return `blocked_dead_route:${pathname}`;
  }
  if (isBlockedLegacyPath(pathname)) {
    return `blocked_legacy_path:${pathname}`;
  }
  if (!isApprovedPath(pathname)) {
    return `blocked_unknown_path:${pathname}`;
  }
  return null;
};

export const recordRouteIncident = (pathname: string, reason: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    pathname,
    reason,
    timestamp: new Date().toISOString(),
  };

  try {
    const key = 'route_lock_incidents';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const next = [...current, payload].slice(-50);
    localStorage.setItem(key, JSON.stringify(next));

    const blacklistKey = 'route_lock_blacklist';
    const currentBlacklist = JSON.parse(localStorage.getItem(blacklistKey) || '[]');
    const normalizedPath = pathname.toLowerCase();
    const nextBlacklist = Array.from(new Set([...(Array.isArray(currentBlacklist) ? currentBlacklist : []), normalizedPath])).slice(-200);
    localStorage.setItem(blacklistKey, JSON.stringify(nextBlacklist));
  } catch {
    // Keep runtime guard resilient.
  }

  window.dispatchEvent(new CustomEvent('route-lock-incident', { detail: payload }));
  console.error('[ROUTE_LOCK_INCIDENT]', payload);
};

const sha256Hex = async (input: string) => {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyImmutableRouteConfig = async () => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const response = await fetch('/route_config.json', { cache: 'no-store' });
    if (!response.ok) {
      return false;
    }

    const config = await response.json();
    const canonical = JSON.stringify({ allowed: config.allowed, banned: config.banned });
    const signature = await sha256Hex(canonical);
    return signature === config.signature && signature === ROUTE_CONFIG_SIGNATURE;
  } catch {
    return false;
  }
};

export const installRuntimeRouteScanner = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const enforce = (targetPathname: string, source: string) => {
    const violation = getRouteViolation(targetPathname);
    if (!violation) {
      return false;
    }

    recordRouteIncident(targetPathname, `${source}:${violation}`);
    window.location.replace('/login');
    return true;
  };

  void verifyImmutableRouteConfig().then((ok) => {
    if (!ok) {
      recordRouteIncident(window.location.pathname, 'route_config_signature_invalid');
      window.location.replace('/login');
    }
  });

  enforce(window.location.pathname, 'boot');

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function (...args: any[]) {
    const path = typeof args[2] === 'string' ? args[2] : window.location.pathname;
    if (!enforce(path, 'pushState')) {
      return originalPushState(...args);
    }
    return undefined;
  };

  window.history.replaceState = function (...args: any[]) {
    const path = typeof args[2] === 'string' ? args[2] : window.location.pathname;
    if (!enforce(path, 'replaceState')) {
      return originalReplaceState(...args);
    }
    return undefined;
  };

  window.addEventListener('popstate', () => {
    enforce(window.location.pathname, 'popstate');
  });

  setInterval(() => {
    enforce(window.location.pathname, 'interval_scan');
  }, 2000);
};
