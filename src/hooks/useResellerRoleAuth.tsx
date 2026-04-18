// @ts-nocheck
import { useState, useEffect, useContext, createContext } from 'react';
import { useResellerDashboardAuth } from './useResellerDashboardAuth';

interface RoleAuthContextType {
  canAccess: (resource: string) => boolean;
  canViewOwnData: (data: any) => boolean;
  isDataOwner: (data: any) => boolean;
  filteredData: <T>(data: T[]) => T[];
  checkDirectAccess: (path: string) => boolean;
}

const ResellerRoleAuthContext = createContext<RoleAuthContextType | undefined>(undefined);

export const useResellerRoleAuth = () => {
  const context = useContext(ResellerRoleAuthContext);
  if (!context) {
    throw new Error('useResellerRoleAuth must be used within ResellerRoleAuthProvider');
  }
  return context;
};

interface ResellerRoleAuthProviderProps {
  children: React.ReactNode;
}

export const ResellerRoleAuthProvider: React.FC<ResellerRoleAuthProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useResellerDashboardAuth();

  // Reseller can only access their own resources
  const canAccess = (resource: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const allowedResources = [
      'dashboard',
      'products',
      'licenses', 
      'sales',
      'earnings',
      'invoices',
      'customers',
      'support',
      'settings'
    ];
    
    return allowedResources.includes(resource);
  };

  // Check if user can view their own data
  const canViewOwnData = (data: any): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Check if data belongs to current reseller
    return data.resellerId === user.id || data.userId === user.id;
  };

  // Check if user is the data owner
  const isDataOwner = (data: any): boolean => {
    if (!isAuthenticated || !user) return false;
    
    return data.resellerId === user.id;
  };

  // Filter data to show only reseller's own data
  const filteredData = <T,>(data: T[]): T[] => {
    if (!isAuthenticated || !user) return [];
    
    return data.filter(item => {
      // Check if item belongs to current reseller
      return (item as any).resellerId === user.id || 
             (item as any).userId === user.id ||
             // For demo data, allow all (in real app, this would be filtered)
             !(item as any).resellerId;
    });
  };

  // Direct URL access check
  const checkDirectAccess = (path: string): boolean => {
    if (!isAuthenticated || !user) {
      // Redirect to login if trying to access protected route
      return false;
    }

    // Check if path is allowed for reseller role
    const allowedPaths = [
      '/control-panel/reseller-dashboard',
      '/reseller/products',
      '/reseller/licenses',
      '/reseller/sales',
      '/reseller/earnings',
      '/reseller/invoices',
      '/reseller/customers',
      '/reseller/support',
      '/reseller/settings'
    ];

    // Block access to admin/manager panels
    const blockedPaths = [
      '/admin',
      '/manager',
      '/franchise-manager',
      '/ai-ceo',
      '/reseller-manager'
    ];

    if (blockedPaths.some(blocked => path.startsWith(blocked))) {
      console.log('🚫 Access blocked: Admin/Manager panel access denied for reseller');
      return false;
    }

    return allowedPaths.some(allowed => path.startsWith(allowed));
  };

  const value: RoleAuthContextType = {
    canAccess,
    canViewOwnData,
    isDataOwner,
    filteredData,
    checkDirectAccess
  };

  return (
    <ResellerRoleAuthContext.Provider value={value}>
      {children}
    </ResellerRoleAuthContext.Provider>
  );
};

export default ResellerRoleAuthProvider;
