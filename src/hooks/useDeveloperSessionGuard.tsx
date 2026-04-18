// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Session types
interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'developer' | 'admin' | 'super_admin';
  permissions: string[];
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
}

interface SessionGuardConfig {
  maxInactivity: number; // in minutes
  maxSessionDuration: number; // in hours
  refreshThreshold: number; // in minutes
  requireAuth: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

const defaultConfig: SessionGuardConfig = {
  maxInactivity: 30, // 30 minutes
  maxSessionDuration: 8, // 8 hours
  refreshThreshold: 5, // 5 minutes before expiry
  requireAuth: true,
  allowedRoles: ['developer', 'admin', 'super_admin'],
  redirectTo: '/developer/login'
};

// Session management hook
const useDeveloperSessionGuard = (config: Partial<SessionGuardConfig> = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  
  const finalConfig = { ...defaultConfig, ...config };
  const storageKey = 'developer_session';
  const activityKey = 'developer_last_activity';

  // Check if session is expired
  const isSessionExpired = useCallback((sessionData: UserSession): boolean => {
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const lastActivity = new Date(sessionData.lastActivity);
    
    // Check absolute expiry
    if (now > expiresAt) {
      return true;
    }
    
    // Check inactivity timeout
    const inactivityMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    if (inactivityMinutes > finalConfig.maxInactivity) {
      return true;
    }
    
    return false;
  }, [finalConfig.maxInactivity]);

  // Check if session is about to expire
  const isSessionAboutToExpire = useCallback((sessionData: UserSession): boolean => {
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
    
    return minutesUntilExpiry <= finalConfig.refreshThreshold;
  }, [finalConfig.refreshThreshold]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const currentSession = getSession();
      if (!currentSession) {
        return false;
      }

      // Simulate API call to refresh session
      await new Promise(resolve => setTimeout(resolve, 300));

      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + finalConfig.maxSessionDuration);

      const refreshedSession: UserSession = {
        ...currentSession,
        lastActivity: new Date().toISOString(),
        expiresAt: newExpiresAt.toISOString()
      };

      setSession(refreshedSession);
      saveSession(refreshedSession);
      updateLastActivity();

      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [finalConfig.maxSessionDuration]);

