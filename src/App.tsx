// @ts-nocheck
// Software Vala - Enterprise Management Platform
import React, { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import SystemNotificationsInitializer from "@/components/notifications/SystemNotificationsInitializer";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AppRoutes } from "@/routes/appRoutes";
import { ROUTES } from "@/routes/routes";
import RouteRuntimeEnhancer from "@/components/routing/RouteRuntimeEnhancer";
import LegacyProductRedirect from "@/components/routing/LegacyProductRedirect";
import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

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
const FranchiseManagement = lazy(() => import("@/pages/FranchiseManagement"));
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

// Boss / Admin dashboards
const BossPanel             = lazy(() => import("@/pages/BossPanel"));
const MasterControlCenter   = lazy(() => import("@/pages/master-control/MasterControlCenter"));
const MasterAdminSupreme    = lazy(() => import("@/pages/master-admin-supreme/MasterAdminSupreme"));
const SoftwareWalaOwnerDashboard = lazy(() => import("@/pages/owner/SoftwareWalaOwnerDashboard"));
const BootstrapAdmins       = lazy(() => import("@/pages/admin/BootstrapAdmins"));
const BulkUserCreation      = lazy(() => import("@/pages/admin/BulkUserCreation"));
const RoleManagerPage       = lazy(() => import("@/pages/admin/RoleManagerPage"));
const SecurityCommandCenter = lazy(() => import("@/pages/security-command/SecurityCommandCenter"));
const CentralIntegrationHub = lazy(() => import("@/pages/api-manager/CentralIntegrationHub"));
const ServerManagementPortal = lazy(() => import("@/pages/server/ServerManagementPortal"));
const ServerManagerDashboard = lazy(() => import("@/pages/server-manager/ServerManagerDashboard"));
const EnterpriseControlHub  = lazy(() => import("@/pages/enterprise-control/EnterpriseControlHub"));
const SystemFlowPage        = lazy(() => import("@/pages/SystemFlowPage"));
const SystemSettings        = lazy(() => import("@/pages/SystemSettings"));

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

// Continent / Super Admin
const ContinentSuperAdminDashboard = lazy(() => import("@/components/continent-dashboard/ContinentSuperAdminDashboard"));
const SuperAdminSystemDashboard = lazy(() => import("@/pages/super-admin-system/Dashboard"));
const SuperAdminUsers        = lazy(() => import("@/pages/super-admin-system/Users"));
const SuperAdminAdmins       = lazy(() => import("@/pages/super-admin-system/Admins"));
const SuperAdminRoles        = lazy(() => import("@/pages/super-admin-system/Roles"));
const SuperAdminGeography    = lazy(() => import("@/pages/super-admin-system/Geography"));
const SuperAdminModules      = lazy(() => import("@/pages/super-admin-system/Modules"));
const SuperAdminRentals      = lazy(() => import("@/pages/super-admin-system/Rentals"));
const SuperAdminRules        = lazy(() => import("@/pages/super-admin-system/Rules"));
const SuperAdminApprovals    = lazy(() => import("@/pages/super-admin-system/Approvals"));
const SuperAdminSecurity     = lazy(() => import("@/pages/super-admin-system/Security"));
const SuperAdminSystemLock   = lazy(() => import("@/pages/super-admin-system/SystemLock"));
const SuperAdminActivityLog  = lazy(() => import("@/pages/super-admin-system/ActivityLog"));
const SuperAdminAudit        = lazy(() => import("@/pages/super-admin-system/Audit"));
const RoleSwitchDashboard    = lazy(() => import("@/pages/super-admin-system/RoleSwitch/RoleSwitchDashboard"));
const RoleManager            = lazy(() => import("@/pages/super-admin/RoleManager"));
const UserManager            = lazy(() => import("@/pages/super-admin/UserManager"));
const PermissionMatrix       = lazy(() => import("@/pages/super-admin/PermissionMatrix"));
const SystemAudit            = lazy(() => import("@/pages/super-admin/SystemAudit"));
const LiveTracking           = lazy(() => import("@/pages/super-admin/LiveTracking"));
const PrimeManager           = lazy(() => import("@/pages/super-admin/PrimeManager"));
const ProductManagerPage     = lazy(() => import("@/pages/super-admin/ProductManagerPage"));
const ComplianceCenter       = lazy(() => import("@/pages/super-admin/ComplianceCenter"));

