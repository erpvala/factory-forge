// @ts-nocheck
import React, { useState } from 'react';
import { BossPanelHeader } from './BossPanelHeader';
import { BossPanelSidebar } from './BossPanelSidebar';
import { BossPanelContent } from './BossPanelContent';

export type BossPanelSection = 
  | 'full-auto'
  | 'live-activity'
  | 'hierarchy'
  | 'super-admins'
  | 'roles'
  | 'modules'
  | 'products'
  | 'revenue'
  | 'audit'
  | 'security'
  | 'codepilot'
  | 'server-hosting'
  | 'vala-ai'
  | 'settings';

interface BossPanelLayoutProps {
  children?: React.ReactNode;
}

// LOCKED: Background #0B0F1A, text #FFFFFF
export function BossPanelLayout({ children }: BossPanelLayoutProps) {
  const [activeSection, setActiveSection] = useState<BossPanelSection>('full-auto');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [streamingOn, setStreamingOn] = useState(true);

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        background: '#F8FAFC',
        color: '#1E293B'
      }}
    >
      {/* Fixed Global Header - LOCKED 64px */}
      <BossPanelHeader 
        streamingOn={streamingOn}
        onStreamingToggle={() => setStreamingOn(!streamingOn)}
      />

      <div className="flex flex-1" style={{ paddingTop: '64px' }}>
        {/* Left Sidebar - LOCKED 260px/80px */}
        <BossPanelSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main 
          className="flex-1 p-6 transition-all duration-300"
          style={{ 
            marginLeft: sidebarCollapsed ? '80px' : '260px',
            background: '#F8FAFC'
          }}
        >
          {children || <BossPanelContent activeSection={activeSection} streamingOn={streamingOn} />}
        </main>
      </div>
    </div>
  );
}
