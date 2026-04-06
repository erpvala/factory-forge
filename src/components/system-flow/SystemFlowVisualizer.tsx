// @ts-nocheck
/**
 * System Flow Visualizer
 * Visual pipeline diagram showing all 12 layers with live health/throughput
 */

import { motion } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import { cn } from '@/lib/utils';
import {
  Crown, Brain, TrendingUp, Megaphone, Users, Store,
  ShoppingCart, Wallet, Calculator, Banknote, BarChart3,
  Bot, Shield, Database, ChevronRight, Activity, Zap, AlertTriangle
} from 'lucide-react';
import type { FlowLayer } from '@/services/systemFlowEngine';

// ─────────────────────────────────────────────────────────────────────────────

const LAYER_META: {
  layer: FlowLayer;
  label: string;
  sublabel: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
}[] = [
  { layer: 'CONTROL',      label: 'L1: Control',      sublabel: 'Boss / CEO / Vala AI',    icon: Crown,       color: 'from-yellow-500 to-amber-500',  gradient: 'bg-yellow-500/10 border-yellow-500/30' },
  { layer: 'ACQUISITION',  label: 'L2: Acquisition',  sublabel: 'SEO / Marketing',         icon: Megaphone,   color: 'from-blue-500 to-cyan-500',     gradient: 'bg-blue-500/10 border-blue-500/30' },
  { layer: 'LEAD_ENGINE',  label: 'L3: Lead Engine',  sublabel: 'Capture / Qualify / ID',  icon: Users,       color: 'from-purple-500 to-violet-500', gradient: 'bg-purple-500/10 border-purple-500/30' },
  { layer: 'DISTRIBUTION', label: 'L4: Distribution', sublabel: 'Reseller / Franchise',    icon: TrendingUp,  color: 'from-indigo-500 to-blue-500',   gradient: 'bg-indigo-500/10 border-indigo-500/30' },
  { layer: 'PRODUCT',      label: 'L5: Product',      sublabel: 'Marketplace 10K+',        icon: Store,       color: 'from-pink-500 to-rose-500',     gradient: 'bg-pink-500/10 border-pink-500/30' },
  { layer: 'TRANSACTION',  label: 'L6: Transaction',  sublabel: 'Order / Wallet Split',    icon: ShoppingCart,color: 'from-green-500 to-emerald-500', gradient: 'bg-green-500/10 border-green-500/30' },
  { layer: 'COMMISSION',   label: 'L7: Commission',   sublabel: '100% Traceable',          icon: Calculator,  color: 'from-teal-500 to-cyan-500',     gradient: 'bg-teal-500/10 border-teal-500/30' },
  { layer: 'PAYOUT',       label: 'L8: Payout',       sublabel: 'Daily/Weekly/Monthly',    icon: Banknote,    color: 'from-orange-500 to-amber-500',  gradient: 'bg-orange-500/10 border-orange-500/30' },
  { layer: 'ANALYTICS',    label: 'L9: Analytics',    sublabel: 'CEO / Franchise / Perf.', icon: BarChart3,   color: 'from-sky-500 to-blue-500',      gradient: 'bg-sky-500/10 border-sky-500/30' },
  { layer: 'AI_LOOP',      label: 'L10: AI Loop',     sublabel: 'Vala AI Auto-Decisions',  icon: Bot,         color: 'from-violet-500 to-purple-500', gradient: 'bg-violet-500/10 border-violet-500/30' },
  { layer: 'SECURITY',     label: 'L11: Security',    sublabel: 'RBAC / Geo / Audit',      icon: Shield,      color: 'from-red-500 to-rose-500',      gradient: 'bg-red-500/10 border-red-500/30' },
  { layer: 'DATA',         label: 'L12: Data',        sublabel: 'ID Linked / No Dup.',     icon: Database,    color: 'from-slate-400 to-gray-400',    gradient: 'bg-slate-500/10 border-slate-500/30' },
];

function StatusDot({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      status === 'healthy' ? 'bg-green-400' :
      status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
    )} />
  );
}

export default function SystemFlowVisualizer() {
  const flowHealth = useSystemFlowStore(s => s.flowHealth);
  const kpis = useSystemFlowStore(s => s.kpis);

  const healthMap: Partial<Record<FlowLayer, (typeof flowHealth)[0]>> = Object.fromEntries(
    flowHealth.map(h => [h.layer, h])
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            System Flow — 12 Layers Live
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            End-to-end pipeline · zero dead flow · {kpis.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} total revenue
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Warning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Critical</span>
        </div>
      </div>

      {/* Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {LAYER_META.map((meta, i) => {
          const health = healthMap[meta.layer];
          const Icon = meta.icon;
          return (
            <motion.div
              key={meta.layer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'rounded-xl border p-4 flex items-start gap-3',
                meta.gradient,
              )}
            >
              {/* Icon */}
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                meta.color,
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white truncate">{meta.label}</span>
                  {health && <StatusDot status={health.status} />}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{meta.sublabel}</p>
                {health && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-cyan-400" />
                      {health.throughput.toLocaleString()}/s
                    </span>
                    <span>{health.latency}ms</span>
                  </div>
                )}
              </div>

              {/* Arrow for all except last */}
              {i < LAYER_META.length - 1 && (
                <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0 self-center hidden xl:block" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mt-2">
        {[
          { label: 'Traffic',    value: kpis.totalTraffic.toLocaleString(),   color: 'text-blue-400' },
          { label: 'Leads',      value: kpis.totalLeads.toLocaleString(),      color: 'text-purple-400' },
          { label: 'Converted',  value: kpis.convertedLeads.toLocaleString(),  color: 'text-green-400' },
          { label: 'Revenue',    value: `$${(kpis.totalRevenue / 1000).toFixed(1)}K`, color: 'text-emerald-400' },
          { label: 'Commission', value: `$${(kpis.totalCommissions / 1000).toFixed(1)}K`, color: 'text-teal-400' },
          { label: 'AI Actions', value: kpis.aiActionsToday.toLocaleString(), color: 'text-violet-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className={cn('text-lg font-bold', kpi.color)}>{kpi.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
