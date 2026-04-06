// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useDeveloperAuth from '@/hooks/useDeveloperAuth';
import useDeveloperRoleAuth from '@/hooks/useDeveloperRoleAuth';
import useDeveloperRouting from '@/hooks/useDeveloperRouting';
import useDeveloperModuleConnection from '@/hooks/useDeveloperModuleConnection';
import useDeveloperDataFlowSync from '@/hooks/useDeveloperDataFlowSync';
import useDeveloperSessionGuard from '@/hooks/useDeveloperSessionGuard';
import useDeveloperErrorHandling from '@/hooks/useDeveloperErrorHandling';
import useDeveloperLogging from '@/hooks/useDeveloperLogging';
import useDeveloperWorkflow from '@/hooks/useDeveloperWorkflow';
import useDeveloperPerformance from '@/hooks/useDeveloperPerformance';
import useDeveloperSecurity from '@/hooks/useDeveloperSecurity';
import DeveloperTraceableNotifications from '@/components/developer/DeveloperTraceableNotifications';
import { NotificationToast } from '@/components/developer/DeveloperTraceableNotifications';
import developerApiService from '@/services/developerApiService';
import {
  LayoutDashboard,
  FolderOpen,
  GitBranch,
  GitCommit,
  Activity,
  Cloud,
  FileText,
  AlertTriangle,
  Code,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Link as LinkIcon,
  Database,
  RefreshCw
} from 'lucide-react';

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

