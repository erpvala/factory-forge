// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface RoleAuth {
  isAuthenticated: boolean;
  userRole: string | null;
  permissions: string[];
  sessionValid: boolean;
}

interface AccessControl {
  allowed: string[];
  blocked: string[];
}

export const useResellerManagerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [auth, setAuth] = useState<RoleAuth>({
    isAuthenticated: false,
    userRole: null,
    permissions: [],
    sessionValid: false
  });

  const [accessControl] = useState<AccessControl>({
    allowed: [
      '/reseller-manager',
      '/reseller-manager/dashboard',
      '/reseller-manager/resellers',
      '/reseller-manager/onboarding',
      '/reseller-manager/products',
      '/reseller-manager/licenses',
      '/reseller-manager/sales',
      '/reseller-manager/commission',
      '/reseller-manager/payout',
      '/reseller-manager/invoices'
    ],
    blocked: [
      '/super-admin',
      '/admin',
      '/franchise-manager',
      '/lead-manager',
      '/task-manager',
      '/marketing-manager',
      '/seo-manager',
      '/hr-manager',
      '/legal-manager',
      '/finance-manager',
      '/server-manager',
      '/api-manager',
      '/ai-ceo',
      '/developer',
      '/influencer',
      '/prime',
      '/reseller' // Separate reseller dashboard (not manager)
    ]
  });

  // Role पहचान (Role Recognition)
  const recognizeRole = useCallback(() => {
    // Simulate role recognition from session/token
    const sessionRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    
    if (!sessionRole) {
      return null;
    }

    // Validate role is reseller_manager or super_admin
    const validRoles = ['reseller_manager', 'super_admin'];
    return validRoles.includes(sessionRole) ? sessionRole : null;
  }, []);

  // Session persist
  const persistSession = useCallback((role: string) => {
    // Store role in both localStorage and sessionStorage for persistence
    localStorage.setItem('userRole', role);
    sessionStorage.setItem('userRole', role);
    localStorage.setItem('sessionTimestamp', Date.now().toString());
    sessionStorage.setItem('sessionTimestamp', Date.now().toString());
  }, []);

  // Validate session
  const validateSession = useCallback(() => {
    const role = recognizeRole();
    const timestamp = localStorage.getItem('sessionTimestamp') || sessionStorage.getItem('sessionTimestamp');
    
    if (!role || !timestamp) {
      return false;
    }

    // Check if session is less than 30 minutes old
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 30 * 60 * 1000; // 30 minutes

    return sessionAge < maxAge;
  }, [recognizeRole]);

  // Check if current path is allowed
  const isPathAllowed = useCallback((path: string) => {
    return accessControl.allowed.some(allowed => path.startsWith(allowed));
  }, [accessControl]);

  // Check if current path is blocked
  const isPathBlocked = useCallback((path: string) => {
    return accessControl.blocked.some(blocked => path.startsWith(blocked));
  }, [accessControl]);

  // Get user permissions based on role
  const getPermissions = useCallback((role: string): string[] => {
    const permissions = {
      reseller_manager: [
        'reseller_control',
        'product_assign',
        'license_manage',
        'commission_view',
        'commission_manage',
        'payout_view',
        'payout_approve',
        'invoice_create',
        'invoice_manage',
        'sales_view',
        'onboarding_approve'
      ],
      super_admin: [
        'reseller_control',
        'product_assign',
        'license_manage',
        'commission_view',
        'commission_manage',
        'payout_view',
        'payout_approve',
        'invoice_create',
        'invoice_manage',
        'sales_view',
        'onboarding_approve',
        'system_admin',
        'full_access'
      ]
    };

    return permissions[role] || [];
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = () => {
      const role = recognizeRole();
      const isValid = validateSession();

      if (role && isValid) {
        setAuth({
          isAuthenticated: true,
          userRole: role,
          permissions: getPermissions(role),
          sessionValid: true
        });
        persistSession(role);
      } else {
        // Clear invalid session
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('userRole');
        localStorage.removeItem('sessionTimestamp');
        sessionStorage.removeItem('sessionTimestamp');
        
        setAuth({
          isAuthenticated: false,
          userRole: null,
          permissions: [],
          sessionValid: false
        });

        // Redirect to login if not on login page
        if (location.pathname !== '/login') {
          toast.error('Session expired. Please login again.');
          navigate('/login', { replace: true });
        }
      }
    };

    initAuth();
  }, [recognizeRole, validateSession, getPermissions, persistSession, location.pathname, navigate]);

  // Check access on route change
  useEffect(() => {
    const currentPath = location.pathname;

    // Only check access for reseller manager routes
    if (!currentPath.startsWith('/reseller-manager')) {
      return;
    }

    if (!auth.isAuthenticated || !auth.userRole) {
      toast.error('Authentication required. Redirecting to login...');
      navigate('/login', { replace: true });
      return;
    }

    // Direct URL → role check
    if (!isPathAllowed(currentPath)) {
      toast.error('Access denied. This route is not available for your role.');
      navigate('/reseller-manager/dashboard', { replace: true });
      return;
    }

    // Check if trying to access blocked routes
    if (isPathBlocked(currentPath)) {
      toast.error('Access denied. Reseller Manager cannot access other dashboards.');
      navigate('/reseller-manager/dashboard', { replace: true });
      return;
    }

  }, [location.pathname, auth, isPathAllowed, isPathBlocked, navigate]);

  // Session refresh mechanism
  const refreshSession = useCallback(() => {
    if (auth.userRole) {
      persistSession(auth.userRole);
      setAuth(prev => ({ ...prev, sessionValid: true }));
    }
  }, [auth.userRole, persistSession]);

  // Auto-refresh session every 10 minutes
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [auth.isAuthenticated, refreshSession]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('sessionTimestamp');
    sessionStorage.removeItem('sessionTimestamp');
    
    setAuth({
      isAuthenticated: false,
      userRole: null,
      permissions: [],
      sessionValid: false
    });

    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  }, [navigate]);

  // Check specific permission
  const hasPermission = useCallback((permission: string) => {
    return auth.permissions.includes(permission);
  }, [auth.permissions]);

  // Check multiple permissions
  const hasPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => auth.permissions.includes(permission));
  }, [auth.permissions]);

  // Check if user can access specific reseller manager feature
  const canAccessFeature = useCallback((feature: string) => {
    const featurePermissions = {
      'reseller_control': ['reseller_control'],
      'product_assign': ['product_assign'],
      'license_manage': ['license_manage'],
      'commission_manage': ['commission_manage'],
      'payout_approve': ['payout_approve'],
      'invoice_manage': ['invoice_manage'],
      'onboarding_approve': ['onboarding_approve']
    };

    const requiredPermissions = featurePermissions[feature];
    if (!requiredPermissions) return false;

    return hasPermissions(requiredPermissions);
  }, [hasPermissions]);

  // Get access summary
  const getAccessSummary = useCallback(() => {
    return {
      role: auth.userRole,
      permissions: auth.permissions,
      allowedRoutes: accessControl.allowed,
      blockedRoutes: accessControl.blocked,
      features: {
        reseller_control: canAccessFeature('reseller_control'),
        product_assign: canAccessFeature('product_assign'),
        license_manage: canAccessFeature('license_manage'),
        commission_manage: canAccessFeature('commission_manage'),
        payout_approve: canAccessFeature('payout_approve'),
        invoice_manage: canAccessFeature('invoice_manage'),
        onboarding_approve: canAccessFeature('onboarding_approve')
      }
    };
  }, [auth, accessControl, canAccessFeature]);

  return {
    // Authentication state
    auth,
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.userRole,
    permissions: auth.permissions,
    sessionValid: auth.sessionValid,
    
    // Access control
    isPathAllowed,
    isPathBlocked,
    hasPermission,
    hasPermissions,
    canAccessFeature,
    getAccessSummary,
    
    // Actions
    refreshSession,
    logout,
    
    // Access control lists
    allowedRoutes: accessControl.allowed,
    blockedRoutes: accessControl.blocked
  };
};

export default useResellerManagerAuth;
