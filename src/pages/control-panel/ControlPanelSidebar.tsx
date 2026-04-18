// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Brain, Bot, Server, Cpu, Code2, Package, MonitorPlay,
  ListTodo, HandshakeIcon, FolderOpen, Megaphone, Search, Target, ShoppingCart,
  Headphones, Building2, Store, Users, Globe, MapPin, DollarSign, Scale,
  Terminal, Crown, User, Shield, Settings, ShoppingBag, KeyRound, Monitor,
  Rocket, BarChart3, Bell, Plug, FileSearch, ChevronLeft, ChevronRight, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ControlPanelModule } from './ControlPanelPage';

interface ControlPanelSidebarProps {
  activeModule: ControlPanelModule;
  onModuleChange: (mod: ControlPanelModule) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}

const MENU_ITEMS: { id: ControlPanelModule; label: string; icon: React.ElementType; group: string }[] = [
  // Core
  { id: 'boss-dashboard', label: 'Boss Dashboard', icon: LayoutDashboard, group: 'Core' },
  { id: 'ceo-dashboard', label: 'CEO Dashboard', icon: Crown, group: 'Core' },
  { id: 'vala-ai', label: 'VALA AI', icon: Brain, group: 'Core' },
  // Infrastructure
  { id: 'server-manager', label: 'Server Manager', icon: Server, group: 'Infrastructure' },
  { id: 'ai-api-manager', label: 'AI & API Manager', icon: Cpu, group: 'Infrastructure' },
  { id: 'deployment-manager', label: 'Deployment Manager', icon: Rocket, group: 'Infrastructure' },
  // Development
  { id: 'development-manager', label: 'Dev Manager', icon: Code2, group: 'Development' },
  { id: 'developer-dashboard', label: 'Developer Dashboard', icon: Terminal, group: 'Development' },
  // Product
  { id: 'product-manager', label: 'Product Manager', icon: Package, group: 'Product' },
  { id: 'demo-manager', label: 'Demo Manager', icon: MonitorPlay, group: 'Product' },
  { id: 'demo-system-manager', label: 'Demo System', icon: Monitor, group: 'Product' },
  // Operations
  { id: 'task-manager', label: 'Task Manager', icon: ListTodo, group: 'Operations' },
  { id: 'promise-tracker', label: 'Promise Tracker', icon: HandshakeIcon, group: 'Operations' },
  { id: 'asset-manager', label: 'Asset Manager', icon: FolderOpen, group: 'Operations' },
  { id: 'hr-manager', label: 'HR Manager', icon: UserCog, group: 'Operations' },
  // Marketing & Sales
  { id: 'marketing-manager', label: 'Marketing', icon: Megaphone, group: 'Marketing' },
  { id: 'seo-manager', label: 'SEO Manager', icon: Search, group: 'Marketing' },
  { id: 'lead-manager', label: 'Lead Manager', icon: Target, group: 'Marketing' },
  { id: 'sales-manager', label: 'Sales Manager', icon: ShoppingCart, group: 'Marketing' },
  { id: 'customer-support', label: 'Customer Support', icon: Headphones, group: 'Marketing' },
  // Partners
  { id: 'franchise-manager', label: 'Franchise Manager', icon: Building2, group: 'Partners' },
  { id: 'reseller-manager', label: 'Reseller Manager', icon: Store, group: 'Partners' },
  { id: 'influencer-manager', label: 'Influencer Manager', icon: Users, group: 'Partners' },
  // Regional
  { id: 'continent-admin', label: 'Continent Admin', icon: Globe, group: 'Regional' },
  { id: 'country-admin', label: 'Country Admin', icon: MapPin, group: 'Regional' },
  // Finance & Legal
  { id: 'finance-manager', label: 'Finance', icon: DollarSign, group: 'Finance' },
  { id: 'legal-manager', label: 'Legal', icon: Scale, group: 'Finance' },
  // Users
  { id: 'pro-manager', label: 'Pro Manager', icon: Crown, group: 'Users' },
  { id: 'user-dashboard', label: 'User Dashboard', icon: User, group: 'Users' },
  // System
  { id: 'marketplace-manager', label: 'Marketplace', icon: ShoppingBag, group: 'System' },
  { id: 'license-manager', label: 'License Manager', icon: KeyRound, group: 'System' },
  { id: 'security-manager', label: 'Security', icon: Shield, group: 'System' },
  { id: 'analytics-manager', label: 'Analytics', icon: BarChart3, group: 'System' },
  { id: 'notification-manager', label: 'Notifications', icon: Bell, group: 'System' },
  { id: 'integration-manager', label: 'Integrations', icon: Plug, group: 'System' },
  { id: 'audit-logs-manager', label: 'Audit Logs', icon: FileSearch, group: 'System' },
  { id: 'system-settings', label: 'Settings', icon: Settings, group: 'System' },
];

const SIDEBAR_BG = 'linear-gradient(180deg, #0a1628 0%, #0d1b2a 100%)';
const BORDER_COLOR = '#1e3a5f';
const ACTIVE_COLOR = '#2563eb';

export function ControlPanelSidebar({ activeModule, onModuleChange, collapsed, onCollapsedChange }: ControlPanelSidebarProps) {
  let lastGroup = '';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col"
      style={{ background: SIDEBAR_BG, borderRight: `1px solid ${BORDER_COLOR}` }}
    >
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-6 flex items-center justify-center rounded-full"
        style={{ width: 24, height: 24, background: ACTIVE_COLOR, border: '2px solid white', color: 'white' }}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;

          return (
            <React.Fragment key={item.id}>
              {showGroup && !collapsed && (
                <div className="text-[9px] font-semibold uppercase tracking-wider text-white/30 px-3 pt-3 pb-1">
                  {item.group}
                </div>
              )}
              <button
                onClick={() => onModuleChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left',
                  collapsed && 'justify-center px-0'
                )}
                style={{
                  background: isActive ? ACTIVE_COLOR : 'transparent',
                  color: '#ffffff',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#fff' : '#60a5fa' }} />
                {!collapsed && (
                  <span className="truncate text-xs font-medium">{item.label}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 text-center" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <div className="text-[9px] uppercase tracking-widest text-white/40">Control Panel v2.0</div>
        </div>
      )}
    </motion.aside>
  );
}