  // Get session from storage
  const getSession = useCallback((): UserSession | null => {
    try {
      const sessionData = localStorage.getItem(storageKey);
      if (!sessionData) {
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);
      
      // Validate session structure
      if (!session.id || !session.email || !session.role || !session.expiresAt) {
        clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to parse session:', error);
      clearSession();
      return null;
    }
  }, []);

  // Save session to storage
  const saveSession = useCallback((sessionData: UserSession) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(activityKey);
      setSession(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  // Update last activity
  const updateLastActivity = useCallback(() => {
    try {
      localStorage.setItem(activityKey, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, []);

  // Check user permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!session) return false;
    return session.permissions.includes(permission) || session.role === 'super_admin';
  }, [session]);

  // Check user role
  const hasRole = useCallback((role: string): boolean => {
    if (!session) return false;
    return session.role === role || session.role === 'super_admin';
  }, [session]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Simulate API call for authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication (in production, this would be a real API call)
      if (email === 'developer@company.com' && password === 'password123') {
        const loginTime = new Date();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + finalConfig.maxSessionDuration);

        const newSession: UserSession = {
          id: `user_${Date.now()}`,
          email,
          name: 'John Developer',
          role: 'developer',
          permissions: [
            'read:projects',
            'write:projects',
            'read:repositories',
            'write:repositories',
            'read:commits',
            'write:commits',
            'read:pipelines',
            'write:pipelines',
            'read:deployments',
            'write:deployments',
            'read:logs',
            'read:errors',
            'read:api',
            'write:settings'
          ],
          loginTime: loginTime.toISOString(),
          lastActivity: loginTime.toISOString(),
          expiresAt: expiresAt.toISOString()
        };

        setSession(newSession);
        saveSession(newSession);
        updateLastActivity();
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig.maxSessionDuration, saveSession, updateLastActivity]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Simulate API call for logout
      await new Promise(resolve => setTimeout(resolve, 500));

      clearSession();
      
      // Redirect to login page
      if (finalConfig.redirectTo) {
        router.push(finalConfig.redirectTo);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, finalConfig.redirectTo, router]);

  // Check route access
  const canAccessRoute = useCallback((path: string): boolean => {
    if (!session) return false;

    // Public routes that don't require authentication
    const publicRoutes = ['/developer/login', '/developer/register', '/developer/forgot-password'];
    if (publicRoutes.includes(path)) {
      return true;
    }

    // Check if user has required role
    if (finalConfig.allowedRoles && !finalConfig.allowedRoles.includes(session.role)) {
      return false;
    }

    // Check specific route permissions
    const routePermissions: Record<string, string[]> = {
      '/developer': ['read:projects'],
      '/developer/projects': ['read:projects'],
      '/developer/repositories': ['read:repositories'],
      '/developer/commits': ['read:commits'],
      '/developer/pipelines': ['read:pipelines'],
      '/developer/deployments': ['read:deployments'],
      '/developer/dev-logs': ['read:logs'],
      '/developer/dev-errors': ['read:errors'],
      '/developer/dev-api': ['read:api'],
      '/developer/dev-settings': ['write:settings']
    };

    const requiredPermissions = routePermissions[path];
    if (requiredPermissions) {
      return requiredPermissions.some(permission => hasPermission(permission));
    }

    return true;
  }, [session, finalConfig.allowedRoles, hasPermission]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);

      const currentSession = getSession();
      
      if (!currentSession) {
        if (finalConfig.requireAuth && !canAccessRoute(pathname)) {
          router.push(finalConfig.redirectTo || '/developer/login');
        }
        setIsLoading(false);
        return;
      }

      // Check if session is expired
      if (isSessionExpired(currentSession)) {
        clearSession();
        if (finalConfig.requireAuth && !canAccessRoute(pathname)) {
          router.push(finalConfig.redirectTo || '/developer/login');
        }
        setIsLoading(false);
        return;
      }

      // Check if user can access current route
      if (!canAccessRoute(pathname)) {
        router.push('/control-panel/developer-dashboard');
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      setIsAuthenticated(true);
      updateLastActivity();
      setIsLoading(false);
    };

    initializeSession();
  }, [pathname, getSession, isSessionExpired, canAccessRoute, clearSession, finalConfig.requireAuth, finalConfig.redirectTo, router, updateLastActivity]);

  // Monitor session expiry and activity
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const currentSession = getSession();
      if (!currentSession) {
        return;
      }

      // Check if session is expired
      if (isSessionExpired(currentSession)) {
        setSessionWarning('Your session has expired. Please log in again.');
        setTimeout(() => {
          logout();
        }, 3000);
        return;
      }

      // Check if session is about to expire
      if (isSessionAboutToExpire(currentSession)) {
        setSessionWarning('Your session is about to expire. Refreshing...');
        refreshSession();
        setTimeout(() => {
          setSessionWarning(null);
        }, 2000);
      }

      // Update last activity
      updateLastActivity();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, getSession, isSessionExpired, isSessionAboutToExpire, refreshSession, logout, updateLastActivity]);

  // Monitor user activity
  useEffect(() => {
    if (!session) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, updateLastActivity]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(() => {
      const currentSession = getSession();
      if (currentSession && isSessionAboutToExpire(currentSession)) {
        refreshSession();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [session, getSession, isSessionAboutToExpire, refreshSession]);

  return {
    session,
    isLoading,
    isAuthenticated,
    sessionWarning,
    hasPermission,
    hasRole,
    canAccessRoute,
    login,
    logout,
    refreshSession,
    clearSession
  };
};

export default useDeveloperSessionGuard;
