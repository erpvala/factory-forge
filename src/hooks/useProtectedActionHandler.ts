// @ts-nocheck
/**
 * Role → Dashboard route mapping for all 34+ roles
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { ROUTES, ROLE_DASHBOARD_ROUTE } from '@/routes/routes';

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
  return ROLE_DASHBOARD_ROUTE[role || ''] || ROUTES.controlPanelBase;
};

/** Maps action keys to their apply or nav routes */
const ACTION_ROUTES: Record<string, string> = {
  joinDeveloper:    ROUTES.applyDeveloper,
  becomeInfluencer: ROUTES.applyInfluencer,
  applyForJob:      ROUTES.applyJob,
  applyReseller:    ROUTES.applyReseller,
  applyFranchise:   ROUTES.applyFranchise,
  login:            ROUTES.login,
  bossPortal:       ROUTES.login,
};

export const useProtectedActionHandler = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleAction = useCallback((actionKey: string) => {
    // Apply routes are always public — no login required
    const applyActions = ['joinDeveloper', 'becomeInfluencer', 'applyForJob', 'applyReseller', 'applyFranchise'];
    if (applyActions.includes(actionKey)) {
      navigate(ACTION_ROUTES[actionKey] || ROUTES.login);
      return;
    }
    if (actionKey === 'login') {
      navigate(ROUTES.login);
      return;
    }
    if (actionKey === 'bossPortal') {
      navigate(`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.controlPanelBase)}`);
      return;
    }
    // Generic: if logged in navigate to their dashboard, else login
    if (!user) {
      navigate(ROUTES.login);
      return;
    }
    const route = getDefaultDashboardRoute(userRole);
    navigate(route);
  }, [user, userRole, navigate]);

  return { handleAction };
};

export default useProtectedActionHandler;
