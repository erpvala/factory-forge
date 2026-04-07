// @ts-nocheck
import React, { useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ControlPanelSidebar } from './ControlPanelSidebar';
import { ControlPanelHeader } from './ControlPanelHeader';

// Lazy load all module views
const BossDashboard = lazy(() => import('./modules/BossDashboard'));
const CEODashboard = lazy(() => import('./modules/CEODashboard'));
const ValaAI = lazy(() => import('./modules/ValaAI'));
const ServerManager = lazy(() => import('./modules/ServerManager'));
const AIAPIManager = lazy(() => import('./modules/AIAPIManager'));
const DevelopmentManager = lazy(() => import('./modules/DevelopmentManager'));
const ProductManager = lazy(() => import('./modules/ProductManager'));
const DemoManager = lazy(() => import('./modules/DemoManager'));
const TaskManager = lazy(() => import('./modules/TaskManager'));
const PromiseTracker = lazy(() => import('./modules/PromiseTracker'));
const AssetManager = lazy(() => import('./modules/AssetManager'));
const MarketingManager = lazy(() => import('./modules/MarketingManager'));
const SEOManager = lazy(() => import('./modules/SEOManager'));
const LeadManager = lazy(() => import('./modules/LeadManager'));
const SalesManager = lazy(() => import('./modules/SalesManager'));
const CustomerSupport = lazy(() => import('./modules/CustomerSupport'));
const FranchiseManager = lazy(() => import('./modules/FranchiseManager'));
const ResellerManager = lazy(() => import('./modules/ResellerManager'));
const InfluencerManager = lazy(() => import('./modules/InfluencerManager'));
const ContinentAdmin = lazy(() => import('./modules/ContinentAdmin'));
const CountryAdmin = lazy(() => import('./modules/CountryAdmin'));
const FinanceManager = lazy(() => import('./modules/FinanceManager'));
const LegalManager = lazy(() => import('./modules/LegalManager'));
const DeveloperDashboard = lazy(() => import('./modules/DeveloperDashboard'));
const ProManager = lazy(() => import('./modules/ProManager'));
const UserDashboard = lazy(() => import('./modules/UserDashboard'));
const SecurityManager = lazy(() => import('./modules/SecurityManager'));
const SystemSettings = lazy(() => import('./modules/SystemSettings'));
const MarketplaceManager = lazy(() => import('./modules/MarketplaceManager'));
const LicenseManager = lazy(() => import('./modules/LicenseManager'));
const DemoSystemManager = lazy(() => import('./modules/DemoSystemManager'));
const DeploymentManager = lazy(() => import('./modules/DeploymentManager'));
const AnalyticsManager = lazy(() => import('./modules/AnalyticsManager'));
const NotificationManager = lazy(() => import('./modules/NotificationManager'));
const IntegrationManager = lazy(() => import('./modules/IntegrationManager'));
const AuditLogsManager = lazy(() => import('./modules/AuditLogsManager'));
const HRManager = lazy(() => import('./modules/HRManager'));

export type ControlPanelModule = 
  | 'boss-dashboard' | 'ceo-dashboard' | 'vala-ai' | 'server-manager'
  | 'ai-api-manager' | 'development-manager' | 'product-manager' | 'demo-manager'
  | 'task-manager' | 'promise-tracker' | 'asset-manager' | 'marketing-manager'
  | 'seo-manager' | 'lead-manager' | 'sales-manager' | 'customer-support'
  | 'franchise-manager' | 'reseller-manager' | 'influencer-manager'
  | 'continent-admin' | 'country-admin' | 'finance-manager' | 'legal-manager'
  | 'developer-dashboard' | 'pro-manager' | 'user-dashboard' | 'security-manager'
  | 'system-settings' | 'marketplace-manager' | 'license-manager'
  | 'demo-system-manager' | 'deployment-manager' | 'analytics-manager'
  | 'notification-manager' | 'integration-manager' | 'audit-logs-manager' | 'hr-manager';

const MODULE_MAP: Record<ControlPanelModule, React.LazyExoticComponent<any>> = {
  'boss-dashboard': BossDashboard,
  'ceo-dashboard': CEODashboard,
  'vala-ai': ValaAI,
  'server-manager': ServerManager,
  'ai-api-manager': AIAPIManager,
  'development-manager': DevelopmentManager,
  'product-manager': ProductManager,
  'demo-manager': DemoManager,
  'task-manager': TaskManager,
  'promise-tracker': PromiseTracker,
  'asset-manager': AssetManager,
  'marketing-manager': MarketingManager,
  'seo-manager': SEOManager,
  'lead-manager': LeadManager,
  'sales-manager': SalesManager,
  'customer-support': CustomerSupport,
  'franchise-manager': FranchiseManager,
  'reseller-manager': ResellerManager,
  'influencer-manager': InfluencerManager,
  'continent-admin': ContinentAdmin,
  'country-admin': CountryAdmin,
  'finance-manager': FinanceManager,
  'legal-manager': LegalManager,
  'developer-dashboard': DeveloperDashboard,
  'pro-manager': ProManager,
  'user-dashboard': UserDashboard,
  'security-manager': SecurityManager,
  'system-settings': SystemSettings,
  'marketplace-manager': MarketplaceManager,
  'license-manager': LicenseManager,
  'demo-system-manager': DemoSystemManager,
  'deployment-manager': DeploymentManager,
  'analytics-manager': AnalyticsManager,
  'notification-manager': NotificationManager,
  'integration-manager': IntegrationManager,
  'audit-logs-manager': AuditLogsManager,
  'hr-manager': HRManager,
};

const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function ControlPanelPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = (searchParams.get('module') || 'boss-dashboard') as ControlPanelModule;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [streamingOn, setStreamingOn] = useState(true);

  const activeModule = MODULE_MAP[moduleParam] ? moduleParam : 'boss-dashboard';
  const ActiveComponent = MODULE_MAP[activeModule];

  const handleModuleChange = (mod: ControlPanelModule) => {
    setSearchParams({ module: mod });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC', color: '#1E293B' }}>
      <ControlPanelHeader
        streamingOn={streamingOn}
        onStreamingToggle={() => setStreamingOn(!streamingOn)}
      />
      <div className="flex flex-1" style={{ paddingTop: '64px' }}>
        <ControlPanelSidebar
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main
          className="flex-1 p-6 transition-all duration-300 overflow-auto"
          style={{ marginLeft: sidebarCollapsed ? '80px' : '260px' }}
        >
          <Suspense fallback={<ModuleLoader />}>
            <ActiveComponent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
