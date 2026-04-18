// @ts-nocheck
// Software Vala - Enterprise Management Platform
import React, { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminQuickAccess from "@/components/admin/AdminQuickAccess";
import { AnimationProvider } from "@/contexts/AnimationContext";
import Auth from "@/pages/Auth";
import { AuthProvider } from "@/hooks/useAuth";
import BlockingClassCleanup from "@/components/shared/BlockingClassCleanup";
import ButtonAuditOverlay from "@/components/shared/ButtonAuditOverlay";
import { DemoTestModeProvider } from "@/contexts/DemoTestModeContext";
import FloatingAIChatbotWrapper from "@/components/shared/FloatingAIChatbotWrapper";
import GlobalOfferPopup from "@/components/offers/GlobalOfferPopup";
import GlobalRealtimeProvider from "@/providers/GlobalRealtimeProvider";
import Index from "@/pages/Index";
import InteractivityGuard from "@/components/shared/InteractivityGuard";
import FranchiseLayout from "@/components/layouts/FranchiseLayout";
import { MarketplaceErrorBoundary } from "@/components/marketplace/MarketplaceErrorBoundary";
import AppErrorBoundary from "@/components/error/AppErrorBoundary";
import NotFound from "@/pages/NotFound";
import { NotificationProvider } from "@/contexts/NotificationContext";
import QuickSupport from "@/components/support/QuickSupport";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireRole from "@/components/auth/RequireRole";
import { SecurityProvider } from "@/contexts/SecurityContext";
import SourceCodeProtection from "@/components/security/SourceCodeProtection";
import LegacyRouteMonitor from "@/components/security/LegacyRouteMonitor";
import LegacyRuntimeGuard from "@/components/security/LegacyRuntimeGuard";
import SystemNotificationsInitializer from "@/components/notifications/SystemNotificationsInitializer";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AppRoutes } from "@/routes/appRoutes";
import { ROUTES } from "@/routes/routes";
import RouteRuntimeEnhancer from "@/components/routing/RouteRuntimeEnhancer";
import LegacyProductRedirect from "@/components/routing/LegacyProductRedirect";
import RoleDashboardShell from "@/components/layout/RoleDashboardShell";
import { resolveControlPanelPath } from "@/config/controlPanelModules";
import { startControlPanelHeartbeat } from "@/services/controlPanelHeartbeat";

// ─── Lazy-loaded pages (code-split) ──────────────────────────────────────────
// Auth & minimal pages (fast path — still split to keep initial bundle tiny)
const AccessDenied       = lazy(() => import("@/pages/auth/AccessDenied"));
const AccountSuspension  = lazy(() => import("@/pages/auth/AccountSuspension"));
const ChangePassword     = lazy(() => import("@/pages/auth/ChangePassword"));
const DeviceVerify       = lazy(() => import("@/pages/auth/DeviceVerify"));
const ForgotPassword     = lazy(() => import("@/pages/auth/ForgotPassword"));
const IPVerify           = lazy(() => import("@/pages/auth/IPVerify"));
const Logout             = lazy(() => import("@/pages/auth/Logout"));
const OTPVerify          = lazy(() => import("@/pages/auth/OTPVerify"));
const PendingApproval    = lazy(() => import("@/pages/auth/PendingApproval"));
const ResetPassword      = lazy(() => import("@/pages/auth/ResetPassword"));
const ApplyPage          = lazy(() => import("@/pages/apply/ApplyPage"));
const BossApplications   = lazy(() => import("@/pages/apply/BossApplications"));
const SessionExpiredPage = lazy(() => import("@/pages/error/SessionExpiredPage"));
const InternalServerErrorPage = lazy(() => import("@/pages/error/InternalServerErrorPage"));

// Public / marketing pages
const Homepage            = lazy(() => import("@/pages/Homepage"));
const PublicDemos         = lazy(() => import("@/pages/demos/PublicDemos"));
const PremiumDemoShowcase = lazy(() => import("@/pages/PremiumDemoShowcase"));
const PremiumDemoShowcaseNew = lazy(() => import("@/pages/PremiumDemoShowcaseNew"));
const SectorsBrowse       = lazy(() => import("@/pages/SectorsBrowse"));
const SubCategoryDemos    = lazy(() => import("@/pages/SubCategoryDemos"));
const CareerPortal        = lazy(() => import("@/pages/CareerPortal"));
const ClientPortal        = lazy(() => import("@/pages/ClientPortal"));
const CategoryOnboarding  = lazy(() => import("@/pages/CategoryOnboarding"));
const DashboardNotificationsPage = lazy(() => import("@/pages/DashboardNotificationsPage"));
const DemoDirectory       = lazy(() => import("@/pages/DemoDirectory"));
const DemoLogin           = lazy(() => import("@/pages/DemoLogin"));
const DemoCredentials     = lazy(() => import("@/pages/DemoCredentials"));
const SimpleDemoList      = lazy(() => import("@/pages/SimpleDemoList"));
const SimpleDemoView      = lazy(() => import("@/pages/SimpleDemoView"));
const SimpleCheckout      = lazy(() => import("@/pages/SimpleCheckout"));
const OrderSuccess        = lazy(() => import("@/pages/OrderSuccess"));
const PaymentSuccess      = lazy(() => import("@/pages/PaymentSuccess"));
const ResellerAppRouter   = lazy(() => import("@/app/reseller/router"));
const ResellerLanding     = lazy(() => import("@/pages/ResellerLanding"));
const FranchiseLanding    = lazy(() => import("@/pages/FranchiseLanding"));
const SettingsPage        = lazy(() => import("@/pages/Settings"));
const PrivacyPage         = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage           = lazy(() => import("@/pages/TermsPage"));
const BulkActionsReference = lazy(() => import("@/pages/admin/BulkActionsReference"));
const LeaderSecurityAssessment = lazy(() => import("@/pages/leader-security/LeaderSecurityAssessment"));

// Marketplace pages
const MarketplacePage        = lazy(() => import("@/pages/MarketplacePage"));
const MarketplaceOffersPage  = lazy(() => import("@/pages/MarketplaceOffersPage"));
const MarketplaceProductPage = lazy(() => import("@/pages/MarketplaceProductPage"));
const MarketplaceCartPage    = lazy(() => import("@/pages/MarketplaceCartPage"));
const MarketplaceCheckoutPage = lazy(() => import("@/pages/MarketplaceCheckoutPage"));
const MarketplaceManagerDashboard = lazy(() => import("@/pages/MarketplaceManagerDashboard"));

// Boss / Admin dashboards — Control Panel is the single source of truth
const ControlPanelPage      = lazy(() => import("@/pages/control-panel/ControlPanelPage"));
const ControlPanelDashboard = lazy(() => import("@/pages/control-panel/ControlPanelDashboard"));
const HooksControlPanel = lazy(() => import("@/pages/control-panel/HooksControlPanel"));
const BossPanel             = lazy(() => import("@/pages/BossPanel"));
const BootstrapAdmins       = lazy(() => import("@/pages/admin/BootstrapAdmins"));
const SecurityCommandCenter = lazy(() => import("@/pages/security-command/SecurityCommandCenter"));
const CentralIntegrationHub = lazy(() => import("@/pages/api-manager/CentralIntegrationHub"));
const ServerManagementPortal = lazy(() => import("@/pages/server/ServerManagementPortal"));
const ServerManagerDashboard = lazy(() => import("@/pages/server-manager/ServerManagerDashboard"));
const EnterpriseControlHub  = lazy(() => import("@/pages/enterprise-control/EnterpriseControlHub"));
const SystemFlowPage        = lazy(() => import("@/pages/SystemFlowPage"));
const SystemSettings        = lazy(() => import("@/pages/SystemSettings"));
const ContinentAdminDashboard = lazy(() => import("@/pages/continent-super-admin/ContinentSuperAdminDashboard"));
const CountryAdminDashboard = lazy(() => import("@/components/country-dashboard/CountryAdminStripeAtlas"));

