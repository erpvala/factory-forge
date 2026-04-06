// @ts-nocheck
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import FranchiseManagerSidebar, { FranchiseManagerSection } from "@/components/franchise/FranchiseManagerSidebar";
import FranchiseManagerDashboardContent from "@/components/franchise/FranchiseManagerDashboardContent";

const FranchiseManagerView = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<FranchiseManagerSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSectionChange = useCallback((section: FranchiseManagerSection) => {
    setActiveSection(section);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleBackToCountryHead = useCallback(() => {
    // Navigate back to Country Head role
    navigate('/super-admin-system/role-switch?role=country_head');
  }, [navigate]);

  return (
    <TooltipProvider>
      <div className="flex h-full w-full">
        {/* Left Sidebar - Full Height */}
        <FranchiseManagerSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          franchiseName="Assigned Franchise(s)"
          onBackToCountryHead={handleBackToCountryHead}
        />

        {/* Main Content Area */}
        <FranchiseManagerDashboardContent activeSection={activeSection} />
      </div>
    </TooltipProvider>
  );
};

export default FranchiseManagerView;
