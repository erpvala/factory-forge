// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CRMAuthProvider, useCRMAuth } from "@/hooks/useCRMAuth";
import SalesCRMLayout from "@/components/sales-crm/SalesCRMLayout";
import { Loader2 } from "lucide-react";

const SectionPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </div>
);

const SalesCRMDashboard = () => (
  <SectionPanel
    title="Sales CRM Dashboard"
    description="Track team performance, pipeline health, and priority actions from one place."
  />
);

const LeadManagement = () => (
  <SectionPanel
    title="Lead Management"
    description="Review and qualify incoming leads, then assign follow-ups based on urgency."
  />
);

const CustomerManagement = () => (
  <SectionPanel
    title="Customer Management"
    description="Keep customer details organized and monitor account status across teams."
  />
);

const DealTracking = () => (
  <SectionPanel
    title="Deal Tracking"
    description="Monitor open deals, next steps, and conversion progress through each stage."
  />
);

const TasksFollowups = () => (
  <SectionPanel
    title="Tasks & Follow-Ups"
    description="Manage sales tasks and follow-up actions to maintain pipeline momentum."
  />
);

const SalesCRMReports = () => (
  <SectionPanel
    title="Sales Reports"
    description="Analyze trends, team output, and campaign outcomes with consolidated metrics."
  />
);

const SalesCRMSettings = () => (
  <SectionPanel
    title="CRM Settings"
    description="Adjust notification preferences, workflow defaults, and dashboard behavior."
  />
);

const SalesCRMContent = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, isLoading } = useCRMAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/sales-crm/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <SalesCRMDashboard />;
      case "leads":
        return <LeadManagement />;
      case "customers":
        return <CustomerManagement />;
      case "deals":
        return <DealTracking />;
      case "tasks":
        return <TasksFollowups />;
      case "reports":
        return <SalesCRMReports />;
      case "settings":
        return <SalesCRMSettings />;
      default:
        return <SalesCRMDashboard />;
    }
  };

  return (
    <SalesCRMLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </SalesCRMLayout>
  );
};

const SalesCRMDemo = () => {
  return (
    <CRMAuthProvider>
      <SalesCRMContent />
    </CRMAuthProvider>
  );
};

export default SalesCRMDemo;
