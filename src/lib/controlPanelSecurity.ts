import type { Session, User } from '@supabase/supabase-js';

const TENANT_KEYS = ['tenant_id', 'tenantId', 'org_id', 'organization_id'];
const ACCESS_KEY_KEYS = ['access_key', 'accessKey', 'control_panel_access_key'];

type SecurityInput = {
  pathname: string;
  user: User | null;
  session: Session | null;
  userRole: string | null;
};

type SecurityResult = {
  ok: boolean;
  reason: string;
};

const readFromObject = (source: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
};

const readFromStorage = (keys: string[]): string | null => {
  for (const key of keys) {
    const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (value && value.trim()) {
      return value;
    }
  }
  return null;
};

export const isControlPanelPath = (pathname: string): boolean => {
  return pathname === '/control-panel' || pathname.startsWith('/control-panel/');
};

export const validateControlPanelSecurity = ({ pathname, user, session, userRole }: SecurityInput): SecurityResult => {
  if (!isControlPanelPath(pathname)) {
    return { ok: true, reason: 'not_control_panel_path' };
  }

  if (!session?.access_token) {
    return { ok: false, reason: 'missing_session_token' };
  }

  if (session.expires_at && session.expires_at * 1000 <= Date.now()) {
    return { ok: false, reason: 'session_expired' };
  }

  if (!userRole) {
    return { ok: false, reason: 'missing_active_role' };
  }

  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;

  const tenantId =
    readFromObject(userMeta, TENANT_KEYS) ??
    readFromObject(appMeta, TENANT_KEYS) ??
    readFromStorage(TENANT_KEYS);

  if (!tenantId) {
    return { ok: false, reason: 'missing_tenant_id' };
  }

  const accessKey =
    readFromObject(userMeta, ACCESS_KEY_KEYS) ??
    readFromObject(appMeta, ACCESS_KEY_KEYS) ??
    readFromStorage(ACCESS_KEY_KEYS);

  if (!accessKey) {
    return { ok: false, reason: 'missing_access_key' };
  }

  return { ok: true, reason: 'ok' };
};
