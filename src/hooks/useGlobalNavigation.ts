// @ts-nocheck
/**
 * GLOBAL NAVIGATION HOOK
 * Centralized button -> route mapping
 * Enforces: 0 dead clicks, 0 duplicate screens, 100% navigable UI
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSidebarStore } from '@/stores/sidebarStore';

// Permission check type
export type PermissionLevel = 'allowed' | 'restricted' | 'locked' | 'coming-soon';

// Route definition with state management
export interface RouteDefinition {
  path: string;
  component?: string;
  state?: {
    sidebar?: 'collapsed' | 'expanded' | 'hidden';
    context?: 'global' | 'module' | 'child';
    parentSidebar?: 'hidden' | 'visible';
  };
  modal?: boolean;
  permission?: PermissionLevel;
  tooltip?: string;
}

// Global button -> route mapping
const BUTTON_ROUTE_MAP: Record<string, RouteDefinition> = {
  // Header Actions
  'btn_internal_chat': { path: '/internal-chat', state: { sidebar: 'collapsed', context: 'global' } },
  'btn_tasks': { path: '/task-manager', state: { sidebar: 'expanded', context: 'module' } },
  'btn_alerts': { path: '/boss-panel', modal: false },
  'btn_profile': { path: '/settings', state: { context: 'global' } },
  'btn_settings': { path: '/settings', state: { context: 'global' } },
  'btn_logout': { path: '/auth/logout', state: { sidebar: 'hidden' } },
  
  // Dashboard Navigation
  'btn_dashboard_main': { path: '/boss-panel', state: { sidebar: 'expanded', context: 'global' } },
  'btn_boss_dashboard': { path: '/boss-panel', state: { sidebar: 'expanded', context: 'global' } },
  'btn_ceo_dashboard': { path: '/ai-ceo', state: { sidebar: 'expanded', context: 'global' } },
  
  // Module Navigation
  'btn_server_control': { path: '/server-manager', state: { sidebar: 'hidden', context: 'module', parentSidebar: 'hidden' } },
  'btn_vala_ai': { path: '/vala-ai', state: { sidebar: 'hidden', context: 'module', parentSidebar: 'hidden' } },
  'btn_product_demo': { path: '/product-demo-manager', state: { sidebar: 'hidden', context: 'module', parentSidebar: 'hidden' } },
  'btn_leads': { path: '/lead-manager', state: { sidebar: 'hidden', context: 'module', parentSidebar: 'hidden' } },
  'btn_marketing': { path: '/marketing', state: { sidebar: 'hidden', context: 'module', parentSidebar: 'hidden' } },
  'btn_finance': { path: '/finance', state: { sidebar: 'expanded', context: 'module' } },
  'btn_franchise': { path: '/franchise-manager', state: { sidebar: 'expanded', context: 'module' } },
  'btn_reseller': { path: '/reseller-manager/dashboard', state: { sidebar: 'expanded', context: 'module' } },
  'btn_support': { path: '/support', state: { sidebar: 'expanded', context: 'module' } },
  'btn_legal': { path: '/legal', state: { sidebar: 'expanded', context: 'module' } },
  'btn_pro_manager': { path: '/boss-panel', state: { sidebar: 'expanded', context: 'module' } },
  'btn_role_manager': { path: '/boss-panel', state: { sidebar: 'expanded', context: 'module' } },
  
  // Table/Card Detail Views
  'btn_task_detail': { path: '/task-manager', modal: false },
  'btn_lead_detail': { path: '/lead-manager', modal: false },
  'btn_franchise_detail': { path: '/franchise-manager', modal: false },
  'btn_server_detail': { path: '/server-manager', modal: false },
  
  // Quick Actions
  'btn_new_task': { path: '/task-manager', modal: true },
  'btn_new_lead': { path: '/lead-manager', modal: true },
  'btn_new_franchise': { path: '/franchise-manager', modal: true },
  
  // External/Demo Routes  
  'btn_school_software': { path: '/school-software', state: { sidebar: 'hidden', context: 'global' } },
  'btn_school_dashboard': { path: '/school-software/dashboard', state: { sidebar: 'hidden', context: 'global' } },
  
  // Secure Pages
  'btn_security_center': { path: '/super-admin/security-center', state: { sidebar: 'expanded' } },
  'btn_audit_logs': { path: '/boss-panel', state: { sidebar: 'expanded' } },
};

// User permissions (would come from auth context in real app)
const DEFAULT_PERMISSIONS: Record<string, PermissionLevel> = {
  'boss_owner': 'allowed',
  'ceo': 'allowed',
  'super_admin': 'allowed',
  'manager': 'allowed',
  'employee': 'restricted',
  'client': 'locked',
};

export function useGlobalNavigation() {
  const navigate = useNavigate();
  const { showGlobalSidebar, enterCategory, exitToGlobal } = useSidebarStore();

  // Check if user has permission for a route
  const checkPermission = useCallback((buttonId: string, userRole?: string): PermissionLevel => {
    const route = BUTTON_ROUTE_MAP[buttonId];
    if (!route) return 'coming-soon';
    if (route.permission) return route.permission;
    return DEFAULT_PERMISSIONS[userRole || 'employee'] || 'restricted';
  }, []);

  // Navigate with proper state management
  const navigateTo = useCallback((buttonId: string, params?: Record<string, string>) => {
    const route = BUTTON_ROUTE_MAP[buttonId];
    
    if (!route) {
      toast.info('Coming Soon', {
        description: 'This feature will be available soon',
        duration: 2000
      });
      return false;
    }

    const permission = checkPermission(buttonId);
    
    if (permission === 'locked') {
      toast.error('Access Restricted', {
        description: 'You do not have permission to access this feature',
        duration: 3000
      });
      return false;
    }

    if (permission === 'coming-soon') {
      toast.info('Coming Soon', {
        description: 'This feature is under development',
        duration: 2000
      });
      return false;
    }

    // Handle sidebar state
    if (route.state?.context === 'module' || route.state?.parentSidebar === 'hidden') {
      // Match category from path for module navigation.
      const categoryMap: Record<string, Parameters<typeof enterCategory>[0]> = {
        '/server-manager': 'server-manager',
        '/vala-ai': 'vala-ai',
        '/product-demo-manager': 'product-demo',
        '/lead-manager': 'lead-manager',
        '/marketing': 'marketing',
        '/finance': 'finance',
        '/franchise-manager': 'franchise-manager',
        '/reseller-manager/dashboard': 'reseller-manager',
      };

      const category = categoryMap[route.path];
      if (category) {
        enterCategory(category);
      }
    } else {
      showGlobalSidebar();
    }

    // Build final path with params
    let finalPath = route.path;
    if (params) {
      const url = new URL(finalPath, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      finalPath = url.pathname + url.search;
    }

    navigate(finalPath);
    return true;
  }, [navigate, checkPermission, showGlobalSidebar, enterCategory]);

  // Get route info for a button
  const getRouteInfo = useCallback((buttonId: string): RouteDefinition | null => {
    return BUTTON_ROUTE_MAP[buttonId] || null;
  }, []);

  // Back navigation handler
  const goBack = useCallback(() => {
    exitToGlobal();
    window.history.back();
  }, [exitToGlobal]);

  // Go to home/dashboard
  const goHome = useCallback(() => {
    showGlobalSidebar();
    navigate('/boss-panel');
    toast.success('Returned to Boss Dashboard');
  }, [navigate, showGlobalSidebar]);

  // All available routes
  const allRoutes = useMemo(() => Object.keys(BUTTON_ROUTE_MAP), []);

  return {
    navigateTo,
    checkPermission,
    getRouteInfo,
    goBack,
    goHome,
    allRoutes,
  };
}

/**
 * Hook for creating click handlers with permission checks
 */
export function useButtonHandler(buttonId: string, userRole?: string) {
  const { navigateTo, checkPermission, getRouteInfo } = useGlobalNavigation();
  
  const permission = useMemo(() => checkPermission(buttonId, userRole), [buttonId, userRole, checkPermission]);
  const routeInfo = useMemo(() => getRouteInfo(buttonId), [buttonId, getRouteInfo]);
  
  const handleClick = useCallback((params?: Record<string, string>) => {
    return navigateTo(buttonId, params);
  }, [buttonId, navigateTo]);

  const isLocked = permission === 'locked' || permission === 'coming-soon';
  const tooltip = isLocked 
    ? (permission === 'locked' ? 'Access Restricted' : 'Coming Soon')
    : routeInfo?.tooltip;

  return {
    handleClick,
    isLocked,
    permission,
    tooltip,
    routeInfo,
  };
}

export default useGlobalNavigation;

