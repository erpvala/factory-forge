// @ts-nocheck
// AuthMiddleware – validates session token, checks user status, and redirects
// accordingly. Wraps protected routes.
//
// Spec requirements:
//   ✔ token valid     → allow through
//   ✔ user exists     → allow through
//   ✔ PENDING status  → /dashboard/pending
//   ✔ no token        → /login
//   ✔ expired/invalid → /login
//   ✔ loading state   → spinner (no blank screen)

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getStoredToken, apiMe, getRoleRedirectPath } from '@/api/v1/auth';
import { ROUTES } from '@/routes/routes';

type Status = 'loading' | 'authenticated' | 'pending' | 'rejected' | 'unauthenticated';

interface AuthMiddlewareProps {
  children: ReactNode;
  /** When true, PENDING users are also allowed through (e.g. pending-approval page itself) */
  allowPending?: boolean;
}

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Verifying session…</p>
    </div>
  </div>
);

export function AuthMiddleware({ children, allowPending = false }: AuthMiddlewareProps) {
  const { user, loading: supabaseLoading, userRole, approvalStatus } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // 1. Wait for Supabase to hydrate
      if (supabaseLoading) return;

      // 2. No Supabase user
      if (!user) {
        // Check if we have a stored token to validate directly
        const token = getStoredToken();
        if (!token) {
          if (!cancelled) setStatus('unauthenticated');
          return;
        }

        // Validate token via /me endpoint
        try {
          const me = await apiMe(token);
          if (me.success && me.data?.user) {
            const s = me.data.user.status;
            if (!cancelled) {
              setStatus(
                s === 'ACTIVE'    ? 'authenticated' :
                s === 'REJECTED'  ? 'rejected' : 'pending'
              );
            }
          } else {
            if (!cancelled) setStatus('unauthenticated');
          }
        } catch {
          if (!cancelled) setStatus('unauthenticated');
        }
        return;
      }

      // 3. Supabase user exists — check approval status
      if (approvalStatus === 'approved') {
        if (!cancelled) setStatus('authenticated');
      } else if (approvalStatus === 'rejected') {
        if (!cancelled) setStatus('rejected');
      } else {
        // null or 'pending'
        if (!cancelled) setStatus('pending');
      }
    }

    void verify();
    return () => { cancelled = true; };
  }, [user, supabaseLoading, approvalStatus]);

  if (status === 'loading' || supabaseLoading) return <Spinner />;

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (status === 'rejected') {
    return <Navigate to={ROUTES.accessDenied} replace />;
  }

  if (status === 'pending' && !allowPending) {
    return <Navigate to={ROUTES.dashboardPending} replace />;
  }

  return <>{children}</>;
}

export default AuthMiddleware;