// AI CEO
const AICEODashboard        = lazy(() => import("@/pages/ai-ceo/AICEODashboard"));
const AICEODashboardMain    = lazy(() => import("@/pages/ai-ceo/sections/AICEODashboardMain"));
const AICEOLiveMonitor      = lazy(() => import("@/pages/ai-ceo/sections/AICEOLiveMonitor"));
const AICEODecisionEngine   = lazy(() => import("@/pages/ai-ceo/sections/AICEODecisionEngine"));
const AICEOApprovals        = lazy(() => import("@/pages/ai-ceo/sections/AICEOApprovals"));
const AICEORiskCompliance   = lazy(() => import("@/pages/ai-ceo/sections/AICEORiskCompliance"));
const AICEOPerformance      = lazy(() => import("@/pages/ai-ceo/sections/AICEOPerformance"));
const AICEOPredictions      = lazy(() => import("@/pages/ai-ceo/sections/AICEOPredictions"));
const AICEOReports          = lazy(() => import("@/pages/ai-ceo/sections/AICEOReports"));
const AICEOLearning         = lazy(() => import("@/pages/ai-ceo/sections/AICEOLearning"));
const AICEOSettings         = lazy(() => import("@/pages/ai-ceo/sections/AICEOSettings"));


// Manager dashboards
const FinanceManager         = lazy(() => import("@/pages/FinanceManager"));
const MarketingManager       = lazy(() => import("@/pages/MarketingManager"));
const MarketingManagerDashboard = lazy(() => import("@/pages/marketing-manager/MarketingManagerDashboard"));
const SEODashboard           = lazy(() => import("@/pages/SEODashboard"));
const LegalComplianceManager = lazy(() => import("@/pages/LegalComplianceManager"));
const SecureLegalManagerDashboard = lazy(() => import("@/pages/legal-manager/SecureLegalManagerDashboard"));
const SecureLeadManagerDashboard = lazy(() => import("@/pages/lead-manager/SecureLeadManagerDashboard"));
const SecureSEOManagerDashboard = lazy(() => import("@/pages/seo-manager/SecureSEOManagerDashboard"));
const SecureTaskManagerDashboard = lazy(() => import("@/pages/task-manager/SecureTaskManagerDashboard"));
const SecureSalesSupportManagerDashboard = lazy(() => import("@/pages/sales-support-manager/SecureSalesSupportManagerDashboard"));
const SecureResellerManagerDashboard = lazy(() => import("@/pages/reseller-manager/SecureResellerManagerDashboard"));
const SecureInfluencerManagerDashboard = lazy(() => import("@/pages/influencer-manager/SecureInfluencerManagerDashboard"));
const SecureDevManagerDashboard = lazy(() => import("@/pages/dev-manager/SecureDevManagerDashboard"));
const SecureHRManagerDashboard = lazy(() => import("@/pages/hr-manager/SecureHRManagerDashboard"));
const AIOptimizationConsole  = lazy(() => import("@/pages/ai-console/AIOptimizationConsole"));
const APIIntegrationDashboard = lazy(() => import("@/pages/APIIntegrationDashboard"));
const AIBillingDashboard     = lazy(() => import("@/components/ai-billing/AIBillingDashboard"));
const NotificationBuzzerConsole = lazy(() => import("@/pages/NotificationBuzzerConsole"));
const PerformanceManager     = lazy(() => import("@/pages/PerformanceManager"));
const IncidentCrisisDashboard = lazy(() => import("@/pages/IncidentCrisisDashboard"));
const RnDDashboard           = lazy(() => import("@/pages/RnDDashboard"));
const HRDashboard            = lazy(() => import("@/components/hr/HRDashboard"));
const ClientSuccessDashboard = lazy(() => import("@/pages/ClientSuccessDashboard"));
const InternalChat           = lazy(() => import("@/pages/InternalChat"));
const PersonalChat           = lazy(() => import("@/pages/PersonalChat"));
const DemoManagerDashboard   = lazy(() => import("@/pages/DemoManagerDashboard"));
const ProductDemoManager     = lazy(() => import("@/pages/ProductDemoManager"));
const ProductDemoManagerPage = lazy(() => import("@/pages/product-demo-manager/index"));
const SalesSupportDashboard  = lazy(() => import("@/pages/SalesSupportDashboard"));
const AssistManagerDashboard = lazy(() => import("@/pages/assist-manager/AssistManagerDashboard"));
const SecureDeveloperDashboard = lazy(() => import("@/pages/developer/SecureDeveloperDashboard"));
const SecureFranchiseManagerDashboard = lazy(() => import("@/pages/franchise-manager/SecureFranchiseManagerDashboard"));
const SafeAssistDashboard    = lazy(() => import("@/pages/safe-assist/SafeAssistDashboard"));
const PromiseTrackerDashboard = lazy(() => import("@/pages/promise-tracker/PromiseTrackerDashboard"));
const PromiseManagementDashboard = lazy(() => import("@/pages/promise-management/PromiseManagementDashboard"));
const SupportDashboardPage   = lazy(() => import("@/components/internal-support-ai/sections/SupportDashboard").then(m => ({ default: m.SupportDashboard })));

// Role-specific dashboards
const DevCommandCenter       = lazy(() => import("@/pages/DevCommandCenter"));
const DeveloperRegistration  = lazy(() => import("@/pages/developer/DeveloperRegistration"));
const InfluencerDashboard    = lazy(() => import("@/pages/InfluencerDashboard"));
const InfluencerCommandCenter = lazy(() => import("@/pages/InfluencerCommandCenter"));
const InfluencerManager      = lazy(() => import("@/pages/InfluencerManager"));
const ResellerDashboard      = lazy(() => import("@/pages/ResellerDashboard"));
const ResellerPortal         = lazy(() => import("@/pages/ResellerPortal"));
const PrimeUserDashboard     = lazy(() => import("@/components/prime-user/PrimeUserDashboard"));

// Reseller Manager sub-pages
const ResellerManagerLayout        = lazy(() => import("@/app/reseller-manager/layout").then(m => ({ default: m.default })));
const ResellerManagerDashboardPage = lazy(() => import("@/app/reseller-manager/dashboard/page"));
const ResellerManagerResellersPage = lazy(() => import("@/app/reseller-manager/resellers/page"));
const ResellerManagerOnboardingPage = lazy(() => import("@/app/reseller-manager/onboarding/page"));
const ResellerManagerProductsPage  = lazy(() => import("@/app/reseller-manager/products/page"));
const ResellerManagerLicensesPage  = lazy(() => import("@/app/reseller-manager/licenses/page"));
const ResellerManagerSalesPage     = lazy(() => import("@/app/reseller-manager/sales/page"));
const ResellerManagerCommissionPage = lazy(() => import("@/app/reseller-manager/commission/page"));
const ResellerManagerPayoutPage    = lazy(() => import("@/app/reseller-manager/payout/page"));
const ResellerManagerInvoicesPage  = lazy(() => import("@/app/reseller-manager/invoices/page"));
const ResellerManagerSettingsPage  = lazy(() => import("@/app/reseller-manager/settings/page"));

