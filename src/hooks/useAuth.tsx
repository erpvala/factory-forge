// @ts-nocheck
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiLogoutAll,
  apiRefresh,
  saveSession,
  clearSession,
  getStoredRefreshToken,
  getRoleRedirectPath,
} from '@/api/v1/auth';
import { ROUTES, getRoleDashboardRoute } from '@/routes/routes';

// Re-export so consuming components can use it directly
export { getRoleRedirectPath } from '@/api/v1/auth';

export type AppRole =
  | 'boss_owner' | 'ceo' | 'super_admin' | 'admin'
  | 'developer' | 'franchise_owner' | 'franchise_manager' | 'reseller' | 'reseller_manager'
  | 'influencer' | 'influencer_manager' | 'lead_manager' | 'marketing_manager'
  | 'seo_manager' | 'sales_support' | 'finance_manager' | 'legal_manager'
  | 'hr_manager' | 'pro_manager' | 'task_manager' | 'product_manager'
  | 'demo_manager' | 'server_manager' | 'api_ai_manager'
  | 'continent_admin' | 'country_admin' | 'security_manager'
  | 'marketplace_manager' | 'license_manager' | 'deployment_manager'
  | 'analytics_manager' | 'notification_manager' | 'integration_manager'
  | 'audit_manager' | 'prime_user' | 'user';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

const PRIVILEGED_ROLES: AppRole[] = ['boss_owner', 'ceo', 'super_admin'];
const ACTIVE_ROLE_KEY = 'sv.active-role';
const DEVICE_KEY = 'sv.device.id';

