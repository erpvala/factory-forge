// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Bot,
  Network, 
  Users, 
  Shield, 
  Boxes,
  Package,
  DollarSign,
  FileSearch,
  Lock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Code2,
  Server,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BOSS_PANEL_SECTIONS, type BossPanelSection } from '@/config/bossPanelRegistry';

interface BossPanelSidebarProps {
  activeSection: BossPanelSection;
  onSectionChange: (section: BossPanelSection) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const sectionIcons: Record<BossPanelSection, React.ElementType> = {
  'full-auto': Bot,
  'live-activity': Activity,
  hierarchy: Network,
  'super-admins': Users,
  roles: Shield,
  modules: Boxes,
  products: Package,
  'vala-ai': Brain,
  revenue: DollarSign,
  audit: FileSearch,
  security: Lock,
  codepilot: Code2,
  'server-hosting': Server,
  settings: Settings,
};

// ===== LOCKED COLORS: Dark Navy Blue Sidebar =====
// DO NOT CHANGE - Final approved color scheme
const SIDEBAR_COLORS = {
  bg: '#0a1628',           // Dark Navy background
  bgGradient: 'linear-gradient(180deg, #0a1628 0%, #0d1b2a 100%)',
  border: '#1e3a5f',       // Navy border
  activeHighlight: '#2563eb', // Bright Blue active state
  hoverBg: 'rgba(37, 99, 235, 0.15)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  iconColor: '#60a5fa',    // Soft blue icons
};

export function BossPanelSidebar({ 
  activeSection, 
  onSectionChange, 
  collapsed, 
  onCollapsedChange 
}: BossPanelSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 200 : 260 }}
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col"
      style={{ 
        background: SIDEBAR_COLORS.bgGradient,
        borderRight: `1px solid ${SIDEBAR_COLORS.border}`,
      }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-6 flex items-center justify-center transition-colors rounded-full"
        style={{
          width: '24px',
          height: '24px',
          background: SIDEBAR_COLORS.activeHighlight,
          border: '2px solid white',
          color: 'white'
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {BOSS_PANEL_SECTIONS.map((section) => {
          const Icon = sectionIcons[section.id];
          const isActive = activeSection === section.id;
          
          return (
            <motion.button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left"
              )}
              style={{
                background: isActive ? SIDEBAR_COLORS.activeHighlight : 'transparent',
                color: SIDEBAR_COLORS.text,
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? '#ffffff' : SIDEBAR_COLORS.iconColor }} />
              <span className="truncate text-sm font-medium" style={{ color: SIDEBAR_COLORS.text }}>
                {section.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: `1px solid ${SIDEBAR_COLORS.border}` }}>
        <div className="text-center uppercase tracking-widest text-[10px]" style={{ color: SIDEBAR_COLORS.textMuted }}>
          Boss Role Principle
        </div>
        <div className="text-center mt-1 text-[9px]" style={{ color: SIDEBAR_COLORS.text }}>
          See Everything • Change Nothing Casually
        </div>
      </div>
    </motion.aside>
  );
}