// Franchise sub-pages
const FranchiseDashboardPage    = lazy(() => import("@/pages/franchise/Dashboard"));
const FranchiseProfile          = lazy(() => import("@/pages/franchise/Profile"));
const FranchiseWalletPage       = lazy(() => import("@/pages/franchise/Wallet"));
const FranchiseLeadBoardPage    = lazy(() => import("@/pages/franchise/LeadBoard"));
const FranchiseAssignLead       = lazy(() => import("@/pages/franchise/AssignLead"));
const FranchiseDemoRequest      = lazy(() => import("@/pages/franchise/DemoRequest"));
const FranchiseDemoLibraryPage  = lazy(() => import("@/pages/franchise/DemoLibrary"));
const FranchiseSalesCenter      = lazy(() => import("@/pages/franchise/SalesCenter"));
const FranchisePerformancePage  = lazy(() => import("@/pages/franchise/Performance"));
const FranchiseSupportTicket    = lazy(() => import("@/pages/franchise/SupportTicket"));
const FranchiseInternalChatPage = lazy(() => import("@/pages/franchise/InternalChat"));
const FranchiseTrainingCenter   = lazy(() => import("@/pages/franchise/TrainingCenter"));
const FranchiseSecurityPanel    = lazy(() => import("@/pages/franchise/SecurityPanel"));
const FranchiseSEOServices      = lazy(() => import("@/pages/franchise/SEOServices"));
const FranchiseTeamManagement   = lazy(() => import("@/pages/franchise/TeamManagement"));
const FranchiseCRM              = lazy(() => import("@/pages/franchise/CRM"));
const FranchiseHRM              = lazy(() => import("@/pages/franchise/HRM"));
const FranchiseLeadActivity     = lazy(() => import("@/pages/franchise/LeadActivity"));

// Vala workspace
const ValaAIFactoryPage    = lazy(() => import("@/pages/vala-ai/ValaAIFactoryPage"));
const ValaControlCenter    = lazy(() => import("@/pages/vala-control/ValaControlCenter"));
const ValaControlHub       = lazy(() => import("@/pages/vala-control/ValaControlHub"));
const ValaMasterWorkspace  = lazy(() => import("@/pages/vala-control/ValaMasterWorkspace"));
const ValaOperationWorkspace = lazy(() => import("@/pages/vala-control/ValaOperationWorkspace"));
const ValaRegionalWorkspace = lazy(() => import("@/pages/vala-control/ValaRegionalWorkspace"));
const ValaAIHeadWorkspace  = lazy(() => import("@/pages/vala-control/ValaAIHeadWorkspace"));

// Demo suite (large bundle — fully split)
const RestaurantPOSDemo   = lazy(() => import("@/pages/demos/RestaurantPOSDemo"));
const RestaurantSmallDemo = lazy(() => import("@/pages/demos/restaurant/RestaurantSmallDemo"));
const RestaurantMediumDemo = lazy(() => import("@/pages/demos/restaurant/RestaurantMediumDemo"));
const RestaurantLargeDemo = lazy(() => import("@/pages/demos/restaurant/RestaurantLargeDemo"));
const SchoolERPDemo       = lazy(() => import("@/pages/demos/SchoolERPDemo"));
const SchoolSmallDemo     = lazy(() => import("@/pages/demos/school/SchoolSmallDemo"));
const SchoolMediumDemo    = lazy(() => import("@/pages/demos/school/SchoolMediumDemo"));
const SchoolLargeDemo     = lazy(() => import("@/pages/demos/school/SchoolLargeDemo"));
const EducationDemoHub    = lazy(() => import("@/pages/demos/education/EducationDemoHub"));
const SchoolSoftwareHomepage = lazy(() => import("@/pages/school-software/SchoolSoftwareHomepage"));
const SchoolSoftwareDashboard = lazy(() => import("@/pages/school-software/SchoolSoftwareDashboard"));
const HospitalHMSDemo     = lazy(() => import("@/pages/demos/HospitalHMSDemo"));
const EcommerceStoreDemo  = lazy(() => import("@/pages/demos/EcommerceStoreDemo"));
const HotelBookingDemo    = lazy(() => import("@/pages/demos/HotelBookingDemo"));
const RealEstateDemo      = lazy(() => import("@/pages/demos/RealEstateDemo"));
const AutomotiveDemo      = lazy(() => import("@/pages/demos/AutomotiveDemo"));
const TravelDemo          = lazy(() => import("@/pages/demos/TravelDemo"));
const FinanceDemo         = lazy(() => import("@/pages/demos/FinanceDemo"));
const ManufacturingDemo   = lazy(() => import("@/pages/demos/ManufacturingDemo"));
const GymDemo             = lazy(() => import("@/pages/demos/GymDemo"));
const SalonDemo           = lazy(() => import("@/pages/demos/SalonDemo"));
const LegalDemo           = lazy(() => import("@/pages/demos/LegalDemo"));
const SecurityDemo        = lazy(() => import("@/pages/demos/SecurityDemo"));
const TelecomDemo         = lazy(() => import("@/pages/demos/TelecomDemo"));
const ChildcareDemo       = lazy(() => import("@/pages/demos/ChildcareDemo"));
const PetCareDemo         = lazy(() => import("@/pages/demos/PetCareDemo"));
const EventDemo           = lazy(() => import("@/pages/demos/EventDemo"));
const CRMDemo             = lazy(() => import("@/pages/demos/CRMDemo"));
const LogisticsDemo       = lazy(() => import("@/pages/demos/LogisticsDemo"));
const SalesCRMDemo        = lazy(() => import("@/pages/sales-crm/SalesCRMDemo"));
const RetailPOSDemo       = lazy(() => import("@/pages/retail-pos/RetailPOSDemo"));

// Misc pages
const AutoDevEngine         = lazy(() => import("@/pages/auto-dev/AutoDevEngine"));
const DemoOrderSystem       = lazy(() => import("@/pages/demo-system/DemoOrderSystem"));

// ─── Page-load spinner ───────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);
const Page404 = lazy(() => import("@/pages/Page404"));

const RoutePrefetch = () => {
  useEffect(() => {
    const connection = (navigator as any)?.connection;
    const saveData = Boolean(connection?.saveData);
    const effectiveType = String(connection?.effectiveType || '4g').toLowerCase();
    const isSlowNetwork = ['slow-2g', '2g', '3g'].includes(effectiveType);
    const onPublicEntry = window.location.pathname === '/' || window.location.pathname.startsWith('/marketplace');

    if (saveData || isSlowNetwork || !onPublicEntry) {
      return;
    }

    const warmup = () => {
      void Promise.allSettled([
        import("@/pages/MarketplacePage"),
        import("@/pages/ClientSuccessDashboard"),
      ]);
    };

    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
    const handle = idle ? idle(warmup) : window.setTimeout(warmup, 900);

    return () => {
      if (idle && typeof (window as any).cancelIdleCallback === "function") {
        (window as any).cancelIdleCallback(handle);
        return;
      }
      window.clearTimeout(handle as number);
    };
  }, []);

  return null;
};

const queryClient = new QueryClient();