const DeveloperLayout: React.FC<DeveloperLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Initialize all hooks
  const { user, isAuthenticated, logout } = useDeveloperAuth();
  const { userRole, canAccessModule, getAccessibleModules } = useDeveloperRoleAuth();
  const { breadcrumbs, navigateTo, isRouteActive } = useDeveloperRouting();
  const { connections, syncModuleData, getConnectionStatus } = useDeveloperModuleConnection();
  const { getSyncStatusSummary, validateDataConsistency } = useDeveloperDataFlowSync();
  
  // NEW: Advanced hooks for Checkpoints 13-20
  const sessionGuard = useDeveloperSessionGuard();
  const errorHandler = useDeveloperErrorHandling();
  const logger = useDeveloperLogging();
  const workflow = useDeveloperWorkflow();
  const performance = useDeveloperPerformance();
  const security = useDeveloperSecurity();
  
  // State for notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationToasts, setNotificationToasts] = useState<any[]>([]);

  // Enhanced session and security management
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('AUTH', `User logged in: ${user.name}`, { userId: user.id, role: userRole });
      
      // Initialize security session
      security.logSecurityEvent(
        'AUTH_BYPASS' as any,
        'LOW' as any,
        'User session established',
        { userId: user.id, role: userRole }
      );
    }
  }, [isAuthenticated, user, userRole, logger, security]);

  // Monitor performance and log issues
  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.metrics.averageResponseTime > 1000) {
        logger.warn('PERFORMANCE', 'Slow response times detected', performance.metrics);
      }
      
      if (security.threatLevel !== 'LOW') {
        logger.warn('SECURITY', `Threat level elevated: ${security.threatLevel}`, {
          threatLevel: security.threatLevel,
          recentEvents: security.getRecentEvents(10)
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [performance, security, logger]);

  // Handle workflow events
  useEffect(() => {
    const handleWorkflowEvent = (event: any) => {
      logger.logEntityAction(
        event.entityType || 'workflow',
        event.entityId || 'unknown',
        event.action || 'unknown',
        event.result || 'success',
        event.message || 'Workflow action completed',
        event.details
      );
    };

    // Listen for workflow events
    window.addEventListener('workflow-event', handleWorkflowEvent);
    return () => window.removeEventListener('workflow-event', handleWorkflowEvent);
  }, [logger]);

  // Enhanced logout with cleanup
  const handleLogout = () => {
    logger.info('AUTH', 'User logging out', { userId: user?.id });
    security.logSecurityEvent(
      'AUTH_BYPASS' as any,
      'LOW' as any,
      'User session terminated',
      { userId: user?.id }
    );
    
    // Clean up all sessions and caches
    performance.clearCache();
    sessionGuard.logout();
    logout();
  };

  // Add notification toast
  const addNotificationToast = (notification: any) => {
    setNotificationToasts(prev => [...prev, notification]);
    setTimeout(() => {
      setNotificationToasts(prev => prev.slice(1));
    }, 5000);
  };

  // Listen for new notifications
  useEffect(() => {
    if (logger.notifications.length > 0 && !showNotifications) {
      const latestNotification = logger.notifications[0];
      if (!latestNotification.read) {
        addNotificationToast(latestNotification);
      }
    }
  }, [logger.notifications, showNotifications]);
  
  const [systemStatus, setSystemStatus] = useState({
    connections: { total: 0, active: 0, inactive: 0, error: 0 },
    sync: { total: 0, synced: 0, syncing: 0, error: 0 }
  });

  // Update system status
  useEffect(() => {
    const connectionStatus = getConnectionStatus();
    const syncStatus = getSyncStatusSummary();
    
    setSystemStatus({
      connections: connectionStatus,
      sync: syncStatus
    });
  }, [connections, getSyncStatusSummary, getConnectionStatus]);

  // Validate data consistency on mount
  useEffect(() => {
    const validateSystem = async () => {
      const validation = await validateDataConsistency();
      if (!validation.consistent) {
        console.warn('⚠️ Data consistency issues detected:', validation.issues);
      }
    };
    
    if (isAuthenticated) {
      validateSystem();
    }
  }, [isAuthenticated, validateDataConsistency]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/developer/dashboard',
      icon: LayoutDashboard,
      current: isRouteActive('/developer/dashboard')
    },
    {
      name: 'Projects',
      href: '/developer/projects',
      icon: FolderOpen,
      current: isRouteActive('/developer/projects')
    },
    {
      name: 'Repositories',
      href: '/developer/repositories',
      icon: GitBranch,
      current: isRouteActive('/developer/repositories')
    },
    {
      name: 'Commits',
      href: '/developer/commits',
      icon: GitCommit,
      current: isRouteActive('/developer/commits')
    },
    {
      name: 'Pipelines',
      href: '/developer/pipelines',
      icon: Activity,
      current: isRouteActive('/developer/pipelines')
    },
    {
      name: 'Deployments',
      href: '/developer/deployments',
      icon: Cloud,
      current: isRouteActive('/developer/deployments')
    },
    {
      name: 'Logs',
      href: '/developer/dev-logs',
      icon: FileText,
      current: isRouteActive('/developer/dev-logs')
    },
    {
      name: 'Errors',
      href: '/developer/dev-errors',
      icon: AlertTriangle,
      current: isRouteActive('/developer/dev-errors')
    },
    {
      name: 'API',
      href: '/developer/dev-api',
      icon: Code,
      current: isRouteActive('/developer/dev-api')
    },
    {
      name: 'Settings',
      href: '/developer/dev-settings',
      icon: Settings,
      current: isRouteActive('/developer/dev-settings')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold">DevOps</h1>
                <p className="text-xs text-muted-foreground">Developer Portal</p>
              </div>
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

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${item.current
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  onClick={() => {
                    setSidebarOpen(false);
                    navigateTo(item.href);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.name === 'Errors' && (
                    <Badge variant="destructive" className="ml-auto">
                      2
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Developer</p>
                <p className="text-xs text-muted-foreground truncate">john@company.com</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-background border-b px-4 shadow-sm lg:px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <span>/</span>}
                  <button
                    onClick={() => navigateTo(crumb.path)}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center space-x-4 mr-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Connections: {systemStatus.connections.active}/{systemStatus.connections.total}
                </span>
              </div>
              
              {/* Sync Status */}
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Sync: {systemStatus.sync.synced}/{systemStatus.sync.total}
                </span>
              </div>

              {/* Role Badge */}
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <Badge variant="outline" className="text-xs">
                  {userRole}
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects, repositories, commits..."
                className="w-96 pl-10 pr-4 py-2 text-sm bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {systemStatus.connections.error > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>

            {/* Quick actions */}
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DeveloperLayout;
