// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RouteConfig {
  path: string;
  name: string;
  component: string;
  permissions: string[];
  parent?: string;
  children?: RouteConfig[];
}

interface UseDeveloperRoutingReturn {
  currentRoute: RouteConfig | null;
  breadcrumbs: Array<{ name: string; path: string }>;
  navigateTo: (path: string) => void;
  goBack: () => void;
  canNavigateTo: (path: string) => boolean;
  getRouteHierarchy: () => RouteConfig[];
  isRouteActive: (path: string) => boolean;
}

const useDeveloperRouting = (): UseDeveloperRoutingReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState<RouteConfig | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ name: string; path: string }>>([]);

  // Complete route configuration
  const routeConfig: RouteConfig[] = [
    {
      path: '/developer',
      name: 'Developer',
      component: 'DeveloperLayout',
      permissions: ['read:developer'],
      children: [
        {
          path: '/developer/dashboard',
          name: 'Dashboard',
          component: 'DeveloperDashboardPage',
          permissions: ['read:developer']
        },
        {
          path: '/developer/projects',
          name: 'Projects',
          component: 'DeveloperProjectsPage',
          permissions: ['read:projects']
        },
        {
          path: '/developer/repositories',
          name: 'Repositories',
          component: 'DeveloperRepositoriesPage',
          permissions: ['read:repositories']
        },
        {
          path: '/developer/commits',
          name: 'Commits',
          component: 'DeveloperCommitsPage',
          permissions: ['read:repositories']
        },
        {
          path: '/developer/pipelines',
          name: 'Pipelines',
          component: 'DeveloperPipelinesPage',
          permissions: ['read:pipelines']
        },
        {
          path: '/developer/deployments',
          name: 'Deployments',
          component: 'DeveloperDeploymentsPage',
          permissions: ['read:deployments']
        },
        {
          path: '/developer/dev-logs',
          name: 'Logs',
          component: 'DeveloperLogsPage',
          permissions: ['read:logs']
        },
        {
          path: '/developer/dev-errors',
          name: 'Errors',
          component: 'DeveloperErrorsPage',
          permissions: ['read:errors']
        },
        {
          path: '/developer/dev-api',
          name: 'API',
          component: 'DeveloperApiPage',
          permissions: ['read:api']
        },
        {
          path: '/developer/dev-settings',
          name: 'Settings',
          component: 'DeveloperSettingsPage',
          permissions: ['write:settings']
        }
      ]
    }
  ];

  // Find route by path
  const findRoute = useCallback((path: string, routes: RouteConfig[] = routeConfig): RouteConfig | null => {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }
      if (route.children) {
        const found = findRoute(path, route.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Generate breadcrumbs for current path
  const generateBreadcrumbs = useCallback((path: string): Array<{ name: string; path: string }> => {
    const crumbs: Array<{ name: string; path: string }> = [];
    const pathSegments = path.split('/').filter(Boolean);
    
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const route = findRoute(currentPath);
      if (route) {
        crumbs.push({
          name: route.name,
          path: route.path
        });
      }
    }
    
    return crumbs;
  }, [findRoute]);

  // Check if user can navigate to path
  const canNavigateTo = useCallback((path: string): boolean => {
    const route = findRoute(path);
    if (!route) return false;

    // Check permissions (mock implementation)
    const userPermissions = [
      'read:developer',
      'read:projects',
      'read:repositories',
      'read:pipelines',
      'read:deployments',
      'read:logs',
      'read:errors',
      'read:api',
      'write:settings'
    ];

    return route.permissions.every(permission => userPermissions.includes(permission));
  }, [findRoute]);

  // Navigate to path with validation
  const navigateTo = useCallback((path: string) => {
    if (canNavigateTo(path)) {
      router.push(path);
    } else {
      console.warn(`❌ Access denied to: ${path}`);
      // Redirect to dashboard if access denied
      router.push('/developer/dashboard');
    }
  }, [router, canNavigateTo]);

  // Go back functionality
  const goBack = useCallback(() => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/developer/dashboard');
    }
  }, [router]);

  // Check if route is active
  const isRouteActive = useCallback((path: string): boolean => {
    if (path === pathname) return true;
    if (path.endsWith('/*')) {
      const prefix = path.slice(0, -2);
      return pathname.startsWith(prefix);
    }
    return false;
  }, [pathname]);

  // Get complete route hierarchy
  const getRouteHierarchy = useCallback((): RouteConfig[] => {
    return routeConfig;
  }, []);

  // Update current route and breadcrumbs when path changes
  useEffect(() => {
    const route = findRoute(pathname);
    setCurrentRoute(route);
    setBreadcrumbs(generateBreadcrumbs(pathname));
  }, [pathname, findRoute, generateBreadcrumbs]);

  // Validate current route on mount
  useEffect(() => {
    if (pathname.startsWith('/developer') && !canNavigateTo(pathname)) {
      console.warn(`❌ Invalid route access: ${pathname}`);
      router.push('/developer/dashboard');
    }
  }, [pathname, canNavigateTo, router]);

  // Route change monitoring
  useEffect(() => {
    const handleRouteChange = () => {
      console.log(`🔄 Route changed to: ${pathname}`);
      const route = findRoute(pathname);
      if (route) {
        console.log(`✅ Loaded: ${route.name} (${route.component})`);
      }
    };

    handleRouteChange();
  }, [pathname, findRoute]);

  return {
    currentRoute,
    breadcrumbs,
    navigateTo,
    goBack,
    canNavigateTo,
    getRouteHierarchy,
    isRouteActive
  };
};

export default useDeveloperRouting;
