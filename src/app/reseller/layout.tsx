// @ts-nocheck
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Package,
  Key,
  CreditCard,
  DollarSign,
  FileText,
  Users,
  Headphones,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  User
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerRoleAuth } from '@/hooks/useResellerRoleAuth';
import { ResellerRouteGuard } from '@/components/reseller/ResellerRouteGuard';
import { ResellerAuthProvider } from '@/hooks/useResellerDashboardAuth';
import { ResellerStateProvider } from '@/hooks/useResellerDashboardState';
import { ResellerRoleAuthProvider } from '@/hooks/useResellerRoleAuth';
import { useResellerDashboardStore } from '@/store/resellerDashboardStore';
import { useResellerDemoDataService } from '@/services/resellerDemoDataService';

const ResellerLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useResellerDashboardAuth();
  const { canAccess, checkDirectAccess } = useResellerRoleAuth();
  const { refreshAllData } = useResellerDashboardStore();
  const { initializeDemoData, simulateRealTimeUpdates } = useResellerDemoDataService();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize demo data and real-time updates
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize demo data for the reseller
      initializeDemoData(user.id);
      
      // Start real-time simulation
      simulateRealTimeUpdates(user.id);
      
      // Refresh all data
      refreshAllData();
    }
  }, [isAuthenticated, user, initializeDemoData, simulateRealTimeUpdates, refreshAllData]);

  // Validate direct access on mount
  React.useEffect(() => {
    if (isAuthenticated && !checkDirectAccess(location.pathname)) {
      console.log('🚫 Direct access blocked, redirecting to dashboard');
      navigate('/reseller/dashboard');
    }
  }, [isAuthenticated, location.pathname, checkDirectAccess, navigate]);

  const menuItems = [
    {
      path: '/reseller/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/reseller/products',
      label: 'Products',
      icon: Package
    },
    {
      path: '/reseller/licenses',
      label: 'Licenses',
      icon: Key
    },
    {
      path: '/reseller/sales',
      label: 'Sales',
      icon: CreditCard
    },
    {
      path: '/reseller/earnings',
      label: 'Earnings',
      icon: DollarSign
    },
    {
      path: '/reseller/invoices',
      label: 'Invoices',
      icon: FileText
    },
    {
      path: '/reseller/customers',
      label: 'Customers',
      icon: Users
    },
    {
      path: '/reseller/support',
      label: 'Support',
      icon: Headphones
    },
    {
      path: '/reseller/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the reseller dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold">Reseller Portal</h2>
              <p className="text-sm text-muted-foreground">WHMCS Client Area</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user?.name || 'Reseller'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'reseller@example.com'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.path === location.pathname)?.label || 'Reseller Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{user?.name || 'Reseller'}</span>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <ResellerRouteGuard>
            <Outlet />
          </ResellerRouteGuard>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ResellerLayout;

// Wrapper component with all providers
export const ResellerLayoutWithProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResellerAuthProvider>
      <ResellerStateProvider>
        <ResellerRoleAuthProvider>
          {children}
        </ResellerRoleAuthProvider>
      </ResellerStateProvider>
    </ResellerAuthProvider>
  );
};
