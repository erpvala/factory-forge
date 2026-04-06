// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MMFullSidebar } from './MMFullSidebar';
import { MMAdminDashboardScreen } from './screens/MMAdminDashboardScreen';
import { MMProductControlScreen } from './screens/MMProductControlScreen';
import { MMOpsControlScreen } from './screens/MMOpsControlScreen';

const allowedScreens = new Set(['dashboard', 'products', 'operations']);

export function MMFullLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const screenFromUrl = searchParams.get('screen');
  const [activeScreen, setActiveScreen] = useState(
    screenFromUrl && allowedScreens.has(screenFromUrl) ? screenFromUrl : 'dashboard',
  );

  useEffect(() => {
    if (screenFromUrl && allowedScreens.has(screenFromUrl) && screenFromUrl !== activeScreen) {
      setActiveScreen(screenFromUrl);
    }
  }, [activeScreen, screenFromUrl]);

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('screen', screen);
    setSearchParams(nextParams, { replace: true });
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <MMAdminDashboardScreen />;
      case 'products':
        return <MMProductControlScreen />;
      case 'operations':
        return <MMOpsControlScreen />;
      default:
        return <MMAdminDashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <MMFullSidebar 
        activeScreen={activeScreen} 
        onScreenChange={handleScreenChange} 
      />
      <main className="flex-1 overflow-auto">
        {renderScreen()}
      </main>
    </div>
  );
}
