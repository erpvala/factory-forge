// @ts-nocheck
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface NavigationGuard {
  validatePath: (path: string) => boolean;
  fallbackPath: string;
  message?: string;
}

export const useResellerManagerNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Valid reseller manager paths
  const validPaths = [
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
  ];

  // Navigation guards for different scenarios
  const navigationGuards: NavigationGuard[] = [
    {
      validatePath: (path) => validPaths.includes(path),
      fallbackPath: '/reseller-manager/dashboard',
      message: 'Invalid reseller manager route. Redirecting to dashboard...'
    },
    {
      validatePath: (path) => path.startsWith('/reseller-manager/'),
      fallbackPath: '/reseller-manager/dashboard',
      message: 'Invalid reseller manager section. Redirecting to dashboard...'
    }
  ];

  // Validate current path on mount
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if current path is a reseller manager path
    if (currentPath.startsWith('/reseller-manager')) {
      const isValid = validPaths.includes(currentPath);
      
      if (!isValid) {
        // Find the first matching guard
        const guard = navigationGuards.find(g => !g.validatePath(currentPath));
        
        if (guard) {
          if (guard.message) {
            toast.warning(guard.message);
          }
          navigate(guard.fallbackPath, { replace: true });
        }
      }
    }
  }, [location.pathname, navigate]);

  // Safe navigation function
  const safeNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    try {
      // Validate the path
      const isValid = validPaths.includes(path);
      
      if (!isValid) {
        const guard = navigationGuards.find(g => !g.validatePath(path));
        
        if (guard) {
          if (guard.message) {
            toast.warning(guard.message);
          }
          navigate(guard.fallbackPath, { replace: true });
          return;
        }
      }

      // Navigate to the valid path
      navigate(path, options);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed. Redirecting to dashboard...');
      navigate('/reseller-manager/dashboard', { replace: true });
    }
  }, [navigate]);

  // Handle unauthorized access
  const handleUnauthorized = useCallback(() => {
    toast.error('Access denied. Redirecting to login...');
    navigate('/login', { replace: true });
  }, [navigate]);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    toast.error('Session expired. Please login again.');
    navigate('/login', { replace: true });
  }, [navigate]);

  // Handle 404 errors within reseller manager
  const handleNotFound = useCallback(() => {
    toast.warning('Page not found. Redirecting to dashboard...');
    navigate('/reseller-manager/dashboard', { replace: true });
  }, [navigate]);

  // Handle server errors
  const handleServerError = useCallback(() => {
    toast.error('Server error. Please try again later.');
    navigate('/reseller-manager/dashboard', { replace: true });
  }, [navigate]);

  // Redirect to dashboard (safe fallback)
  const redirectToDashboard = useCallback(() => {
    navigate('/reseller-manager/dashboard', { replace: true });
  }, [navigate]);

  // Check if current path is valid
  const isCurrentPathValid = useCallback(() => {
    return validPaths.includes(location.pathname);
  }, [location.pathname]);

  // Get current section from path
  const getCurrentSection = useCallback(() => {
    const pathParts = location.pathname.split('/');
    return pathParts[pathParts.length - 1] || 'dashboard';
  }, [location.pathname]);

  // Generate breadcrumb data
  const getBreadcrumbs = useCallback(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Reseller Manager', path: '/reseller-manager' }
    ];

    if (pathParts.length > 1) {
      const section = pathParts[1];
      breadcrumbs.push({
        label: section.charAt(0).toUpperCase() + section.slice(1),
        path: `/reseller-manager/${section}`
      });
    }

    return breadcrumbs;
  }, [location.pathname]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname;
      
      if (path.startsWith('/reseller-manager') && !validPaths.includes(path)) {
        // Prevent going to invalid paths
        event.preventDefault();
        window.history.pushState(null, '', '/reseller-manager/dashboard');
        navigate('/reseller-manager/dashboard', { replace: true });
        toast.warning('Invalid route. Redirecting to dashboard...');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // Handle page refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Save current state to sessionStorage for recovery
      sessionStorage.setItem('resellerManagerLastPath', location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname]);

  // Restore last valid path on page load
  useEffect(() => {
    const lastPath = sessionStorage.getItem('resellerManagerLastPath');
    
    if (lastPath && validPaths.includes(lastPath) && location.pathname === '/') {
      navigate(lastPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return {
    safeNavigate,
    handleUnauthorized,
    handleSessionExpired,
    handleNotFound,
    handleServerError,
    redirectToDashboard,
    isCurrentPathValid,
    getCurrentSection,
    getBreadcrumbs,
    validPaths
  };
};

export default useResellerManagerNavigation;
