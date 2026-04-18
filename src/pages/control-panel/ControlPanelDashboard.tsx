import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  Code2,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  PanelLeft,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import HomeDashboard from '@/components/control-panel/HomeDashboard';
import { ControlPanelContent } from '@/components/control-panel/ControlPanelContent';
import { PendingRequestsBanner } from '@/components/shared/PendingRequestsBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getModuleByRoute } from '@/config/controlPanelModules';
import {
  CONTROL_PANEL_WORKSPACES,
  getControlPanelWorkspaceByModuleId,
  getControlPanelWorkspaceBySegment,
  getControlPanelWorkspaceHref,
  getVisibleControlPanelWorkspaces,
} from '@/config/controlPanelHubRegistry';
import { callModuleApi } from '@/lib/api/edge-client';
import { useControlPanelNotifications } from '@/hooks/useControlPanelHub';
import { toast } from 'sonner';

const BossApplications = lazy(() => import('@/pages/apply/BossApplications'));
const AICEODashboard = lazy(() => import('@/pages/ai-ceo/AICEODashboard'));
const CentralIntegrationHub = lazy(() => import('@/pages/api-manager/CentralIntegrationHub'));
const SecureDevManagerDashboard = lazy(() => import('@/pages/dev-manager/SecureDevManagerDashboard'));
const ProductDemoManagerPage = lazy(() => import('@/pages/product-demo-manager/index'));
const MarketplaceManagerDashboard = lazy(() => import('@/pages/MarketplaceManagerDashboard'));
const ServerManagerDashboard = lazy(() => import('@/pages/server-manager/ServerManagerDashboard'));
const SecurityCommandCenter = lazy(() => import('@/pages/security-command/SecurityCommandCenter'));
const FinanceManager = lazy(() => import('@/pages/FinanceManager'));
const PerformanceManager = lazy(() => import('@/pages/PerformanceManager'));
const HooksControlPanel = lazy(() => import('@/pages/control-panel/HooksControlPanel'));
const SystemFlowPage = lazy(() => import('@/pages/SystemFlowPage'));
const ResellerDashboard = lazy(() => import('@/pages/ResellerDashboard'));
const FranchiseDashboardPage = lazy(() => import('@/pages/franchise/Dashboard'));
const InfluencerDashboard = lazy(() => import('@/pages/InfluencerDashboard'));
const SecureDeveloperDashboard = lazy(() => import('@/pages/developer/SecureDeveloperDashboard'));
const SupportDashboardPage = lazy(() => import('@/components/internal-support-ai/sections/SupportDashboard').then((module) => ({ default: module.SupportDashboard })));
const SecureResellerManagerDashboard = lazy(() => import('@/pages/reseller-manager/SecureResellerManagerDashboard'));
const SecureFranchiseManagerDashboard = lazy(() => import('@/pages/franchise-manager/SecureFranchiseManagerDashboard'));
const SecureInfluencerManagerDashboard = lazy(() => import('@/pages/influencer-manager/SecureInfluencerManagerDashboard'));
const SecureMarketingManagerDashboard2 = lazy(() => import('@/pages/marketing-manager/SecureMarketingManagerDashboard'));
const SecureSEOManagerDashboard2 = lazy(() => import('@/pages/seo-manager/SecureSEOManagerDashboard'));
const SecureLegalManagerDashboard2 = lazy(() => import('@/pages/legal-manager/SecureLegalManagerDashboard'));
const SecureTaskManagerDashboard2 = lazy(() => import('@/pages/task-manager/SecureTaskManagerDashboard'));
const AssistManagerDashboard = lazy(() => import('@/pages/assist-manager/AssistManagerDashboard'));
const SecureLeadManagerDashboard2 = lazy(() => import('@/pages/lead-manager/SecureLeadManagerDashboard'));
const SecureHRManagerDashboard = lazy(() => import('@/pages/hr-manager/SecureHRManagerDashboard'));

const ICON_MAP = {
  activity: Activity,
  'badge-check': Briefcase,
  'bar-chart-3': BarChart3,
  bell: Bell,
  bot: Bot,
  briefcase: Briefcase,
  'building-2': Building2,
  'code-2': Code2,
  handshake: Handshake,
  layout: LayoutDashboard,
  'life-buoy': LifeBuoy,
  megaphone: Megaphone,
  package: Package,
  'panel-left': PanelLeft,
  server: Server,
  shield: Shield,
  terminal: Terminal,
  users: Users,
  wallet: Wallet,
  workflow: Workflow,
} as const;