const ROLE_PRIORITY: AppRole[] = [
  'boss_owner', 'ceo', 'super_admin', 'admin',
  'server_manager', 'api_ai_manager', 'finance_manager',
  'lead_manager', 'marketing_manager', 'seo_manager',
  'product_manager', 'demo_manager', 'task_manager',
  'developer', 'franchise_owner', 'franchise_manager',
  'reseller', 'reseller_manager', 'influencer', 'influencer_manager',
  'sales_support', 'legal_manager', 'hr_manager', 'pro_manager',
  'continent_admin', 'country_admin', 'security_manager',
  'marketplace_manager', 'license_manager', 'deployment_manager',
  'analytics_manager', 'notification_manager', 'integration_manager',
  'audit_manager', 'prime_user', 'user',
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  activeRole: AppRole | null;
  userRoles: AppRole[];
  approvedRoles: AppRole[];
  roleAssignments: { role: AppRole; approvalStatus: ApprovalStatus }[];
  approvalStatus: ApprovalStatus;
  isPrivileged: boolean;
  isBossOwner: boolean;
  isCEO: boolean;
  wasForceLoggedOut: boolean;
  signUp: (email: string, password: string, role: AppRole, fullName: string) => Promise<{ error: Error | null; redirect?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; redirect?: string }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  switchRole: (role: AppRole) => Promise<boolean>;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshApprovalStatus: () => Promise<void>;
  forceLogoutUser: (targetUserId: string) => Promise<{ error: Error | null }>;
  generateDeviceFingerprint: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<{ role: AppRole; approvalStatus: ApprovalStatus }[]>([]);
  const [wasForceLoggedOut, setWasForceLoggedOut] = useState(false);

  const userRoles = useMemo(() => roleAssignments.map(a => a.role), [roleAssignments]);
  const approvedRoles = useMemo(
    () => roleAssignments.filter(a => a.approvalStatus === 'approved').map(a => a.role),
    [roleAssignments]
  );
  const approvalStatus: ApprovalStatus = useMemo(() => {
    const active = roleAssignments.find(a => a.role === userRole);
    return active?.approvalStatus ?? null;
  }, [roleAssignments, userRole]);

  const isPrivileged = approvedRoles.some(r => PRIVILEGED_ROLES.includes(r));
  const isBossOwner = approvedRoles.some(r => r === 'boss_owner');
  const isCEO = approvedRoles.includes('ceo');

  const syncActiveRole = useCallback((role: AppRole | null) => {
    setUserRole(role);
    if (role) localStorage.setItem(ACTIVE_ROLE_KEY, role);
    else localStorage.removeItem(ACTIVE_ROLE_KEY);
  }, []);

  const selectBestRole = (roles: AppRole[]): AppRole | null => {
    for (const r of ROLE_PRIORITY) {
      if (roles.includes(r)) return r;
    }
    return roles[0] || null;
  };

  const hydrateRoles = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, approval_status')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      setRoleAssignments([]);
      syncActiveRole(null);
      return;
    }

    const assignments = data.map(row => ({
      role: row.role as AppRole,
      approvalStatus: (row.approval_status as ApprovalStatus) ?? null,
    }));
    setRoleAssignments(assignments);

    const approved = assignments.filter(a => a.approvalStatus === 'approved').map(a => a.role);
    const all = assignments.map(a => a.role);
    const eligible = approved.length > 0 ? approved : all;

    const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null;
    const best = (stored && eligible.includes(stored)) ? stored : selectBestRole(eligible);
    syncActiveRole(best);
  }, [syncActiveRole]);

  // Auth state listener
  useEffect(() => {
    let mounted = true;

    const handleSession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRoleAssignments([]);
        setUserRole(null);
        setLoading(false);
        return;
      }

      await hydrateRoles(nextSession.user.id);
      if (mounted) setLoading(false);
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateRoles]);

  const signUp = async (email: string, password: string, role: AppRole, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, requested_role: role } },
      });

      if (error) throw new Error(error.message);

      if (data?.user) {
        // Create role request for approval
        await supabase.from('role_requests').insert({
          user_id: data.user.id,
          requested_role: role,
          status: 'pending',
        });
      }

      return { error: null, redirect: ROUTES.dashboardPending };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      let redirect = '/control-panel?module=user-dashboard';

      if (data?.user) {
        await hydrateRoles(data.user.id);

        // Query role directly to compute redirect (state not yet updated)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role, approval_status')
          .eq('user_id', data.user.id)
          .eq('approval_status', 'approved');

        if (roles && roles.length > 0) {
          const bestRole = selectBestRole(roles.map(r => r.role as AppRole));
          redirect = getRoleDashboardRoute(bestRole);
        }
      }

      return { error: null, redirect };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const switchRole = useCallback(async (role: AppRole) => {
    const eligible = approvedRoles.length > 0 ? approvedRoles : userRoles;
    if (!eligible.includes(role)) return false;
    syncActiveRole(role);
    return true;
  }, [approvedRoles, userRoles, syncActiveRole]);

  const hasRole = useCallback((role: AppRole) => userRoles.includes(role), [userRoles]);

  const signOut = async () => {
    // Invalidate the session on the server via Edge Function
    const token = localStorage.getItem('sv.auth.token');
    if (token) {
      await apiLogout(token).catch(() => {});
    }
    clearSession();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoleAssignments([]);
    setUserRole(null);
    setWasForceLoggedOut(false);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const refreshApprovalStatus = async () => {
    if (user) await hydrateRoles(user.id);
  };

  const forceLogoutUser = async (targetUserId: string) => {
    // Self-session hard kill (all devices) for immediate incident response.
    await apiLogoutAll(localStorage.getItem('sv.auth.token') || '').catch(() => {});
    return { error: null };
  };

  const generateDeviceFingerprint = (): string => {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const fp = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(DEVICE_KEY, fp);
    return fp;
  };

  // Keep short-lived access token alive via refresh token.
  useEffect(() => {
    let alive = true;

    const renew = async () => {
      const refresh = getStoredRefreshToken();
      if (!refresh) return;

      const refreshed = await apiRefresh(refresh).catch(() => ({ success: false } as any));
      if (!alive || !refreshed?.success || !refreshed?.data?.session) return;

      const next = refreshed.data.session;
      await supabase.auth.setSession({
        access_token: next.access_token,
        refresh_token: next.refresh_token,
      }).catch(() => {});
    };

    // Renew every 10 minutes (JWT target is 15 min).
    const timer = window.setInterval(() => {
      void renew();
    }, 10 * 60 * 1000);

    // Also renew on tab focus to avoid stale token on resume.
    const onFocus = () => { void renew(); };
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      userRole, activeRole: userRole,
      userRoles, approvedRoles, roleAssignments,
      approvalStatus, isPrivileged, isBossOwner, isCEO,
      wasForceLoggedOut,
      signUp, signIn, signInWithProvider, switchRole, hasRole,
      signOut, refreshApprovalStatus, forceLogoutUser,
      generateDeviceFingerprint,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