// Manager dashboards
const FinanceManager         = lazy(() => import("@/pages/FinanceManager"));
const LeadManager            = lazy(() => import("@/pages/LeadManager"));
const TaskManager            = lazy(() => import("@/pages/TaskManager"));
const MarketingManager       = lazy(() => import("@/pages/MarketingManager"));
const MarketingManagerDashboard = lazy(() => import("@/pages/marketing-manager/MarketingManagerDashboard"));
const SEODashboard           = lazy(() => import("@/pages/SEODashboard"));
const SEOManagerDashboard    = lazy(() => import("@/pages/dashboards/SEOManagerDashboard"));
const LegalComplianceManager = lazy(() => import("@/pages/LegalComplianceManager"));
const LegalManagerDashboard  = lazy(() => import("@/pages/legal-manager/LegalManagerDashboard"));
const SecureLegalManagerDashboard = lazy(() => import("@/pages/legal-manager/SecureLegalManagerDashboard"));
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
const UserDashboard          = lazy(() => import("@/pages/user/UserDashboard"));
const SecurityCenter         = lazy(() => import("@/components/admin/SecurityCenter"));

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
const WireframeRoutes_page  = lazy(() => import("@/components/wireframe/WireframeRoutes").then(m => ({ default: m.WireframeRoutes })));

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