const DeveloperDashboardShell = () => (
  <RoleDashboardShell
    title="Developer Dashboard"
    subtitle="Build, monitor, and ship faster"
    links={[
      { label: 'Overview', to: ROUTES.developerDashboard },
      { label: 'Secure View', to: '/developer/secure-dashboard' },
    ]}
  >
    <DevCommandCenter />
  </RoleDashboardShell>
);

const InfluencerDashboardShell = () => (
  <RoleDashboardShell
    title="Influencer Dashboard"
    subtitle="Track campaigns and referral performance"
    links={[
      { label: 'Overview', to: ROUTES.influencerDashboard },
      { label: 'Command Center', to: '/influencer/command-center' },
    ]}
  >
    <InfluencerDashboard />
  </RoleDashboardShell>
);

const ControlPanelModuleRedirect = ({ moduleId }: { moduleId: string }) => {
  const params = useParams();
  return <Navigate to={resolveControlPanelPath(moduleId, params['*'])} replace />;
};

const controlPanelWildcardPath = (moduleId: string) => `${resolveControlPanelPath(moduleId)}/*`;

const CONTROL_PANEL_ROLE_ROUTES: Array<{ moduleId: string; allowed: string[]; element: React.ReactNode }> = [
  { moduleId: 'server-manager', allowed: ['boss_owner', 'server_manager'], element: <ServerManagerDashboard /> },
  { moduleId: 'ai-api-manager', allowed: ['boss_owner', 'api_ai_manager'], element: <CentralIntegrationHub /> },
  { moduleId: 'product-manager', allowed: ['product_manager', 'demo_manager', 'super_admin'], element: <ProductDemoManagerPage /> },
  { moduleId: 'demo-manager', allowed: ['demo_manager', 'super_admin', 'boss_owner'], element: <DemoManagerDashboard /> },
  { moduleId: 'task-manager', allowed: ['task_manager', 'super_admin'], element: <SecureTaskManagerDashboard /> },
  { moduleId: 'promise-tracker', allowed: ['analytics_manager', 'super_admin', 'boss_owner'], element: <PromiseTrackerDashboard /> },
  { moduleId: 'assist-manager', allowed: ['sales_support', 'super_admin', 'boss_owner'], element: <AssistManagerDashboard /> },
  { moduleId: 'asset-manager', allowed: ['boss_owner', 'super_admin'], element: <ControlPanelDashboard /> },
  { moduleId: 'marketing-manager', allowed: ['boss_owner', 'marketing_manager'], element: <MarketingManagerDashboard /> },
  { moduleId: 'seo-manager', allowed: ['boss_owner', 'seo_manager'], element: <SecureSEOManagerDashboard /> },
  { moduleId: 'lead-manager', allowed: ['lead_manager', 'super_admin', 'boss_owner', 'ceo'], element: <SecureLeadManagerDashboard /> },
  { moduleId: 'sales-manager', allowed: ['sales_support', 'super_admin'], element: <SalesSupportDashboard /> },
  { moduleId: 'customer-support', allowed: ['sales_support', 'super_admin'], element: <SupportDashboardPage /> },
  { moduleId: 'franchise-manager', allowed: ['franchise_manager', 'boss_owner', 'super_admin'], element: <SecureFranchiseManagerDashboard /> },
  { moduleId: 'reseller-dashboard', allowed: ['reseller', 'super_admin'], element: <ResellerDashboard /> },
  { moduleId: 'franchise-dashboard', allowed: ['franchise', 'franchise_owner', 'super_admin'], element: <FranchiseDashboardPage /> },
  { moduleId: 'influencer-dashboard', allowed: ['influencer', 'super_admin'], element: <InfluencerDashboard /> },
  { moduleId: 'influencer-manager', allowed: ['boss_owner', 'super_admin'], element: <SecureInfluencerManagerDashboard /> },
  { moduleId: 'continent-admin', allowed: ['continent_admin', 'boss_owner', 'super_admin', 'ceo'], element: <ContinentAdminDashboard /> },
  { moduleId: 'country-admin', allowed: ['country_admin', 'area_manager', 'boss_owner', 'super_admin'], element: <CountryAdminDashboard /> },
  { moduleId: 'finance-manager', allowed: ['finance_manager', 'super_admin'], element: <FinanceManager /> },
  { moduleId: 'legal-manager', allowed: ['boss_owner', 'legal_manager'], element: <SecureLegalManagerDashboard /> },
  { moduleId: 'developer-dashboard', allowed: ['developer', 'super_admin'], element: <DeveloperDashboardShell /> },
  { moduleId: 'pro-manager', allowed: ['prime_user', 'super_admin'], element: <PrimeUserDashboard /> },
  { moduleId: 'security-manager', allowed: ['boss_owner'], element: <SecurityCommandCenter /> },
  { moduleId: 'system-settings', allowed: ['super_admin'], element: <SystemSettings /> },
  { moduleId: 'license-manager', allowed: ['finance_manager', 'super_admin', 'boss_owner'], element: <FinanceManager /> },
  { moduleId: 'demo-system-manager', allowed: ['boss_owner', 'super_admin', 'demo_manager'], element: <DemoOrderSystem /> },
  { moduleId: 'deployment-manager', allowed: ['boss_owner', 'server_manager'], element: <ServerManagerDashboard /> },
  { moduleId: 'analytics-manager', allowed: ['analytics_manager', 'super_admin'], element: <PerformanceManager /> },
  { moduleId: 'notification-manager', allowed: ['super_admin'], element: <NotificationBuzzerConsole /> },
  { moduleId: 'integration-manager', allowed: ['super_admin'], element: <APIIntegrationDashboard /> },
  { moduleId: 'audit-logs-manager', allowed: ['boss_owner', 'super_admin'], element: <SystemAudit /> },
  { moduleId: 'health', allowed: ['boss_owner', 'ceo', 'super_admin'], element: <SystemFlowPage /> },
];

const CONTROL_PANEL_AUTH_ROUTES: Array<{ moduleId: string; element: React.ReactNode }> = [
  { moduleId: 'vala-ai', element: <ValaAIFactoryPage /> },
  { moduleId: 'development-manager', element: <SecureDevManagerDashboard /> },
];

const CONTROL_PANEL_LOGIN_REDIRECT = ROUTES.login;

const HARD_ALLOWED_PREFIXES = [ROUTES.login, ROUTES.controlPanelBase, '/admin', '/super-admin', '/dashboard'];
const HARD_BLOCKED_PREFIXES = ['/user', '/old', '/boss', '/franchise', '/influencer'];

const SystemRoutingTakeover = () => {
  const location = useLocation();

  useEffect(() => {
    const normalized = location.pathname.toLowerCase();
    if (normalized === '/admin' || normalized.startsWith('/admin/') || normalized === '/super-admin' || normalized.startsWith('/super-admin/') || normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
      window.location.replace(ROUTES.controlPanelBase);
      return;
    }
    const isBlocked = HARD_BLOCKED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
    const isAllowed = HARD_ALLOWED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));

    if (isBlocked || !isAllowed) {
      window.location.replace(ROUTES.login);
    }
  }, [location.pathname]);

  return null;
};