const EMBEDDED_MODULES: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  'ceo-dashboard': AICEODashboard,
  'ai-api-manager': CentralIntegrationHub,
  'development-manager': SecureDevManagerDashboard,
  'product-manager': ProductDemoManagerPage,
  'marketplace-manager': MarketplaceManagerDashboard,
  'server-manager': ServerManagerDashboard,
  'security-manager': SecurityCommandCenter,
  'finance-manager': FinanceManager,
  'customer-support': SupportDashboardPage,
  'analytics-manager': PerformanceManager,
  hooks: HooksControlPanel,
  health: SystemFlowPage,
  'developer-dashboard': SecureDeveloperDashboard,
  'reseller-dashboard': ResellerDashboard,
  'franchise-dashboard': FranchiseDashboardPage,
  'influencer-dashboard': InfluencerDashboard,
  'reseller-manager': SecureResellerManagerDashboard,
  'franchise-manager': SecureFranchiseManagerDashboard,
  'influencer-manager': SecureInfluencerManagerDashboard,
  'marketing-manager': SecureMarketingManagerDashboard2,
  'seo-manager': SecureSEOManagerDashboard2,
  'legal-manager': SecureLegalManagerDashboard2,
  'task-manager': SecureTaskManagerDashboard2,
  'assist-manager': AssistManagerDashboard,
  'lead-manager': SecureLeadManagerDashboard2,
  'hr-manager': SecureHRManagerDashboard,
};

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const WorkspaceLoader = () => (
  <div className="flex min-h-[320px] items-center justify-center text-slate-300">
    <div className="flex items-center gap-3">
      <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
      <span>Loading workspace...</span>
    </div>
  </div>
);

function NotificationsWorkspace() {
  const notificationsQuery = useControlPanelNotifications(24, 15000);

  if (notificationsQuery.loading && !notificationsQuery.data) {
    return <WorkspaceLoader />;
  }

  if (notificationsQuery.error && !notificationsQuery.data) {
    return (
      <Card className="border-red-500/30 bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-red-300">Notifications unavailable</CardTitle>
          <CardDescription>{notificationsQuery.error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => notificationsQuery.refresh()} className="bg-red-600 hover:bg-red-700 text-white">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(notificationsQuery.data || []).map((notification) => (
        <Card key={notification.id} className="border-slate-800 bg-slate-950/80">
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-white">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300">{formatRelativeTime(notification.createdAt)}</Badge>
          </CardContent>
        </Card>
      ))}
      {notificationsQuery.data?.length === 0 && (
        <Card className="border-slate-800 bg-slate-950/70">
          <CardContent className="p-6 text-sm text-slate-400">No notifications available right now.</CardContent>
        </Card>
      )}
    </div>
  );
}

