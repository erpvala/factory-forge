// @ts-nocheck
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import SalesSupportSidebar, { SalesSupportSection } from "@/components/sales-support/SalesSupportSidebar";
import SalesSupportDashboardContent from "@/components/sales-support/SalesSupportDashboardContent";

const SalesSupportManagerView = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SalesSupportSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSectionChange = useCallback((section: SalesSupportSection) => {
    setActiveSection(section);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleBack = useCallback(() => {
    // Navigate back to Control Panel
    navigate("/super-admin-system/role-switch?role=boss_owner");
  }, [navigate]);

  return (
    <TooltipProvider>
      <div className="flex h-full w-full">
        {/* Left Sidebar - Full Height */}
        <SalesSupportSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onBack={handleBack}
        />

        {/* Main Content Area */}
        <SalesSupportDashboardContent activeSection={activeSection} />
      </div>
    </TooltipProvider>
  );
};

export default SalesSupportManagerView;