const ControlPanelHeartbeatRuntime = () => {
  const location = useLocation();

  useEffect(() => {
    const stop = startControlPanelHeartbeat(location.pathname);
    return () => {
      stop();
    };
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoTestModeProvider>
        <AnimationProvider>
          <TooltipProvider>
              {/* Disabled to prevent global interaction blocking (login/buttons must always work) */}
              <SourceCodeProtection enabled={false}>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <SystemRoutingTakeover />
                  <ControlPanelHeartbeatRuntime />
                  <RouteRuntimeEnhancer />
                  <LegacyRouteMonitor />
                  <SecurityProvider>
                    <NotificationProvider>
                      <TranslationProvider>
                        <GlobalRealtimeProvider>
                          <LegacyRuntimeGuard />
                          <InteractivityGuard />
                          <BlockingClassCleanup />
                          <SystemNotificationsInitializer />
                          <GlobalOfferPopup />
                          <FloatingAIChatbotWrapper />
                          <RoutePrefetch />
                          <AppErrorBoundary label="Application">
                          <Suspense fallback={<PageLoader />}>
                          <Routes>
                          {/* Public Routes - No login required */}
              <Route path="/" element={<Index />} />
              <Route path="/demos" element={<Index />} />
              <Route path="/explore" element={<Navigate to="/demos" replace />} />
              <Route path="/products" element={<Index />} />
              <Route path="/pricing" element={<SimpleDemoList />} />
              <Route path="/demos/public" element={<PublicDemos />} />
              <Route path="/showcase" element={<PremiumDemoShowcaseNew />} />
              <Route path="/server-portal" element={<RequireAuth><ServerManagementPortal /></RequireAuth>} />
              <Route path={ROUTES.auth} element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/dashboard" element={<Navigate to={ROUTES.controlPanelBase} replace />} />
              <Route path="/dashboard/notifications" element={<RequireAuth><DashboardNotificationsPage /></RequireAuth>} />
              {/* Basic profile route to satisfy header navigation */}
              <Route path="/profile" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="/dashboard/pending" element={<Navigate to={ROUTES.login} replace />} />
              {/* Legacy alias: /pending-approval → /login */}
              <Route path={ROUTES.pendingApprovalLegacy} element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
              <Route path="/onboard" element={<Homepage />} />
              <Route path="/onboard/:category" element={<CategoryOnboarding />} />
              {/* ── Apply System ── */}
              <Route path={`${ROUTES.applyBase}/:role`} element={<ApplyPage />} />
              <Route path={ROUTES.applyBase} element={<Navigate to={ROUTES.applyDeveloper} replace />} />
              <Route path="/careers" element={<CareerPortal />} />
              <Route path="/join-developer" element={<Navigate to={ROUTES.applyDeveloper} replace />} />
              <Route path="/join-influencer" element={<Navigate to={ROUTES.applyInfluencer} replace />} />
              <Route path="/jobs" element={<Navigate to={ROUTES.applyJob} replace />} />
              {/* Boss Applications panel - hard redirect to login */}
              <Route path="/boss/applications" element={<Navigate to={ROUTES.login} replace />} />
              {/* Bootstrap is Master-only after initial setup */}
              <Route path="/bootstrap-admins" element={<RequireRole allowed={["boss_owner"]} masterOnly><BootstrapAdmins /></RequireRole>} />
              <Route path="/sectors" element={<SectorsBrowse />} />
              <Route path="/sectors/:sectorId/:subCategoryId" element={<SubCategoryDemos />} />

              {/* Auto Development Engine */}
              <Route path="/auto-dev" element={<AutoDevEngine />} />

              {/* Product Demo Pages - MUST come BEFORE dynamic routes */}
<Route path="/demo/restaurant-pos" element={<RestaurantPOSDemo />} />
              <Route path="/demo/restaurant-small" element={<RestaurantSmallDemo />} />
              <Route path="/demo/restaurant-medium" element={<RestaurantMediumDemo />} />
              <Route path="/demo/restaurant-large" element={<RestaurantLargeDemo />} />
              <Route path="/demo/school-erp" element={<SchoolERPDemo />} />
              <Route path="/demo/school-small" element={<SchoolSmallDemo />} />
              <Route path="/demo/school-medium" element={<SchoolMediumDemo />} />
              <Route path="/demo/school-large" element={<SchoolLargeDemo />} />
              <Route path="/demo/education" element={<EducationDemoHub />} />
              <Route path="/demos/education" element={<EducationDemoHub />} />

              {/* School Management Software - LIVE SYSTEM (NOT DEMO) */}
              <Route path="/school-software" element={<SchoolSoftwareHomepage />} />
              <Route path="/school-software/dashboard" element={<SchoolSoftwareDashboard />} />
              <Route path="/demo/hospital-hms" element={<HospitalHMSDemo />} />
              <Route path="/demo/ecommerce-store" element={<EcommerceStoreDemo />} />
              <Route path="/demo/hotel-booking" element={<HotelBookingDemo />} />
              <Route path="/demo/real-estate" element={<RealEstateDemo />} />
              <Route path="/demo/automotive" element={<AutomotiveDemo />} />
              <Route path="/demo/travel" element={<TravelDemo />} />
              <Route path="/demo/finance" element={<FinanceDemo />} />
              <Route path="/demo/manufacturing" element={<ManufacturingDemo />} />
              <Route path="/demo/gym" element={<GymDemo />} />
              <Route path="/demo/salon" element={<SalonDemo />} />
              <Route path="/demo/legal" element={<LegalDemo />} />
              <Route path="/demo/security" element={<SecurityDemo />} />
              <Route path="/demo/telecom" element={<TelecomDemo />} />
              <Route path="/demo/childcare" element={<ChildcareDemo />} />
              <Route path="/demo/petcare" element={<PetCareDemo />} />
              <Route path="/demo/event" element={<EventDemo />} />
              <Route path="/demo/crm" element={<CRMDemo />} />
              <Route path="/demo/logistics" element={<LogisticsDemo />} />

              {/* Sales CRM Demo */}
              <Route path="/sales-crm" element={<SalesCRMDemo />} />
              <Route path="/sales-crm/auth" element={<Navigate to="/login" replace />} />
              <Route path="/retail-pos" element={<RetailPOSDemo />} />
              {/* Dynamic Demo Routes - MUST come AFTER specific routes */}
              <Route path="/demo-directory" element={<DemoDirectory />} />
              <Route path="/demo/:demoId" element={<SimpleDemoView />} />
              <Route path="/checkout/:demoId" element={<SimpleCheckout />} />
              <Route path="/demo-login" element={<DemoLogin />} />
              <Route path="/premium-demos" element={<PremiumDemoShowcase />} />

              {/* Client Portal - Public Route */}
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/get-started" element={<ClientPortal />} />
              <Route path="/contact" element={<Navigate to="/client-portal" replace />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/marketplace" element={<MarketplaceErrorBoundary><MarketplacePage /></MarketplaceErrorBoundary>} />
              <Route path="/marketplace/offers" element={<MarketplaceErrorBoundary><MarketplaceOffersPage /></MarketplaceErrorBoundary>} />
              <Route path="/marketplace/product/:productId" element={<MarketplaceErrorBoundary><MarketplaceProductPage /></MarketplaceErrorBoundary>} />
              <Route path="/product/:productId" element={<LegacyProductRedirect />} />
              <Route path="/product/:id" element={<LegacyProductRedirect />} />
              <Route path="/cart" element={<MarketplaceErrorBoundary><RequireAuth><MarketplaceCartPage /></RequireAuth></MarketplaceErrorBoundary>} />
              <Route path="/checkout" element={<MarketplaceErrorBoundary><RequireAuth><MarketplaceCheckoutPage /></RequireAuth></MarketplaceErrorBoundary>} />
              <Route path="/marketplace-manager" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "ceo"]}><Navigate to="/marketplace-manager/dashboard" replace /></RequireRole>} />
              <Route path="/marketplace-manager/dashboard" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "ceo"]}><MarketplaceManagerDashboard /></RequireRole>} />
              <Route path="/marketplace-manager/*" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "ceo"]}><MarketplaceManagerDashboard /></RequireRole>} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/order-success" element={<OrderSuccess />} />

              {/* Global Auth Routes */}
              <Route path={ROUTES.login} element={<Auth />} />
              <Route path="/role-login" element={<Navigate to={ROUTES.login} replace />} />
              <Route path={ROUTES.register} element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/easy-login" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/quick-signup" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/otp-verify" element={<OTPVerify />} />
              <Route path="/device-verify" element={<DeviceVerify />} />
              <Route path="/ip-verify" element={<IPVerify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/account-suspension" element={<AccountSuspension />} />
              <Route path={ROUTES.accessDenied} element={<AccessDenied />} />
              <Route path="/403" element={<AccessDenied />} />
              <Route path="/500" element={<InternalServerErrorPage />} />
              <Route path="/session-expired" element={<SessionExpiredPage />} />

              {/* Boss Auth - redirects to unified login */}
              <Route path="/boss-fortress" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/boss-register" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/boss/login" element={<Navigate to={ROUTES.login} replace />} />

              {/* CONTROL PANEL — Single Source of Truth */}
              <Route path="/control-panel" element={<RequireAuth><ControlPanelPage /></RequireAuth>} />

              {/* Boss Panel legacy → Control Panel */}
              <Route path="/boss-panel" element={<Navigate to="/control-panel?module=boss-dashboard" replace />} />
              <Route path="/boss-panel/*" element={<Navigate to="/control-panel?module=boss-dashboard" replace />} />

              {/* Control Tower - canonical centralized control-panel routing */}
              <Route path="/control-panel/hooks" element={<RequireAuth><HooksControlPanel /></RequireAuth>} />
              <Route path="/control-panel/hooks/*" element={<RequireAuth><HooksControlPanel /></RequireAuth>} />
              <Route path={`${ROUTES.controlPanelBase}/*`} element={<RequireAuth><ControlPanelDashboard /></RequireAuth>} />
              <Route path={ROUTES.controlPanelDashboard} element={<Navigate to={ROUTES.controlPanelBase} replace />} />
              <Route path="/control-panel/boss-dashboard" element={<Navigate to={ROUTES.controlPanelBase} replace />} />
              <Route path="/control-panel/boss-dashboard/*" element={<Navigate to={ROUTES.controlPanelBase} replace />} />

              {/* Owner / SoftwareWala → Control Panel = Boss Panel */}
              <Route path="/owner" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/owner/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/softwarewala" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Boss admin aliases → Control Panel = Boss Panel */}
              <Route path="/master-admin" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/master-admin/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/master-admin-supreme" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/master-control-vault-x9k2m" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Admin utility aliases → Control Panel = Boss Panel */}
              <Route path="/admin/bulk-users" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/admin/role-manager" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />


              {/* Area Manager → Boss Panel */}
              <Route path="/area-manager" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/area-manager/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Server Manager Routes */}
              <Route path="/server-manager" element={<ControlPanelModuleRedirect moduleId="server-manager" />} />
              <Route path="/server-manager/*" element={<ControlPanelModuleRedirect moduleId="server-manager" />} />

              {/* Security Command Center Routes */}
              <Route path="/security-command" element={<ControlPanelModuleRedirect moduleId="security-manager" />} />
              <Route path="/security-command/*" element={<ControlPanelModuleRedirect moduleId="security-manager" />} />

              {/* API / AI Manager Routes */}
              <Route path="/api-ai-manager" element={<ControlPanelModuleRedirect moduleId="ai-api-manager" />} />
              <Route path="/api-ai-manager/*" element={<ControlPanelModuleRedirect moduleId="ai-api-manager" />} />
              <Route path="/api-manager" element={<ControlPanelModuleRedirect moduleId="ai-api-manager" />} />
              <Route path="/api-manager/*" element={<ControlPanelModuleRedirect moduleId="ai-api-manager" />} />

              {/* Marketing Manager Routes */}
              <Route path="/marketing-manager" element={<ControlPanelModuleRedirect moduleId="marketing-manager" />} />
              <Route path="/marketing-manager/*" element={<ControlPanelModuleRedirect moduleId="marketing-manager" />} />


              {/* SEO Manager Routes */}
              <Route path="/seo-manager" element={<ControlPanelModuleRedirect moduleId="seo-manager" />} />
              <Route path="/seo-manager/*" element={<ControlPanelModuleRedirect moduleId="seo-manager" />} />

              {/* Legal Manager Routes (enum role: legal_compliance) */}
              <Route path="/legal-manager" element={<ControlPanelModuleRedirect moduleId="legal-manager" />} />
              <Route path="/legal-manager/*" element={<ControlPanelModuleRedirect moduleId="legal-manager" />} />

              {/* AI CEO Routes - Autonomous Intelligence Observer */}
              <Route path="/ai-ceo/*" element={<ControlPanelModuleRedirect moduleId="ceo-dashboard" />} />

              {/* Continent Super Admin → Control Panel = Boss Panel */}
              <Route path="/continent-super-admin" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/continent-super-admin/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />


              {/* Super Admin / admin - legacy routes blocked */}
              <Route path="/admin" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/admin/*" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/super-admin" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/super-admin/*" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/old-control" element={<Navigate to={ROUTES.controlPanelBase} replace />} />
              <Route path="/old-control/*" element={<Navigate to={ROUTES.controlPanelBase} replace />} />
              <Route path="/security-dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/audit-logs" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Franchise legacy routes blocked */}
              <Route path="/franchise" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/franchise/*" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/franchise-program" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/franchise-landing" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/franchise-dashboard" element={<Navigate to="/control-panel/franchise" replace />} />

              {/* Reseller Routes - HARD REDIRECT to /control-panel (no old dashboards) */}
              <Route path="/reseller" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/reseller/dashboard" element={<Navigate to="/control-panel/reseller" replace />} />
              <Route path="/reseller/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/reseller/portal" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/reseller-portal" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/reseller-program" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/reseller-landing" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/reseller-dashboard" element={<Navigate to="/control-panel/reseller" replace />} />

              {/* Developer Routes - HARD REDIRECT to /control-panel (no old dashboards) */}
              <Route path="/developer/register" element={<RequireAuth><DeveloperRegistration /></RequireAuth>} />
              <Route path="/developer/registration" element={<RequireAuth><DeveloperRegistration /></RequireAuth>} />
              <Route path="/developer" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/developer/dashboard" element={<Navigate to="/control-panel/developer" replace />} />
              <Route path="/developer/secure-dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/developer-dashboard" element={<Navigate to="/control-panel/developer" replace />} />
              <Route path="/dev-command-center" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Influencer Routes - HARD REDIRECT to /control-panel (no old dashboards) */}
              <Route path="/influencer" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/influencer/dashboard" element={<Navigate to="/control-panel/influencer" replace />} />
              <Route path="/influencer/command-center" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/influencer-command-center" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/influencer-dashboard" element={<Navigate to="/control-panel/influencer" replace />} />
              <Route path="/influencer-manager" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/influencer-manager-secure" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Product Demo Manager Routes */}
              <Route path="/product-demo-manager" element={<RequireRole allowed={["product_manager", "demo_manager", "super_admin"]}><ProductDemoManagerPage /></RequireRole>} />
              <Route path="/product-demo-manager/*" element={<RequireRole allowed={["product_manager", "demo_manager", "super_admin"]}><ProductDemoManagerPage /></RequireRole>} />
              <Route path="/product-manager" element={<Navigate to="/product-demo-manager" replace />} />
              <Route path="/product-manager/*" element={<Navigate to="/product-demo-manager" replace />} />

              {/* Reseller Manager Routes */}
              <Route path="/reseller-manager" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerDashboardPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager-secure" element={<Navigate to="/reseller-manager/dashboard" replace />} />
              <Route path="/reseller-manager/dashboard" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerDashboardPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/resellers" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerResellersPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/onboarding" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerOnboardingPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/products" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerProductsPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/licenses" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerLicensesPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/sales" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerSalesPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/commission" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerCommissionPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/payout" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerPayoutPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/invoices" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerInvoicesPage /></ResellerManagerLayout></RequireRole>} />
              <Route path="/reseller-manager/settings" element={<RequireRole allowed={["reseller_manager", "super_admin"]}><ResellerManagerLayout><ResellerManagerSettingsPage /></ResellerManagerLayout></RequireRole>} />

              {/* Franchise Manager Aliases */}
              <Route path="/franchise-manager" element={<RequireRole allowed={["franchise_manager", "boss_owner", "super_admin"]}><SecureFranchiseManagerDashboard /></RequireRole>} />
              <Route path="/franchise-manager/*" element={<RequireRole allowed={["franchise_manager", "boss_owner", "super_admin"]}><SecureFranchiseManagerDashboard /></RequireRole>} />

              {/* Sales & Support Manager Routes (enum roles: client_success/support) */}
              <Route path="/sales-support-manager" element={<RequireRole allowed={["sales_support", "super_admin"]}><SecureSalesSupportManagerDashboard /></RequireRole>} />
              <Route path="/sales-support-manager-secure" element={<RequireRole allowed={["sales_support", "super_admin"]}><SecureSalesSupportManagerDashboard /></RequireRole>} />

              <Route path="/demo/influencer-command-center" element={<InfluencerCommandCenter />} />
              {/* Prime User Routes - HARD REDIRECT to /control-panel (no old dashboards) */}
              <Route path="/prime" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/prime/dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/prime-user" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Manager Routes - PROTECTED BY ROLE */}
              <Route path="/lead-manager" element={<RequireRole allowed={["lead_manager", "super_admin", "boss_owner", "ceo"]}><SecureLeadManagerDashboard /></RequireRole>} />
              <Route path="/lead-manager-secure" element={<RequireRole allowed={["lead_manager", "super_admin", "boss_owner", "ceo"]}><SecureLeadManagerDashboard /></RequireRole>} />
              <Route path="/leads/*" element={<RequireRole allowed={["lead_manager", "super_admin", "boss_owner", "ceo"]}><SecureLeadManagerDashboard /></RequireRole>} />
              <Route path="/task-manager" element={<RequireRole allowed={["task_manager", "super_admin"]}><SecureTaskManagerDashboard /></RequireRole>} />
              <Route path="/tasks/*" element={<RequireRole allowed={["task_manager", "super_admin"]}><SecureTaskManagerDashboard /></RequireRole>} />
              <Route path="/demo-manager" element={<RequireRole allowed={["demo_manager", "super_admin", "boss_owner"]}><DemoManagerDashboard /></RequireRole>} />
              <Route path="/demo-manager/*" element={<RequireRole allowed={["demo_manager", "super_admin", "boss_owner"]}><DemoManagerDashboard /></RequireRole>} />
              <Route path="/demo" element={<RequireRole allowed={["demo_manager", "franchise_owner", "reseller", "super_admin"]}><ProductDemoManager /></RequireRole>} />
              <Route path="/demos/*" element={<RequireRole allowed={["demo_manager", "franchise_owner", "reseller", "super_admin"]}><ProductDemoManager /></RequireRole>} />
              <Route path="/finance" element={<RequireRole allowed={["finance_manager", "super_admin"]}><FinanceManager /></RequireRole>} />
              <Route path="/finance/*" element={<RequireRole allowed={["finance_manager", "super_admin"]}><FinanceManager /></RequireRole>} />
              <Route path="/legal" element={<RequireRole allowed={["legal_manager", "super_admin"]}><LegalComplianceManager /></RequireRole>} />
              <Route path="/marketing" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/marketing/*" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/enterprise/marketing" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/enterprise/marketing/*" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/performance" element={<RequireRole allowed={["analytics_manager", "super_admin"]}><PerformanceManager /></RequireRole>} />
              <Route path="/performance/*" element={<RequireRole allowed={["analytics_manager", "super_admin"]}><PerformanceManager /></RequireRole>} />
              <Route path="/rnd-dashboard" element={<Navigate to="/rnd" replace />} />
              <Route path="/rnd/*" element={<RequireRole allowed={["developer", "super_admin"]}><RnDDashboard /></RequireRole>} />
              <Route path="/hr" element={<RequireRole allowed={["hr_manager", "super_admin"]}><HRDashboard /></RequireRole>} />
              <Route path="/hr/*" element={<RequireRole allowed={["hr_manager", "super_admin"]}><HRDashboard /></RequireRole>} />

              {/* Secure Task Manager Dashboard */}
              <Route path="/task-manager-secure" element={<RequireRole allowed={["task_manager", "super_admin"]}><SecureTaskManagerDashboard /></RequireRole>} />

              {/* Secure Legal Manager Dashboard */}
              <Route path="/legal-manager-secure" element={<RequireRole allowed={["legal_manager", "super_admin"]}><SecureLegalManagerDashboard /></RequireRole>} />
              <Route path="/seo" element={<RequireRole allowed={["seo_manager", "super_admin"]}><SecureSEOManagerDashboard /></RequireRole>} />
              <Route path="/seo/*" element={<RequireRole allowed={["seo_manager", "super_admin"]}><SecureSEOManagerDashboard /></RequireRole>} />
              <Route path="/seo-dashboard" element={<Navigate to="/seo" replace />} />
              <Route path="/support" element={<RequireRole allowed={["sales_support", "super_admin"]}><SupportDashboardPage /></RequireRole>} />
              <Route path="/support/*" element={<RequireRole allowed={["sales_support", "super_admin"]}><SupportDashboardPage /></RequireRole>} />
              <Route path="/support-dashboard" element={<Navigate to="/support" replace />} />
              <Route path="/sales-support" element={<RequireRole allowed={["sales_support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/sales" element={<RequireRole allowed={["sales_support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/sales/*" element={<RequireRole allowed={["sales_support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/client-success" element={<RequireRole allowed={["sales_support", "super_admin"]}><ClientSuccessDashboard /></RequireRole>} />
              <Route path="/clients/*" element={<RequireRole allowed={["sales_support", "super_admin"]}><ClientSuccessDashboard /></RequireRole>} />
              {/* Incident / crisis routes (no dedicated enum; restrict to super_admin + boss_owner) */}
              <Route path="/incident-crisis" element={<RequireRole allowed={["boss_owner", "super_admin"]}><IncidentCrisisDashboard /></RequireRole>} />
              <Route path="/crisis/*" element={<RequireRole allowed={["boss_owner", "super_admin"]}><IncidentCrisisDashboard /></RequireRole>} />
              <Route path="/hr-dashboard" element={<Navigate to="/hr" replace />} />
              <Route path="/ai/*" element={<RequireRole allowed={["api_ai_manager", "super_admin"]}><AIOptimizationConsole /></RequireRole>} />

              {/* NEW ROLES (25-28) Routes */}
              <Route path="/safe-assist" element={<RequireRole allowed={["sales_support", "super_admin", "boss_owner"]}><SafeAssistDashboard /></RequireRole>} />
              <Route path="/safe-assist/*" element={<RequireRole allowed={["sales_support", "super_admin", "boss_owner"]}><SafeAssistDashboard /></RequireRole>} />
              <Route path="/assist-manager" element={<RequireRole allowed={["sales_support", "super_admin", "boss_owner"]}><AssistManagerDashboard /></RequireRole>} />
              <Route path="/assist-manager/*" element={<RequireRole allowed={["sales_support", "super_admin", "boss_owner"]}><AssistManagerDashboard /></RequireRole>} />
              <Route path="/promise-tracker" element={<RequireRole allowed={["analytics_manager", "super_admin", "boss_owner"]}><PromiseTrackerDashboard /></RequireRole>} />
              <Route path="/promise-tracker/*" element={<RequireRole allowed={["analytics_manager", "super_admin", "boss_owner"]}><PromiseTrackerDashboard /></RequireRole>} />
              <Route path="/promise-management" element={<RequireRole allowed={["analytics_manager", "super_admin", "boss_owner"]}><PromiseManagementDashboard /></RequireRole>} />
              <Route path="/promise-management/*" element={<RequireRole allowed={["analytics_manager", "super_admin", "boss_owner"]}><PromiseManagementDashboard /></RequireRole>} />

              {/* System Routes - SUPER ADMIN ONLY */}
              <Route path="/system-settings" element={<RequireRole allowed={["super_admin"]}><SystemSettings /></RequireRole>} />
              <Route path="/buzzer-console" element={<RequireRole allowed={["super_admin"]}><NotificationBuzzerConsole /></RequireRole>} />
              <Route path="/api-integrations" element={<RequireRole allowed={["super_admin"]}><APIIntegrationDashboard /></RequireRole>} />
              <Route path="/internal-chat" element={<RequireAuth><InternalChat /></RequireAuth>} />
              <Route path="/personal-chat" element={<RequireAuth><PersonalChat /></RequireAuth>} />
              <Route path="/ai-console" element={<RequireRole allowed={["api_ai_manager", "super_admin"]}><AIOptimizationConsole /></RequireRole>} />
              <Route path="/demo-credentials" element={<RequireRole allowed={["super_admin"]}><DemoCredentials /></RequireRole>} />
              <Route path="/demo-order-system" element={<RequireRole allowed={["boss_owner", "super_admin", "demo_manager"]}><DemoOrderSystem /></RequireRole>} />

              {/* VALA AI — Autonomous Software Factory Core */}
              <Route path="/vala-ai" element={<ControlPanelModuleRedirect moduleId="vala-ai" />} />
              <Route path="/vala-ai/factory" element={<ControlPanelModuleRedirect moduleId="vala-ai" />} />

              {/* Vala Control Center - Secure Isolated System */}
              <Route path="/vala-control" element={<RequireAuth><ValaControlCenter roleView="operations" /></RequireAuth>} />
              <Route path="/vala-control/operations" element={<RequireAuth><ValaControlCenter roleView="operations" /></RequireAuth>} />
              <Route path="/vala-control/regional" element={<RequireAuth><ValaControlCenter roleView="regional" /></RequireAuth>} />
              <Route path="/vala-control/ai-head" element={<RequireAuth><ValaControlCenter roleView="ai_head" /></RequireAuth>} />
              <Route path="/vala-control/master" element={<RequireRole allowed={["boss_owner"]} masterOnly><ValaControlCenter roleView="master" /></RequireRole>} />

              {/* Enterprise Control System - Isolated Workspaces */}
              <Route path="/enterprise-control" element={<EnterpriseControlHub />} />

              {/* New Vala Control System - Isolated Workspaces */}
              <Route path="/vala" element={<RequireAuth><ValaControlHub /></RequireAuth>} />
              <Route path="/vala/operation" element={<RequireAuth><ValaOperationWorkspace /></RequireAuth>} />
              <Route path="/vala/regional" element={<RequireAuth><ValaRegionalWorkspace /></RequireAuth>} />
              <Route path="/vala/ai-head" element={<RequireAuth><ValaAIHeadWorkspace /></RequireAuth>} />
              <Route path="/vala/master" element={<RequireRole allowed={["boss_owner"]} masterOnly><ValaMasterWorkspace /></RequireRole>} />

              {/* Dev Manager Dashboard */}
              <Route path="/dev-manager" element={<RequireAuth><SecureDevManagerDashboard /></RequireAuth>} />

              {/* HR Manager Dashboard */}
              <Route path="/hr-manager" element={<RequireAuth><SecureHRManagerDashboard /></RequireAuth>} />

              {/* Dashboard shortcuts - legacy routes blocked */}
              <Route path="/boss/dashboard" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/ceo/dashboard" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/admin/dashboard" element={<Navigate to={ROUTES.login} replace />} />
              <Route path="/continent/dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/country/dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/admin-secure" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />

              {/* Leader Security Assessment */}
              <Route path="/leader-security" element={<LeaderSecurityAssessment />} />

              {/* Bulk Actions Reference */}
              <Route path="/bulk-actions" element={<BulkActionsReference />} />

              {/* ULTRA SYSTEM FLOW — SOFTWARE FACTORY GOD MODE */}
              <Route path="/system-flow" element={<RequireRole allowed={["boss_owner", "ceo", "super_admin"]}><SystemFlowPage /></RequireRole>} />
              <Route path="/system-flow/*" element={<RequireRole allowed={["boss_owner", "ceo", "super_admin"]}><SystemFlowPage /></RequireRole>} />

              {/* /app/* - legacy route blocked */}
              <Route path="/app/*" element={<Navigate to={ROUTES.login} replace />} />
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* HARD DELETE + HARD REDIRECT: FORCE ALL OLD DASHBOARDS TO /login + /control-panel */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              {/* Force all /user/* → /login (no old user dashboards allowed) */}
              <Route path="/user" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              <Route path="/user/*" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              
              {/* Force all /old-* paths to disappear → /login */}
              <Route path="/old-dashboard" element={<Navigate to={CONTROL_PANEL_LOGIN_REDIRECT} replace />} />
              
              <Route path={ROUTES.notFound} element={<Page404 />} />

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
                        </Routes>
                          </Suspense>
                          </AppErrorBoundary>
                        <AdminQuickAccess />
                        <QuickSupport />
                        {/* Button Audit Overlay - DEV MODE ONLY */}
                        <ButtonAuditOverlay enabled={import.meta.env.DEV} />
                        </GlobalRealtimeProvider>
                      </TranslationProvider>
                    </NotificationProvider>
                  </SecurityProvider>
                </BrowserRouter>
              </SourceCodeProtection>
          </TooltipProvider>
        </AnimationProvider>
      </DemoTestModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;