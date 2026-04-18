// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const useDeveloperAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate checking stored auth token
        const token = localStorage.getItem('developer_token');
        
        if (!token) {
          setAuthState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false
          });
          return;
        }

        // Simulate API call to validate token and get user data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: 'dev_1',
          name: 'John Developer',
          email: 'john@company.com',
          role: 'developer',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
          permissions: [
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
          ]
        };

        setAuthState({
          user: mockUser,
          loading: false,
          error: null,
          isAuthenticated: true
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Authentication failed',
          isAuthenticated: false
        });
        // Clear invalid token
        localStorage.removeItem('developer_token');
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (email === 'john@company.com' && password === 'password') {
        const mockUser: User = {
          id: 'dev_1',
          name: 'John Developer',
          email: 'john@company.com',
          role: 'developer',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
          permissions: [
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
          ]
        };

        // Store mock token
        localStorage.setItem('developer_token', 'mock_jwt_token_' + Date.now());

        setAuthState({
          user: mockUser,
          loading: false,
          error: null,
          isAuthenticated: true
        });

        // Redirect to dashboard
        router.push('/control-panel/developer-dashboard');
        
        return { success: true };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }, [router]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('developer_token');
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false
    });
    router.push('/login');
  }, [router]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string) => {
    return authState.user?.permissions.includes(permission) || false;
  }, [authState.user]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: string[]) => {
    if (!authState.user) return false;
    return permissions.some(permission => authState.user!.permissions.includes(permission));
  }, [authState.user]);

  // Check if user has all specified permissions
  const hasAllPermissions = useCallback((permissions: string[]) => {
    if (!authState.user) return false;
    return permissions.every(permission => authState.user!.permissions.includes(permission));
  }, [authState.user]);

  // Route guard function
  const requireAuth = useCallback((requiredPermissions?: string[]) => {
    if (!authState.isAuthenticated) {
      router.push('/login');
      return false;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAllPermissions(requiredPermissions)) {
        router.push('/control-panel/developer-dashboard'); // Redirect to dashboard if insufficient permissions
        return false;
      }
    }

    return true;
  }, [authState.isAuthenticated, hasAllPermissions, router]);

  // Role-based access check
  const hasRole = useCallback((role: string) => {
    return authState.user?.role === role;
  }, [authState.user]);

  // Check if user is admin or has elevated privileges
  const isAdmin = useCallback(() => {
    return authState.user?.role === 'admin' || authState.user?.role === 'super-admin';
  }, [authState.user]);

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    requireAuth
  };
};

export default useDeveloperAuth;
