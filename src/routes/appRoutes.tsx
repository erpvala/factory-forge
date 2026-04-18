// @ts-nocheck
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AppShell from '@/components/app/AppShell';
import ModuleGuard from '@/components/app/ModuleGuard';
import AppIndex from '@/pages/app/AppIndex';
import AppAccessDenied from '@/pages/app/AppAccessDenied';
import { ROUTES } from '@/routes/routes';

// ─── Static imports (already in App.tsx bundle) ───────────────────────────────
import FinanceManager from '@/pages/FinanceManager';
import SecureLeadManagerDashboard from '@/pages/lead-manager/SecureLeadManagerDashboard';
import SalesSupportDashboard from '@/pages/SalesSupportDashboard';
import SupportDashboard from '@/pages/SupportDashboard';
import MarketplaceOffersPage from '@/pages/MarketplaceOffersPage';
import PerformanceManager from '@/pages/PerformanceManager';
import NotificationBuzzerConsole from '@/pages/NotificationBuzzerConsole';
import APIIntegrationDashboard from '@/pages/APIIntegrationDashboard';
import SystemAudit from '@/pages/super-admin/SystemAudit';
import ServerManagerDashboard from '@/pages/server-manager/ServerManagerDashboard';
import AIOptimizationConsole from '@/pages/ai-console/AIOptimizationConsole';
import SecureMarketingManagerDashboard from '@/pages/marketing-manager/SecureMarketingManagerDashboard';
import SecureSEOManagerDashboard from '@/pages/seo-manager/SecureSEOManagerDashboard';
import SecureLegalManagerDashboard from '@/pages/legal-manager/SecureLegalManagerDashboard';
import SecureTaskManagerDashboard from '@/pages/task-manager/SecureTaskManagerDashboard';
import FranchiseDashboardPage from '@/pages/franchise/Dashboard';
import FranchiseLayout from '@/components/layouts/FranchiseLayout';
import InfluencerDashboard from '@/pages/InfluencerDashboard';
import SecureDeveloperDashboard from '@/pages/developer/SecureDeveloperDashboard';

// ─── Additional role-specific dashboards ──────────────────────────────────────
import SecureHRManagerDashboard from '@/pages/hr-manager/SecureHRManagerDashboard';
import SecureAPIAIManagerDashboard from '@/pages/api-ai-manager/SecureAPIAIManagerDashboard';
import BillingDashboard from '@/pages/billing/BillingDashboard';
import SecureDevManagerDashboard from '@/pages/dev-manager/SecureDevManagerDashboard';
import SecureInfluencerManagerDashboard from '@/pages/influencer-manager/SecureInfluencerManagerDashboard';
import SecureFranchiseManagerDashboard from '@/pages/franchise-manager/SecureFranchiseManagerDashboard';
import AssistManagerDashboard from '@/pages/assist-manager/AssistManagerDashboard';
import DemoManagerDashboard from '@/pages/DemoManagerDashboard';
import ClientSuccessDashboard from '@/pages/ClientSuccessDashboard';

// ─── Franchise wrapper ────────────────────────────────────────────────────────
const FranchiseModule: React.FC = () => (
  <FranchiseLayout>
    <FranchiseDashboardPage />
  </FranchiseLayout>
);

