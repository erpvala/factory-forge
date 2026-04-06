// @ts-nocheck
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Package, 
  Key, 
  TrendingUp, 
  Percent, 
  CreditCard, 
  FileText,
  Menu,
  X,
  LogOut,
  Shield,
  Activity,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResellerManagerGuard } from '@/hooks/useResellerManagerGuard';
import { useResellerManagerAuth } from '@/hooks/useResellerManagerAuth';
import { useResellerManagerEvents } from '@/hooks/useResellerManagerEvents';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const ResellerManagerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [valaId] = useState('VL-RM-' + Math.random().toString(36).substring(2, 8).toUpperCase());

  useResellerManagerGuard();
  const { auth, logout, canAccessFeature, getAllActiveFlows } = useResellerManagerAuth();
  const { getAllActiveFlows: getActiveEventFlows } = useResellerManagerEvents();

  const activeFlows = getAllActiveFlows();
  const activeEventFlows = getActiveEventFlows();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/reseller-manager/dashboard' },
    { id: 'resellers', label: 'Resellers', icon: Users, path: '/reseller-manager/resellers' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, path: '/reseller-manager/onboarding', badge: canAccessFeature('onboarding_approve') ? 'New' : undefined },
    { id: 'products', label: 'Products', icon: Package, path: '/reseller-manager/products' },
    { id: 'licenses', label: 'Licenses', icon: Key, path: '/reseller-manager/licenses' },
    { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/reseller-manager/sales' },
    { id: 'commission', label: 'Commission', icon: Percent, path: '/reseller-manager/commission' },
    { id: 'payout', label: 'Payout', icon: CreditCard, path: '/reseller-manager/payout', badge: canAccessFeature('payout_approve') ? 'Pending' : undefined },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/reseller-manager/invoices' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/reseller-manager/settings' }
  ].filter(item => {
    // Filter nav items based on permissions
    if (item.id === 'resellers' && !canAccessFeature('reseller_control')) return false;
    if (item.id === 'products' && !canAccessFeature('product_assign')) return false;
    if (item.id === 'licenses' && !canAccessFeature('license_manage')) return false;
    if (item.id === 'commission' && !canAccessFeature('commission_manage')) return false;
    if (item.id === 'payout' && !canAccessFeature('payout_approve')) return false;
    if (item.id === 'invoices' && !canAccessFeature('invoice_manage')) return false;
    if (item.id === 'onboarding' && !canAccessFeature('onboarding_approve')) return false;
    if (item.id === 'settings' && !canAccessFeature('reseller_control')) return false;
    return true;
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary/10 border-b border-primary/20 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                <Shield className="h-3 w-3 mr-1" />
                RESELLER MANAGER
              </Badge>
              <Badge variant="secondary" className="hidden sm:inline">
                {auth.userRole?.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm font-mono text-muted-foreground hidden sm:inline">
                {valaId}
              </span>
              {activeEventFlows.length > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  {activeEventFlows.length} Active Flow{activeEventFlows.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          mt-16 md:mt-0
        `}>
          <div className="h-full overflow-y-auto p-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={isActivePath(item.path) ? "default" : "ghost"}
                  className={`
                    w-full justify-start
                    ${isActivePath(item.path) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                  `}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResellerManagerLayout;
