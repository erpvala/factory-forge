// @ts-nocheck
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerRoleAuth } from '@/hooks/useResellerRoleAuth';

interface ResellerRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ResellerRouteGuard: React.FC<ResellerRouteGuardProps> = ({ 
  children, 
  requiredRole = 'reseller' 
}) => {
  const { isAuthenticated, user } = useResellerDashboardAuth();
  const { checkDirectAccess } = useResellerRoleAuth();
  const location = useLocation();

  useEffect(() => {
    // Log routing attempts for security
    if (isAuthenticated && user) {
      console.log(`🛡️ Route Guard: ${user.email} accessing ${location.pathname}`);
    }
  }, [isAuthenticated, user, location.pathname]);

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('🚫 Route Guard: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (user?.role !== requiredRole) {
    console.log(`🚫 Route Guard: Role mismatch. Required: ${requiredRole}, User: ${user?.role}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check direct URL access
  if (!checkDirectAccess(location.pathname)) {
    console.log(`🚫 Route Guard: Direct access blocked for ${location.pathname}`);
    return <Navigate to="/reseller/dashboard" replace />;
  }

  // Check for duplicate or invalid paths
  const validPaths = [
    '/reseller/dashboard',
    '/reseller/products',
    '/reseller/licenses',
    '/reseller/sales',
    '/reseller/earnings',
    '/reseller/invoices',
    '/reseller/customers',
    '/reseller/support',
    '/reseller/settings'
  ];

  const isPathValid = validPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  if (!isPathValid) {
    console.log(`🚫 Route Guard: Invalid path ${location.pathname}, redirecting to dashboard`);
    return <Navigate to="/reseller/dashboard" replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ResellerRouteGuard;