// ─── Route tree ───────────────────────────────────────────────────────────────
/**
 * AppRoutes – all /app/* routes.
 *
 * Route structure:
 *   /app                    → AppIndex (smart redirect to best module)
 *   /app/access-denied      → AppAccessDenied
 *   /app/control-center/*   → UnifiedControlDashboard  (boss/admin)
 *   /app/finance/*          → FinanceManager            (finance_manager+)
 *   /app/leads/*            → SecureLeadManagerDashboard (lead_manager+)
 *   /app/sales/*            → SalesSupportDashboard     (support+)
 *   /app/support/*          → SupportDashboard          (support+)
 *   /app/marketplace/*      → MarketplaceOffersPage     (marketing_manager+)
 *   /app/licenses/*         → FinanceManager            (finance_manager+)
 *   /app/analytics/*        → PerformanceManager        (performance_manager+)
 *   /app/notifications/*    → NotificationBuzzerConsole (super_admin+)
 *   /app/integrations/*     → APIIntegrationDashboard   (api_security+)
 *   /app/audit/*            → SystemAudit               (super_admin+)
 *   /app/server/*           → ServerManagerDashboard    (server_manager+)
 *   /app/ai/*               → AIOptimizationConsole     (ai_manager+)
 *   /app/marketing/*        → SecureMarketingManagerDashboard (marketing_manager+)
 *   /app/seo/*              → SecureSEOManagerDashboard (seo_manager+)
 *   /app/legal/*            → SecureLegalManagerDashboard (legal_manager+)
 *   /app/tasks/*            → SecureTaskManagerDashboard (task_manager+)
 *   /app/franchise/*        → FranchiseDashboardPage    (franchise+)
 *   /app/reseller/*         → ResellerDashboard         (reseller+)
 *   /app/influencer/*       → InfluencerDashboard       (influencer+)
 *   /app/developer/*        → SecureDeveloperDashboard  (developer+)
 *   /app/user/*             → Redirect to /control-panel (user+)
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* /app → smart redirect */}
        <Route index element={<AppIndex />} />

        {/* /app/access-denied – no module guard needed */}
        <Route path="access-denied" element={<AppAccessDenied />} />

        {/* Control Center */}
        <Route
          path="control-center/*"
          element={
            <ModuleGuard moduleId="control-center">
              <Navigate to={ROUTES.bossPanel} replace />
            </ModuleGuard>
          }
        />

        {/* Finance – entity deep links: /app/finance/payments/:paymentId */}
        <Route
          path="finance/*"
          element={
            <ModuleGuard moduleId="finance">
              <FinanceManager />
            </ModuleGuard>
          }
        />

        {/* Leads – entity deep links: /app/leads/:leadId */}
        <Route
          path="leads/*"
          element={
            <ModuleGuard moduleId="leads">
              <SecureLeadManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Sales – entity deep links: /app/sales/orders/:orderId */}
        <Route
          path="sales/*"
          element={
            <ModuleGuard moduleId="sales">
              <SalesSupportDashboard />
            </ModuleGuard>
          }
        />

        {/* Support */}
        <Route
          path="support/*"
          element={
            <ModuleGuard moduleId="support">
              <SupportDashboard />
            </ModuleGuard>
          }
        />

        {/* Marketplace Admin */}
        <Route
          path="marketplace/*"
          element={
            <ModuleGuard moduleId="marketplace">
              <MarketplaceOffersPage />
            </ModuleGuard>
          }
        />

        {/* Licenses – entity deep links: /app/licenses/:licenseId
            Note: licenses are managed within FinanceManager (payment/subscription
            data lives in the same domain). A dedicated LicenseManager component
            can replace this mapping once one is built. */}
        <Route
          path="licenses/*"
          element={
            <ModuleGuard moduleId="licenses">
              <FinanceManager />
            </ModuleGuard>
          }
        />

        {/* Analytics */}
        <Route
          path="analytics/*"
          element={
            <ModuleGuard moduleId="analytics">
              <PerformanceManager />
            </ModuleGuard>
          }
        />

        {/* Notifications */}
        <Route
          path="notifications/*"
          element={
            <ModuleGuard moduleId="notifications">
              <NotificationBuzzerConsole />
            </ModuleGuard>
          }
        />

        {/* Integrations */}
        <Route
          path="integrations/*"
          element={
            <ModuleGuard moduleId="integrations">
              <APIIntegrationDashboard />
            </ModuleGuard>
          }
        />

        {/* Audit Logs */}
        <Route
          path="audit/*"
          element={
            <ModuleGuard moduleId="audit">
              <SystemAudit />
            </ModuleGuard>
          }
        />

        {/* Server Manager */}
        <Route
          path="server/*"
          element={
            <ModuleGuard moduleId="server">
              <ServerManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* AI Console */}
        <Route
          path="ai/*"
          element={
            <ModuleGuard moduleId="ai">
              <AIOptimizationConsole />
            </ModuleGuard>
          }
        />

        {/* Marketing */}
        <Route
          path="marketing/*"
          element={
            <ModuleGuard moduleId="marketing">
              <SecureMarketingManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* SEO */}
        <Route
          path="seo/*"
          element={
            <ModuleGuard moduleId="seo">
              <SecureSEOManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Legal */}
        <Route
          path="legal/*"
          element={
            <ModuleGuard moduleId="legal">
              <SecureLegalManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Tasks */}
        <Route
          path="tasks/*"
          element={
            <ModuleGuard moduleId="tasks">
              <SecureTaskManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Franchise */}
        <Route
          path="franchise/*"
          element={
            <ModuleGuard moduleId="franchise">
              <FranchiseModule />
            </ModuleGuard>
          }
        />

        {/* Reseller */}
        <Route
          path="reseller/*"
          element={
            <ModuleGuard moduleId="reseller">
              <Navigate to={ROUTES.resellerDashboard} replace />
            </ModuleGuard>
          }
        />

        {/* Influencer */}
        <Route
          path="influencer/*"
          element={
            <ModuleGuard moduleId="influencer">
              <InfluencerDashboard />
            </ModuleGuard>
          }
        />

        {/* Developer */}
        <Route
          path="developer/*"
          element={
            <ModuleGuard moduleId="developer">
              <SecureDeveloperDashboard />
            </ModuleGuard>
          }
        />

        {/* User route deprecated - force canonical control panel */}
        <Route
          path="user/*"
          element={
            <ModuleGuard moduleId="user">
              <Navigate to={ROUTES.controlPanelBase} replace />
            </ModuleGuard>
          }
        />

        {/* HR Manager */}
        <Route
          path="hr/*"
          element={
            <ModuleGuard moduleId="hr">
              <SecureHRManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* AI / API Manager */}
        <Route
          path="ai-api/*"
          element={
            <ModuleGuard moduleId="ai-api">
              <SecureAPIAIManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Billing */}
        <Route
          path="billing/*"
          element={
            <ModuleGuard moduleId="billing">
              <BillingDashboard />
            </ModuleGuard>
          }
        />

        {/* Dev Manager */}
        <Route
          path="dev-manager/*"
          element={
            <ModuleGuard moduleId="dev-manager">
              <SecureDevManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Influencer Manager */}
        <Route
          path="influencer-manager/*"
          element={
            <ModuleGuard moduleId="influencer-manager">
              <SecureInfluencerManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Reseller Manager */}
        <Route
          path="reseller-manager/*"
          element={
            <ModuleGuard moduleId="reseller-manager">
              <Navigate to="/reseller-manager/dashboard" replace />
            </ModuleGuard>
          }
        />

        {/* Franchise Manager */}
        <Route
          path="franchise-manager/*"
          element={
            <ModuleGuard moduleId="franchise-manager">
              <SecureFranchiseManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Assist Manager */}
        <Route
          path="assist/*"
          element={
            <ModuleGuard moduleId="assist">
              <AssistManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Demo Manager */}
        <Route
          path="demo-manager/*"
          element={
            <ModuleGuard moduleId="demo-manager">
              <DemoManagerDashboard />
            </ModuleGuard>
          }
        />

        {/* Client Success */}
        <Route
          path="client-success/*"
          element={
            <ModuleGuard moduleId="client-success">
              <ClientSuccessDashboard />
            </ModuleGuard>
          }
        />

        {/* Catch-all: redirect back to /app (smart index redirect) */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}