function GenericModuleWorkspace({ moduleId, label }: { moduleId: string; label: string }) {
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: any | null }>({
    loading: true,
    error: null,
    data: null,
  });

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await callModuleApi<any>(moduleId, '', { method: 'GET' });
      setState({ loading: false, error: null, data: response.data });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : 'module_load_failed', data: null });
    }
  };

  useEffect(() => {
    void load();
  }, [moduleId]);

  const runAction = async (action: string) => {
    try {
      await callModuleApi(moduleId, '', { method: 'POST', body: { action } });
      toast.success(`${label} ${action} completed`);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${action} failed`);
    }
  };

  if (state.loading && !state.data) {
    return <WorkspaceLoader />;
  }

  if (state.error && !state.data) {
    return (
      <Card className="border-red-500/30 bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-red-300">{label} failed to load</CardTitle>
          <CardDescription>{state.error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void load()} className="bg-red-600 hover:bg-red-700 text-white">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-950/80">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-white">{label}</CardTitle>
            <CardDescription>Realtime module status and action bridge</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">{state.data?.status || 'unknown'}</Badge>
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => void load()}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['start', 'pause', 'stop', 'update'].map((action) => (
              <Button key={action} variant="outline" className="border-slate-700 text-slate-200" onClick={() => void runAction(action)}>
                {action}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(state.data?.recent_actions || []).slice(0, 8).map((action: any) => (
              <div key={action.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{action.action}</p>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">{action.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{formatRelativeTime(action.created_at)}</p>
              </div>
            ))}
          </div>
          {state.data?.recent_actions?.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">No module actions recorded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ControlPanelDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, approvedRoles } = useAuth();

  const activeRoles = useMemo(() => {
    return approvedRoles.length > 0 ? approvedRoles : userRole ? [userRole] : [];
  }, [approvedRoles, userRole]);

  const pathAfterBase = location.pathname.replace(/^\/control-panel\/?/, '');
  const [primarySegment, ...restSegments] = pathAfterBase.split('/').filter(Boolean);
  const moduleDef = getModuleByRoute(location.pathname);
  const workspace = getControlPanelWorkspaceBySegment(primarySegment) || getControlPanelWorkspaceByModuleId(moduleDef?.id) || CONTROL_PANEL_WORKSPACES[0];
  const canonicalWorkspacePath = getControlPanelWorkspaceHref(workspace);
  const moduleId = workspace.moduleId || moduleDef?.id || null;
  const isControlPanelAdmin = activeRoles.some((role) => ['boss_owner', 'ceo', 'super_admin'].includes(role));
  const canAccess =
    isControlPanelAdmin ||
    !workspace.allowedRoles ||
    workspace.allowedRoles.length === 0 ||
    activeRoles.some((role) => workspace.allowedRoles?.includes(role));
  const sidebarEntries = isControlPanelAdmin
    ? [...CONTROL_PANEL_WORKSPACES].sort((left, right) => (left.featureRank ?? 1000) - (right.featureRank ?? 1000))
    : getVisibleControlPanelWorkspaces(activeRoles);

  useEffect(() => {
    if (primarySegment && workspace && canonicalWorkspacePath !== `/control-panel/${primarySegment}`) {
      const suffix = restSegments.length > 0 ? `/${restSegments.join('/')}` : '';
      navigate(`${canonicalWorkspacePath}${suffix}`, { replace: true });
    }
  }, [canonicalWorkspacePath, navigate, primarySegment, restSegments, workspace]);

  const renderWorkspace = () => {
    if (!canAccess) {
      return (
        <Card className="border-amber-500/30 bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-amber-300">Access restricted</CardTitle>
            <CardDescription>This workspace is not available for your current role.</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (workspace.kind === 'overview') {
      return (
        <div className="space-y-6">
          <PendingRequestsBanner />
          <HomeDashboard />
        </div>
      );
    }

    if (workspace.kind === 'applications') {
      return <BossApplications />;
    }

    if (workspace.kind === 'notifications') {
      return <NotificationsWorkspace />;
    }

    if (moduleId && EMBEDDED_MODULES[moduleId]) {
      const ModuleView = EMBEDDED_MODULES[moduleId];
      return <ModuleView />;
    }

    if (moduleId) {
      return <GenericModuleWorkspace moduleId={moduleId} label={workspace.label} />;
    }

    return (
      <Card className="border-slate-800 bg-slate-950/80">
        <CardContent className="p-6 text-sm text-slate-400">Workspace not found.</CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/40">
          <div className="border-b border-white/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Control Panel</p>
            <h1 className="mt-2 text-lg font-semibold text-white">Single Power Center</h1>
          </div>

          <div className="space-y-4 p-3">
            <div className="space-y-1">
              {sidebarEntries.map((entry) => {
                const Icon = ICON_MAP[entry.icon as keyof typeof ICON_MAP] || PanelLeft;
                const isActive = workspace.key === entry.key;

                return (
                  <button
                    key={entry.key}
                    onClick={() => navigate(getControlPanelWorkspaceHref(entry))}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-blue-500/40 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="truncate text-xs text-slate-400">{entry.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-3">
              <ControlPanelContent />
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-slate-950/30">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Workspace</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{workspace.label}</h2>
              </div>
              {moduleId && <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-200">{moduleId}</Badge>}
            </div>
          </div>

          <div className="p-6">
            <Suspense fallback={<WorkspaceLoader />}>
              {renderWorkspace()}
            </Suspense>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}