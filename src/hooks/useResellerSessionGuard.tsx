// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Session types
interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  loginTime: number;
  lastActivity: number;
  expiresAt: number;
}

interface SessionGuardOptions {
  sessionTimeout?: number; // in milliseconds (default: 30 minutes)
  activityCheckInterval?: number; // in milliseconds (default: 1 minute)
  enableAutoLogout?: boolean; // default: true
}

// Session guard hook
export const useResellerSessionGuard = (options: SessionGuardOptions = {}) => {
  const {
    sessionTimeout = 30 * 60 * 1000, // 30 minutes
    activityCheckInterval = 60 * 1000, // 1 minute
    enableAutoLogout = true
  } = options;

  const [session, setSession] = useState<SessionData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Storage keys
  const SESSION_KEY = 'reseller_session';
  const ACTIVITY_KEY = 'reseller_last_activity';

  // Initialize session from storage
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        if (isSessionValid(sessionData)) {
          setSession(sessionData);
          setIsAuthenticated(true);
          updateLastActivity();
        } else {
          // Session expired, clear it
          clearSession();
        }
      } catch (error) {
        console.error('Failed to parse session:', error);
        clearSession();
      }
    }
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback((sessionData: SessionData): boolean => {
    if (!sessionData || !sessionData.token || !sessionData.expiresAt) {
      return false;
    }

    const now = Date.now();
    return now < sessionData.expiresAt;
  }, []);

  // Update last activity
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(ACTIVITY_KEY, now.toString());
    
    if (session) {
      setSession(prev => prev ? { ...prev, lastActivity: now } : null);
    }
  }, [session]);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
      setSessionWarning(false);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateLastActivity]);

  // Session monitoring
  useEffect(() => {
    if (!isAuthenticated || !enableAutoLogout) return;

    const checkSession = () => {
      if (!session) return;

      const now = Date.now();
      const timeUntilExpiry = session.expiresAt - now;
      const warningTime = 5 * 60 * 1000; // 5 minutes before expiry

      if (timeUntilExpiry <= 0) {
        // Session expired
        handleSessionExpired();
      } else if (timeUntilExpiry <= warningTime) {
        // Show warning
        setSessionWarning(true);
      }
    };

    const interval = setInterval(checkSession, activityCheckInterval);
    return () => clearInterval(interval);
  }, [session, isAuthenticated, enableAutoLogout, activityCheckInterval]);

  // Route protection
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const publicRoutes = ['/reseller/login', '/reseller/forgot-password'];
      const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
      
      if (!isPublicRoute) {
        navigate('/reseller/login', { 
          state: { returnUrl: location.pathname } 
        });
      }
    } else {
      // Check role-based access
      const protectedRoutes = {
        '/control-panel/reseller-dashboard': ['reseller', 'admin'],
        '/reseller/customers': ['reseller', 'admin'],
        '/reseller/products': ['reseller', 'admin'],
        '/reseller/licenses': ['reseller', 'admin'],
        '/reseller/sales': ['reseller', 'admin'],
        '/reseller/earnings': ['reseller', 'admin'],
        '/reseller/invoices': ['reseller', 'admin'],
        '/reseller/support': ['reseller', 'admin'],
        '/reseller/settings': ['reseller', 'admin']
      };

      const currentRoute = Object.keys(protectedRoutes).find(route => 
        location.pathname.startsWith(route)
      );

      if (currentRoute && session) {
        const allowedRoles = protectedRoutes[currentRoute as keyof typeof protectedRoutes];
        if (!allowedRoles.includes(session.user.role)) {
          // User doesn't have permission
          navigate('/reseller/unauthorized');
        }
      }
    }
  }, [isAuthenticated, session, location, navigate]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo authentication (in real app, this would be an API call)
      if (email === 'reseller@demo.com' && password === 'demo123') {
        const now = Date.now();
        const sessionData: SessionData = {
          user: {
            id: 'reseller-001',
            email: 'reseller@demo.com',
            name: 'Demo Reseller',
            role: 'reseller'
          },
          token: `demo-token-${now}`,
          loginTime: now,
          lastActivity: now,
          expiresAt: now + sessionTimeout
        };

        setSession(sessionData);
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        updateLastActivity();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [sessionTimeout, updateLastActivity]);

  // Logout function
  const logout = useCallback(() => {
    clearSession();
    navigate('/reseller/login');
  }, [navigate]);

  // Clear session
  const clearSession = useCallback(() => {
    setSession(null);
    setIsAuthenticated(false);
    setSessionWarning(false);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  }, []);

  // Handle session expired
  const handleSessionExpired = useCallback(() => {
    console.log('Session expired, logging out...');
    clearSession();
    navigate('/reseller/login', { 
      state: { sessionExpired: true } 
    });
  }, [clearSession, navigate]);

  // Extend session
  const extendSession = useCallback(() => {
    if (!session) return;

    const now = Date.now();
    const extendedSession: SessionData = {
      ...session,
      lastActivity: now,
      expiresAt: now + sessionTimeout
    };

    setSession(extendedSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(extendedSession));
    setSessionWarning(false);
  }, [session, sessionTimeout]);

  // Check if user can access specific resource
  const canAccessResource = useCallback((resourceId: string, resourceType: string): boolean => {
    if (!isAuthenticated || !session) return false;

    // Check if user is admin (can access everything)
    if (session.user.role === 'admin') return true;

    // For resellers, check if they own the resource
    if (session.user.role === 'reseller') {
      // In a real app, this would check if the resource belongs to the reseller
      // For demo, we'll assume resellers can access their own resources
      return resourceId.startsWith(session.user.id);
    }

    return false;
  }, [isAuthenticated, session]);

  // Get session time remaining
  const getSessionTimeRemaining = useCallback((): number => {
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }, [session]);

  return {
    session,
    isAuthenticated,
    sessionWarning,
    login,
    logout,
    extendSession,
    clearSession,
    canAccessResource,
    getSessionTimeRemaining,
    updateLastActivity
  };
};

// Session provider component
export const ResellerSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionGuard = useResellerSessionGuard();
  
  return (
    <div>
      {/* Session warning modal */}
      {sessionGuard.sessionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Session Expiring Soon</h3>
            <p className="text-gray-600 mb-6">
              Your session will expire in less than 5 minutes. Would you like to extend it?
            </p>
            <div className="flex gap-4">
              <button
                onClick={sessionGuard.extendSession}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Extend Session
              </button>
              <button
                onClick={sessionGuard.logout}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default useResellerSessionGuard;
