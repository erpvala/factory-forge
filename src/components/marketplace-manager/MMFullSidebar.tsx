// @ts-nocheck
import React from 'react';
import {
  LayoutGrid,
  Boxes,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MMFullSidebarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutGrid },
  { id: 'products', label: 'Product Control', icon: Boxes },
  { id: 'operations', label: 'Ops and AI Loop', icon: Activity },
];

export function MMFullSidebar({ activeScreen, onScreenChange }: MMFullSidebarProps) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">Marketplace Manager</h2>
            <p className="text-xs text-cyan-300">Admin Control Core</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="p-3 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="text-xs text-cyan-300">Governance Layer</span>
          </div>
          <p className="text-sm text-slate-300">Approval flow + rollback</p>
          <p className="text-sm text-slate-300">Bulk control + refund governance</p>
          <p className="text-sm text-slate-300">SEO + Lead + Support + AI</p>
        </div>
      </div>
    </div>
  );
}