const UserDashboardShell = () => (
  <RoleDashboardShell
    title="User Dashboard"
    subtitle="Orders, access, and account controls"
    links={[
      { label: 'Dashboard', to: ROUTES.userDashboard },
      { label: 'Settings', to: '/settings' },
    ]}
  >
    <UserDashboard />
  </RoleDashboardShell>
);

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
                  <RouteRuntimeEnhancer />
                  <SecurityProvider>
                    <NotificationProvider>
                      <TranslationProvider>
                        <GlobalRealtimeProvider>
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
              <Route path="/dashboard" element={<Navigate to={ROUTES.app} replace />} />
              <Route path="/dashboard/notifications" element={<RequireAuth><DashboardNotificationsPage /></RequireAuth>} />
              {/* Basic profile route to satisfy header navigation */}
              <Route path="/profile" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path={ROUTES.pendingApproval} element={<PendingApproval />} />
              {/* Legacy alias: /pending-approval → /dashboard/pending */}
              <Route path={ROUTES.pendingApprovalLegacy} element={<Navigate to={ROUTES.pendingApproval} replace />} />
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
              {/* Boss Applications panel */}
              <Route path={ROUTES.bossApplications} element={<BossApplications />} />
              {/* Bootstrap is Master-only after initial setup */}
              <Route path="/bootstrap-admins" element={<RequireRole allowed={["master"]} masterOnly><BootstrapAdmins /></RequireRole>} />
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
              <Route path="/user-dashboard" element={<Navigate to="/user/dashboard" replace />} />
              <Route path="/user/dashboard" element={<RequireAuth><UserDashboardShell /></RequireAuth>} />
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
              <Route path="/marketplace-manager" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "master", "ceo"]}><Navigate to="/marketplace-manager/dashboard" replace /></RequireRole>} />
              <Route path="/marketplace-manager/dashboard" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "master", "ceo"]}><MarketplaceManagerDashboard /></RequireRole>} />
              <Route path="/marketplace-manager/*" element={<RequireRole allowed={["marketplace_manager", "super_admin", "boss_owner", "master", "ceo"]}><MarketplaceManagerDashboard /></RequireRole>} />
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

              {/* Boss Panel */}
              <Route path={ROUTES.bossPanel} element={<BossPanel />} />
              <Route path={`${ROUTES.bossPanel}/*`} element={<BossPanel />} />

              {/* Owner Dashboard - SoftwareWala Business Control */}
              <Route path="/owner" element={<RequireRole allowed={["boss_owner"]}><SoftwareWalaOwnerDashboard /></RequireRole>} />
              <Route path="/owner/*" element={<RequireRole allowed={["boss_owner"]}><SoftwareWalaOwnerDashboard /></RequireRole>} />
              <Route path="/softwarewala" element={<RequireRole allowed={["boss_owner"]}><SoftwareWalaOwnerDashboard /></RequireRole>} />

              {/* Boss Admin Routes - BOSS_OWNER ONLY */}
              <Route path="/master-admin" element={<RequireRole allowed={["boss_owner"]}><MasterControlCenter /></RequireRole>} />
              <Route path="/master-admin/*" element={<RequireRole allowed={["boss_owner"]}><MasterControlCenter /></RequireRole>} />
              <Route path="/master-admin-supreme" element={<RequireRole allowed={["boss_owner"]}><MasterAdminSupreme /></RequireRole>} />
              <Route path="/master-control-vault-x9k2m" element={<RequireRole allowed={["boss_owner"]}><MasterControlCenter /></RequireRole>} />

              {/* Admin Utilities - Boss Owner */}
              <Route path="/admin/bulk-users" element={<RequireRole allowed={["boss_owner"]}><BulkUserCreation /></RequireRole>} />
              <Route path="/admin/role-manager" element={<RequireRole allowed={["boss_owner"]}><RoleManagerPage /></RequireRole>} />


              {/* Area Manager now redirects to Country Head - merged roles */}
              <Route path="/area-manager" element={<Navigate to="/super-admin-system/role-switch?role=country_head" replace />} />
              <Route path="/area-manager/*" element={<Navigate to="/super-admin-system/role-switch?role=country_head" replace />} />

              {/* Server Manager Routes */}
              <Route path="/server-manager" element={<RequireRole allowed={["boss_owner", "server_manager"]}><ServerManagerDashboard /></RequireRole>} />
              <Route path="/server-manager/*" element={<RequireRole allowed={["boss_owner", "server_manager"]}><ServerManagerDashboard /></RequireRole>} />

              {/* Security Command Center Routes */}
              <Route path="/security-command" element={<RequireRole allowed={["boss_owner"]}><SecurityCommandCenter /></RequireRole>} />
              <Route path="/security-command/*" element={<RequireRole allowed={["boss_owner"]}><SecurityCommandCenter /></RequireRole>} />

              {/* API / AI Manager Routes */}
              <Route path="/api-manager" element={<RequireRole allowed={["boss_owner", "ai_manager"]}><CentralIntegrationHub /></RequireRole>} />
              <Route path="/api-manager/*" element={<RequireRole allowed={["boss_owner", "ai_manager"]}><CentralIntegrationHub /></RequireRole>} />

              {/* Marketing Manager Routes */}
              <Route path="/marketing-manager" element={<RequireRole allowed={["boss_owner", "marketing_manager"]}><MarketingManagerDashboard /></RequireRole>} />
              <Route path="/marketing-manager/*" element={<RequireRole allowed={["boss_owner", "marketing_manager"]}><MarketingManagerDashboard /></RequireRole>} />


              {/* SEO Manager Routes */}
              <Route path="/seo-manager" element={<RequireRole allowed={["boss_owner", "seo_manager"]}><SEOManagerDashboard /></RequireRole>} />
              <Route path="/seo-manager/*" element={<RequireRole allowed={["boss_owner", "seo_manager"]}><SEOManagerDashboard /></RequireRole>} />

              {/* Legal Manager Routes (enum role: legal_compliance) */}
              <Route path="/legal-manager" element={<RequireRole allowed={["boss_owner", "legal_compliance"]}><LegalManagerDashboard /></RequireRole>} />
              <Route path="/legal-manager/*" element={<RequireRole allowed={["boss_owner", "legal_compliance"]}><LegalManagerDashboard /></RequireRole>} />

              {/* AI CEO Routes - Autonomous Intelligence Observer */}
              <Route path="/ai-ceo" element={<RequireRole allowed={["boss_owner", "ceo"]}><AICEODashboard /></RequireRole>}>
                <Route index element={<AICEODashboardMain />} />
                <Route path="live-monitor" element={<AICEOLiveMonitor />} />
                <Route path="decision-engine" element={<AICEODecisionEngine />} />
                <Route path="approvals" element={<AICEOApprovals />} />
                <Route path="risk" element={<AICEORiskCompliance />} />
                <Route path="performance" element={<AICEOPerformance />} />
                <Route path="predictions" element={<AICEOPredictions />} />
                <Route path="reports" element={<AICEOReports />} />
                <Route path="learning" element={<AICEOLearning />} />
                <Route path="settings" element={<AICEOSettings />} />
              </Route>

              {/* Continent Super Admin Routes */}
              <Route path="/continent-super-admin" element={<RequireRole allowed={["boss_owner"]}><ContinentSuperAdminDashboard config={{} as any} /></RequireRole>} />
              <Route path="/continent-super-admin/*" element={<RequireRole allowed={["boss_owner"]}><ContinentSuperAdminDashboard config={{} as any} /></RequireRole>} />


              {/* Super Admin Routes - Redirect to unified RoleSwitchDashboard to prevent duplicate layouts */}
              <Route path="/admin" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/super-admin" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/super-admin/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/super-admin/command-center" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/super-admin/live-tracking" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><LiveTracking /></RequireRole>} />
              <Route path="/super-admin/role-manager" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><RoleManager /></RequireRole>} />
              <Route path="/super-admin/user-manager" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><UserManager /></RequireRole>} />
              <Route path="/super-admin/user-management" element={<Navigate to="/super-admin/user-manager" replace />} />
              <Route path="/super-admin/permission-matrix" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><PermissionMatrix /></RequireRole>} />
              <Route path="/super-admin/security-center" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><SecurityCenter /></RequireRole>} />
              <Route path="/security-dashboard" element={<Navigate to="/super-admin/security-center" replace />} />
              <Route path="/super-admin/demo-manager" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><ProductDemoManager /></RequireRole>} />
              <Route path="/super-admin/product-manager" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><ProductManagerPage /></RequireRole>} />
              <Route path="/super-admin/system-settings" element={<RequireRole allowed={["boss_owner", "master", "ceo"]}><SystemSettings /></RequireRole>} />
              <Route path="/super-admin/system-audit" element={<RequireRole allowed={["boss_owner"]}><SystemAudit /></RequireRole>} />
              <Route path="/audit-logs" element={<Navigate to="/super-admin/system-audit" replace />} />
              <Route path="/super-admin/prime-manager" element={<RequireRole allowed={["boss_owner"]}><PrimeManager /></RequireRole>} />
              <Route path="/super-admin/influencer-manager" element={<RequireRole allowed={["boss_owner"]}><InfluencerManager /></RequireRole>} />
              <Route path="/super-admin/finance-center" element={<RequireRole allowed={["boss_owner"]}><FinanceManager /></RequireRole>} />
              <Route path="/super-admin/support-center" element={<RequireRole allowed={["boss_owner"]}><SupportDashboardPage activeView="overview" /></RequireRole>} />
              <Route path="/super-admin/ai-billing" element={<RequireRole allowed={["boss_owner"]}><AIBillingDashboard /></RequireRole>} />
              <Route path="/super-admin/franchise-manager" element={<RequireRole allowed={["boss_owner"]}><FranchiseManagement /></RequireRole>} />
              <Route path="/super-admin/compliance-center" element={<RequireRole allowed={["boss_owner"]}><ComplianceCenter /></RequireRole>} />
              <Route path="/super-admin/performance" element={<RequireRole allowed={["boss_owner"]}><PerformanceManager /></RequireRole>} />

              {/* Franchise Routes */}
              <Route path="/franchise" element={<Navigate to={ROUTES.franchiseDashboard} replace />} />
              <Route path={ROUTES.franchiseDashboard} element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseDashboardPage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/profile" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseProfile /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/wallet" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseWalletPage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/lead-board" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseLeadBoardPage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/assign-lead" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseAssignLead /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/demo-request" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseDemoRequest /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/demo-library" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseDemoLibraryPage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/sales-center" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseSalesCenter /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/performance" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchisePerformancePage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/support-ticket" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseSupportTicket /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/internal-chat" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseInternalChatPage /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/training-center" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseTrainingCenter /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/security-panel" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseSecurityPanel /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/seo-services" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseSEOServices /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/team-management" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseTeamManagement /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/crm" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseCRM /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/hrm" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseHRM /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise/lead-activity" element={<RequireRole allowed={["franchise", "franchise_owner", "super_admin"]}><FranchiseLayout><FranchiseLeadActivity /></FranchiseLayout></RequireRole>} />
              <Route path="/franchise-program" element={<FranchiseLanding />} />
              <Route path="/franchise-landing" element={<FranchiseLanding />} />
              <Route path="/franchise-dashboard" element={<Navigate to={ROUTES.franchiseDashboard} replace />} />

              {/* Reseller Routes */}
              <Route path="/reseller" element={<Navigate to={ROUTES.resellerDashboard} replace />} />
              <Route path="/reseller/*" element={<RequireRole allowed={["reseller", "super_admin"]}><ResellerAppRouter /></RequireRole>} />
              <Route path="/reseller/portal" element={<Navigate to={ROUTES.resellerDashboard} replace />} />
              <Route path="/reseller-portal" element={<Navigate to={ROUTES.resellerDashboard} replace />} />
              <Route path="/reseller-program" element={<ResellerLanding />} />
              <Route path="/reseller-landing" element={<ResellerLanding />} />
              <Route path="/reseller-dashboard" element={<Navigate to={ROUTES.resellerDashboard} replace />} />

              {/* Developer Routes */}
              <Route path="/developer/register" element={<RequireAuth><DeveloperRegistration /></RequireAuth>} />
              <Route path="/developer/registration" element={<RequireAuth><DeveloperRegistration /></RequireAuth>} />
              <Route path="/developer" element={<Navigate to={ROUTES.developerDashboard} replace />} />
              <Route path={ROUTES.developerDashboard} element={<RequireRole allowed={["developer", "super_admin"]}><DeveloperDashboardShell /></RequireRole>} />
              <Route path="/developer/secure-dashboard" element={<RequireRole allowed={["developer", "super_admin"]}><SecureDeveloperDashboard /></RequireRole>} />
              <Route path="/developer-dashboard" element={<Navigate to={ROUTES.developerDashboard} replace />} />
              <Route path="/dev-command-center" element={<Navigate to={ROUTES.developerDashboard} replace />} />

              {/* Influencer Routes */}
              <Route path="/influencer" element={<Navigate to={ROUTES.influencerDashboard} replace />} />
              <Route path={ROUTES.influencerDashboard} element={<RequireRole allowed={["influencer", "super_admin"]}><InfluencerDashboardShell /></RequireRole>} />
              <Route path="/influencer/command-center" element={<RequireRole allowed={["influencer", "super_admin"]}><InfluencerCommandCenter /></RequireRole>} />
              <Route path="/influencer-command-center" element={<Navigate to="/influencer/command-center" replace />} />
              <Route path="/influencer-dashboard" element={<Navigate to={ROUTES.influencerDashboard} replace />} />
              <Route path="/influencer-manager" element={<RequireRole allowed={["super_admin"]}><InfluencerManager /></RequireRole>} />
              <Route path="/influencer-manager-secure" element={<RequireRole allowed={["boss_owner", "super_admin"]}><SecureInfluencerManagerDashboard /></RequireRole>} />

              {/* Product Demo Manager Routes */}
              <Route path="/product-demo-manager" element={<RequireRole allowed={["product_demo_manager", "demo_manager", "super_admin"]}><ProductDemoManagerPage /></RequireRole>} />
              <Route path="/product-demo-manager/*" element={<RequireRole allowed={["product_demo_manager", "demo_manager", "super_admin"]}><ProductDemoManagerPage /></RequireRole>} />

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
              <Route path="/sales-support-manager" element={<RequireRole allowed={["client_success", "support", "super_admin"]}><SecureSalesSupportManagerDashboard /></RequireRole>} />
              <Route path="/sales-support-manager-secure" element={<RequireRole allowed={["client_success", "support", "super_admin"]}><SecureSalesSupportManagerDashboard /></RequireRole>} />

              <Route path="/demo/influencer-command-center" element={<InfluencerCommandCenter />} />
              {/* Prime User Routes */}
              <Route path="/prime" element={<RequireRole allowed={["prime", "super_admin"]}><PrimeUserDashboard /></RequireRole>} />
              <Route path="/prime/dashboard" element={<Navigate to="/prime" replace />} />
              <Route path="/prime-user" element={<Navigate to="/prime" replace />} />

              {/* Manager Routes - PROTECTED BY ROLE */}
              <Route path="/lead-manager" element={<RequireRole allowed={["lead_manager", "super_admin", "boss_owner", "master", "ceo"]}><LeadManager /></RequireRole>} />
              <Route path="/leads/*" element={<RequireRole allowed={["lead_manager", "super_admin", "boss_owner", "master", "ceo"]}><LeadManager /></RequireRole>} />
              <Route path="/task-manager" element={<RequireRole allowed={["task_manager", "super_admin"]}><TaskManager /></RequireRole>} />
              <Route path="/tasks/*" element={<RequireRole allowed={["task_manager", "super_admin"]}><TaskManager /></RequireRole>} />
              <Route path="/demo-manager" element={<RequireRole allowed={["demo_manager", "super_admin", "master"]}><DemoManagerDashboard /></RequireRole>} />
              <Route path="/demo-manager/*" element={<RequireRole allowed={["demo_manager", "super_admin", "master"]}><DemoManagerDashboard /></RequireRole>} />
              <Route path="/demo" element={<RequireRole allowed={["demo_manager", "franchise", "reseller", "super_admin"]}><ProductDemoManager /></RequireRole>} />
              <Route path="/demos/*" element={<RequireRole allowed={["demo_manager", "franchise", "reseller", "super_admin"]}><ProductDemoManager /></RequireRole>} />
              <Route path="/finance" element={<RequireRole allowed={["finance_manager", "super_admin"]}><FinanceManager /></RequireRole>} />
              <Route path="/finance/*" element={<RequireRole allowed={["finance_manager", "super_admin"]}><FinanceManager /></RequireRole>} />
              <Route path="/legal" element={<RequireRole allowed={["legal_compliance", "super_admin"]}><LegalComplianceManager /></RequireRole>} />
              <Route path="/marketing" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/marketing/*" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/enterprise/marketing" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/enterprise/marketing/*" element={<RequireRole allowed={["marketing_manager", "super_admin"]}><MarketingManager /></RequireRole>} />
              <Route path="/performance" element={<RequireRole allowed={["performance_manager", "super_admin"]}><PerformanceManager /></RequireRole>} />
              <Route path="/performance/*" element={<RequireRole allowed={["performance_manager", "super_admin"]}><PerformanceManager /></RequireRole>} />
              <Route path="/rnd-dashboard" element={<Navigate to="/rnd" replace />} />
              <Route path="/rnd/*" element={<RequireRole allowed={["rnd_manager", "super_admin"]}><RnDDashboard /></RequireRole>} />
              <Route path="/hr" element={<RequireRole allowed={["hr_manager", "super_admin"]}><HRDashboard /></RequireRole>} />
              <Route path="/hr/*" element={<RequireRole allowed={["hr_manager", "super_admin"]}><HRDashboard /></RequireRole>} />

              {/* Secure Task Manager Dashboard */}
              <Route path="/task-manager-secure" element={<RequireRole allowed={["task_manager", "super_admin"]}><SecureTaskManagerDashboard /></RequireRole>} />

              {/* Secure Legal Manager Dashboard */}
              <Route path="/legal-manager-secure" element={<RequireRole allowed={["legal_compliance", "super_admin"]}><SecureLegalManagerDashboard /></RequireRole>} />
              <Route path="/seo" element={<RequireRole allowed={["seo_manager", "super_admin"]}><SEODashboard /></RequireRole>} />
              <Route path="/seo/*" element={<RequireRole allowed={["seo_manager", "super_admin"]}><SEODashboard /></RequireRole>} />
              <Route path="/seo-dashboard" element={<Navigate to="/seo" replace />} />
              <Route path="/support" element={<RequireRole allowed={["support", "client_success", "super_admin"]}><SupportDashboardPage /></RequireRole>} />
              <Route path="/support/*" element={<RequireRole allowed={["support", "client_success", "super_admin"]}><SupportDashboardPage /></RequireRole>} />
              <Route path="/support-dashboard" element={<Navigate to="/support" replace />} />
              <Route path="/sales-support" element={<RequireRole allowed={["support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/sales" element={<RequireRole allowed={["support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/sales/*" element={<RequireRole allowed={["support", "super_admin"]}><SalesSupportDashboard /></RequireRole>} />
              <Route path="/client-success" element={<RequireRole allowed={["client_success", "super_admin"]}><ClientSuccessDashboard /></RequireRole>} />
              <Route path="/clients/*" element={<RequireRole allowed={["client_success", "super_admin"]}><ClientSuccessDashboard /></RequireRole>} />
              {/* Incident / crisis routes (no dedicated enum; restrict to super_admin + boss_owner) */}
              <Route path="/incident-crisis" element={<RequireRole allowed={["boss_owner", "super_admin"]}><IncidentCrisisDashboard /></RequireRole>} />
              <Route path="/crisis/*" element={<RequireRole allowed={["boss_owner", "super_admin"]}><IncidentCrisisDashboard /></RequireRole>} />
              <Route path="/hr-dashboard" element={<Navigate to="/hr" replace />} />
              <Route path="/ai/*" element={<RequireRole allowed={["ai_manager", "super_admin"]}><AIOptimizationConsole /></RequireRole>} />

              {/* NEW ROLES (25-28) Routes */}
              <Route path="/safe-assist" element={<RequireRole allowed={["safe_assist", "super_admin", "master"]}><SafeAssistDashboard /></RequireRole>} />
              <Route path="/safe-assist/*" element={<RequireRole allowed={["safe_assist", "super_admin", "master"]}><SafeAssistDashboard /></RequireRole>} />
              <Route path="/assist-manager" element={<RequireRole allowed={["assist_manager", "super_admin", "master"]}><AssistManagerDashboard /></RequireRole>} />
              <Route path="/assist-manager/*" element={<RequireRole allowed={["assist_manager", "super_admin", "master"]}><AssistManagerDashboard /></RequireRole>} />
              <Route path="/promise-tracker" element={<RequireRole allowed={["promise_tracker", "super_admin", "master"]}><PromiseTrackerDashboard /></RequireRole>} />
              <Route path="/promise-tracker/*" element={<RequireRole allowed={["promise_tracker", "super_admin", "master"]}><PromiseTrackerDashboard /></RequireRole>} />
              <Route path="/promise-management" element={<RequireRole allowed={["promise_management", "super_admin", "master"]}><PromiseManagementDashboard /></RequireRole>} />
              <Route path="/promise-management/*" element={<RequireRole allowed={["promise_management", "super_admin", "master"]}><PromiseManagementDashboard /></RequireRole>} />

              {/* System Routes - SUPER ADMIN ONLY */}
              <Route path="/system-settings" element={<RequireRole allowed={["super_admin"]}><SystemSettings /></RequireRole>} />
              <Route path="/buzzer-console" element={<RequireRole allowed={["super_admin"]}><NotificationBuzzerConsole /></RequireRole>} />
              <Route path="/api-integrations" element={<RequireRole allowed={["super_admin"]}><APIIntegrationDashboard /></RequireRole>} />
              <Route path="/internal-chat" element={<RequireAuth><InternalChat /></RequireAuth>} />
              <Route path="/personal-chat" element={<RequireAuth><PersonalChat /></RequireAuth>} />
              <Route path="/ai-console" element={<RequireRole allowed={["ai_manager", "super_admin"]}><AIOptimizationConsole /></RequireRole>} />
              <Route path="/demo-credentials" element={<RequireRole allowed={["super_admin"]}><DemoCredentials /></RequireRole>} />
              <Route path="/demo-order-system" element={<RequireRole allowed={["master", "super_admin", "demo_manager"]}><DemoOrderSystem /></RequireRole>} />

              {/* VALA AI — Autonomous Software Factory Core */}
              <Route path="/vala-ai" element={<RequireAuth><ValaAIFactoryPage /></RequireAuth>} />
              <Route path="/vala-ai/factory" element={<RequireAuth><ValaAIFactoryPage /></RequireAuth>} />

              {/* Vala Control Center - Secure Isolated System */}
              <Route path="/vala-control" element={<RequireAuth><ValaControlCenter roleView="operations" /></RequireAuth>} />
              <Route path="/vala-control/operations" element={<RequireAuth><ValaControlCenter roleView="operations" /></RequireAuth>} />
              <Route path="/vala-control/regional" element={<RequireAuth><ValaControlCenter roleView="regional" /></RequireAuth>} />
              <Route path="/vala-control/ai-head" element={<RequireAuth><ValaControlCenter roleView="ai_head" /></RequireAuth>} />
              <Route path="/vala-control/master" element={<RequireRole allowed={["master"]} masterOnly><ValaControlCenter roleView="master" /></RequireRole>} />

              {/* Enterprise Control System - Isolated Workspaces */}
              <Route path="/enterprise-control" element={<EnterpriseControlHub />} />

              {/* New Vala Control System - Isolated Workspaces */}
              <Route path="/vala" element={<RequireAuth><ValaControlHub /></RequireAuth>} />
              <Route path="/vala/operation" element={<RequireAuth><ValaOperationWorkspace /></RequireAuth>} />
              <Route path="/vala/regional" element={<RequireAuth><ValaRegionalWorkspace /></RequireAuth>} />
              <Route path="/vala/ai-head" element={<RequireAuth><ValaAIHeadWorkspace /></RequireAuth>} />
              <Route path="/vala/master" element={<RequireRole allowed={["master"]} masterOnly><ValaMasterWorkspace /></RequireRole>} />

              {/* Dev Manager Dashboard */}
              <Route path="/dev-manager" element={<RequireAuth><SecureDevManagerDashboard /></RequireAuth>} />

              {/* HR Manager Dashboard */}
              <Route path="/hr-manager" element={<RequireAuth><SecureHRManagerDashboard /></RequireAuth>} />

              {/* Wireframe Routes - Design Sandbox */}
              <Route path="/wireframe/*" element={<WireframeRoutes_page />} />

              {/* Super Admin System Routes */}
              {/* Explicit dashboard aliases (never allow route-not-found -> blank screen) */}
              <Route path="/boss/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/ceo/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=ceo" replace />} />
              <Route path="/admin/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=admin" replace />} />
              <Route path="/continent/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=continent_super_admin" replace />} />
              <Route path="/country/dashboard" element={<Navigate to="/super-admin-system/role-switch?role=country_head" replace />} />

              <Route path="/super-admin-system" element={<Navigate to="/super-admin-system/dashboard" replace />} />
              {/* Short aliases (avoid 404 when users type abbreviated links) */}
              <Route path="/super-admin-system/rc" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />
              <Route path="/super-admin-system/role-center" element={<Navigate to="/super-admin-system/role-switch?role=boss_owner" replace />} />

              <Route path="/super-admin-system/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin-secure" element={<Navigate to="/super-admin-system/role-switch?role=admin" replace />} />
              {/* Role switcher - Protected for privileged roles */}
              <Route path="/super-admin-system/role-switch" element={<RequireRole allowed={['boss_owner', 'ceo', 'admin', 'super_admin', 'master', 'continent_super_admin', 'country_head']}><RoleSwitchDashboard /></RequireRole>} />
              <Route path="/super-admin-system/role-switch/*" element={<RequireRole allowed={['boss_owner', 'ceo', 'admin', 'super_admin', 'master', 'continent_super_admin', 'country_head']}><RoleSwitchDashboard /></RequireRole>} />
              <Route path="/super-admin-system/dashboard" element={<SuperAdminSystemDashboard />} />
              <Route path="/super-admin-system/users" element={<SuperAdminUsers />} />
              <Route path="/super-admin-system/admins" element={<SuperAdminAdmins />} />
              <Route path="/super-admin-system/roles" element={<SuperAdminRoles />} />
              <Route path="/super-admin-system/geography" element={<SuperAdminGeography />} />
              <Route path="/super-admin-system/modules" element={<SuperAdminModules />} />
              <Route path="/super-admin-system/rentals" element={<SuperAdminRentals />} />
              <Route path="/super-admin-system/rules" element={<SuperAdminRules />} />
              <Route path="/super-admin-system/approvals" element={<SuperAdminApprovals />} />
              <Route path="/super-admin-system/security" element={<SuperAdminSecurity />} />
              <Route path="/super-admin-system/locks" element={<SuperAdminSystemLock />} />
              <Route path="/super-admin-system/activity-log" element={<SuperAdminActivityLog />} />
              <Route path="/super-admin-system/audit" element={<SuperAdminAudit />} />

              {/* Leader Security Assessment */}
              <Route path="/leader-security" element={<LeaderSecurityAssessment />} />

              {/* Bulk Actions Reference */}
              <Route path="/bulk-actions" element={<BulkActionsReference />} />

              {/* ULTRA SYSTEM FLOW — SOFTWARE FACTORY GOD MODE */}
              <Route path="/system-flow" element={<RequireRole allowed={["boss_owner", "ceo", "super_admin", "master"]}><SystemFlowPage /></RequireRole>} />
              <Route path="/system-flow/*" element={<RequireRole allowed={["boss_owner", "ceo", "super_admin", "master"]}><SystemFlowPage /></RequireRole>} />

              {/* /app/* — Module system: role-gated smart-redirect per role */}
              <Route path="/app/*" element={<AppRoutes />} />
              <Route path={ROUTES.notFound} element={<Page404 />} />

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to={ROUTES.notFound} replace />} />
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