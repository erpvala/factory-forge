// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RolePermissions {
  developer: {
    allowed: string[];
    blocked: string[];
  };
  admin: {
    allowed: string[];
    blocked: string[];
  };
  super_admin: {
    allowed: string[];
    blocked: string[];
  };
}

const useDeveloperRoleAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('developer');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Role-based permissions configuration
  const rolePermissions: RolePermissions = {
    developer: {
      allowed: [
        '/developer/dashboard',
        '/developer/projects',
        '/developer/repositories',
        '/developer/commits',
        '/developer/pipelines',
        '/developer/deployments',
        '/developer/dev-logs',
        '/developer/dev-errors',
        '/developer/dev-api',
        '/developer/dev-settings'
      ],
      blocked: [
        '/admin',
        '/admin/*',
        '/business',
        '/business/*',
        '/franchise-manager',
        '/franchise-manager/*',
        '/ai-ceo',
        '/ai-ceo/*'
      ]
    },
    admin: {
      allowed: [
        '/developer/*',
        '/admin/dashboard',
        '/admin/users',
        '/admin/settings'
      ],
      blocked: [
        '/business',
        '/business/*',
        '/franchise-manager',
        '/franchise-manager/*',
        '/ai-ceo/scanner'
      ]
    },
    super_admin: {
      allowed: [
        '/developer/*',
        '/admin/*',
        '/business/*',
        '/franchise-manager/*',
        '/ai-ceo/*'
      ],
      blocked: []
    }
  };

  // Check if current path is allowed for user role
  const isPathAllowed = useCallback((path: string, role: string): boolean => {
    const permissions = rolePermissions[role as keyof RolePermissions];
    
    // Check if path is explicitly blocked
    for (const blocked of permissions.blocked) {
      if (blocked.endsWith('*')) {
        const prefix = blocked.slice(0, -1);
        if (path.startsWith(prefix)) {
          return false;
        }
      } else if (path === blocked) {
        return false;
      }
    }
    
    // Check if path is explicitly allowed
    for (const allowed of permissions.allowed) {
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1);
        if (path.startsWith(prefix)) {
          return true;
        }
      } else if (path === allowed) {
        return true;
      }
    }
    
    // Default to denied for developers, allowed for others
    return role !== 'developer';
  }, []);

  // Validate direct URL access
  const validateDirectAccess = useCallback(() => {
    const token = localStorage.getItem('developer_token');
    
    if (!token) {
      // No token - redirect to login
      router.push('/login');
      return false;
    }

    // Simulate token validation and role extraction
    const mockUserRole = 'developer'; // In real app, decode from JWT
    setUserRole(mockUserRole);

    // Check if current path is allowed
    if (!isPathAllowed(pathname, mockUserRole)) {
      setAccessDenied(true);
      // Redirect to appropriate dashboard based on role
      if (mockUserRole === 'developer') {
        router.push('/developer/dashboard');
      } else if (mockUserRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/developer/dashboard');
      }
      return false;
    }

    setAccessDenied(false);
    return true;
  }, [pathname, router, isPathAllowed]);

  // Initialize authentication check
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Simulate authentication check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isValid = validateDirectAccess();
      setLoading(false);
      
      if (isValid) {
        console.log(`✅ User authenticated as: ${userRole}`);
        console.log(`✅ Access granted to: ${pathname}`);
      }
    };

    initAuth();
  }, [validateDirectAccess, userRole, pathname]);

  // Monitor route changes
  useEffect(() => {
    if (!loading) {
      validateDirectAccess();
    }
  }, [pathname, loading, validateDirectAccess]);

  // Check specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    const token = localStorage.getItem('developer_token');
    if (!token) return false;

    // Permission mapping based on role
    const rolePermissionsMap: Record<string, string[]> = {
      developer: [
        'read:projects',
        'write:projects',
        'read:repositories',
        'write:repositories',
        'read:pipelines',
        'write:pipelines',
        'read:deployments',
        'write:deployments',
        'read:logs',
        'read:errors',
        'read:api',
        'write:settings'
      ],
      admin: [
        ...rolePermissions.developer,
        'read:admin',
        'write:admin',
        'read:users',
        'write:users'
      ],
      super_admin: [
        ...rolePermissions.admin,
        'read:business',
        'write:business',
        'read:franchise',
        'write:franchise',
        'read:ai-ceo',
        'write:ai-ceo'
      ]
    };

    return rolePermissionsMap[userRole]?.includes(permission) || false;
  }, [userRole]);

  // Check if user can access specific module
  const canAccessModule = useCallback((module: string): boolean => {
    const modulePaths: Record<string, string> = {
      'developer': '/developer/dashboard',
      'admin': '/admin/dashboard',
      'business': '/business/dashboard',
      'franchise': '/franchise-manager/dashboard',
      'ai-ceo': '/ai-ceo/dashboard'
    };

    const modulePath = modulePaths[module];
    if (!modulePath) return false;

    return isPathAllowed(modulePath, userRole);
  }, [userRole, isPathAllowed]);

  // Get accessible modules for current user
  const getAccessibleModules = useCallback((): string[] => {
    const allModules = ['developer', 'admin', 'business', 'franchise', 'ai-ceo'];
    return allModules.filter(module => canAccessModule(module));
  }, [canAccessModule]);

  // Role-based navigation guard
  const requireRole = useCallback((requiredRole: string): boolean => {
    const roleHierarchy = ['developer', 'admin', 'super_admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [userRole]);

  // Redirect based on role
  const redirectToRoleDashboard = useCallback(() => {
    const dashboardPaths: Record<string, string> = {
      developer: '/developer/dashboard',
      admin: '/admin/dashboard',
      super_admin: '/ai-ceo/dashboard'
    };

    const targetPath = dashboardPaths[userRole] || '/developer/dashboard';
    router.push(targetPath);
  }, [userRole, router]);

  return {
    userRole,
    loading,
    accessDenied,
    hasPermission,
    canAccessModule,
    getAccessibleModules,
    requireRole,
    redirectToRoleDashboard,
    validateDirectAccess,
    isPathAllowed
  };
};

export default useDeveloperRoleAuth;
