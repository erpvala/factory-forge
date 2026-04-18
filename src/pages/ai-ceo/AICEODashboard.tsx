// @ts-nocheck
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AICEOSidebar from "@/components/ai-ceo/AICEOSidebar";
import AICEOHeader from "@/components/ai-ceo/AICEOHeader";

const CEO_API = '/api/v1/ceo-dashboard';

async function ceoDashboardPost(action: string, payload: Record<string, unknown> = {}) {
  try {
    const res = await fetch(CEO_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json().catch(() => ({}));
    return data?.success ? data : null;
  } catch {
    return null;
  }
}

const AICEODashboard = () => {
    const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [streamingOn, setStreamingOn] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeModules: 0,
    systemHealth: 0,
    revenue: 0,
    alerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadSystemData = async () => {
      setIsLoading(true);
      try {
        const dashboard = await ceoDashboardPost('dashboard');
        if (dashboard?.summary) {
          const s = dashboard.summary as {
            total_users?: number;
            active_modules?: number;
            health_score?: number;
            revenue_today?: number;
            critical_alerts?: number;
          };
          setSystemStats({
            totalUsers: s.total_users || 0,
            activeModules: s.active_modules || 0,
            systemHealth: s.health_score || 0,
            revenue: s.revenue_today || 0,
            alerts: s.critical_alerts || 0,
          });
          setError(null);
        } else {
          setError('No dashboard data available.');
        }
      } catch (e) {
        setError('Failed to load system data');
      }
      setIsLoading(false);
    };
    loadSystemData();
    const interval = setInterval(loadSystemData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleStreamingToggle = async () => {
    const newState = !streamingOn;
    setStreamingOn(newState);
    await ceoDashboardPost('toggle-streaming', { streaming_enabled: newState });
  };

  const getActiveSection = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path === 'ai-ceo' ? 'dashboard' : path;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a10] via-[#0d0d14] to-[#0a0a10] text-white">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3" />
        <span>Loading CEO Dashboard...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a10] via-[#0d0d14] to-[#0a0a10] text-white">
        <span className="text-red-400 font-bold">{error}</span>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a10] via-[#0d0d14] to-[#0a0a10] text-white flex flex-col">
      <AICEOHeader
        streamingOn={streamingOn}
        onStreamingToggle={handleStreamingToggle}
        systemStats={systemStats}
        isLoading={isLoading}
      />
      <div className="flex flex-1 pt-16">
        <AICEOSidebar
          activeSection={getActiveSection()}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} p-6`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ streamingOn }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AICEODashboard;
