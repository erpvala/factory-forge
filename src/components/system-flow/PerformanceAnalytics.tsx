// @ts-nocheck
/**
 * Performance Analytics Panel — L9
 * Aggregated data for CEO/Boss: franchise ratings, reseller conversion, revenue
 */

import { motion } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import {
  BarChart3, TrendingUp, Building2, Star, Target,
  DollarSign, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { PerformanceRecord } from '@/services/systemFlowEngine';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={cn('h-3 w-3', i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600')}
        />
      ))}
      <span className="text-xs text-slate-300 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function PerformanceCard({ rec }: { rec: PerformanceRecord }) {
  const isReseller = rec.entityType === 'reseller';
  const Icon = isReseller ? TrendingUp : Building2;
  const color = isReseller ? 'from-purple-500 to-violet-600' : 'from-orange-500 to-amber-600';
  const tColor = isReseller ? 'text-purple-400' : 'text-orange-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br', color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white capitalize">{rec.entityType}</p>
            <p className="text-xs text-slate-400">{rec.entityId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-bold', tColor)}>#{rec.rank || '—'}</p>
          <p className="text-xs text-slate-400">Rank</p>
        </div>
      </div>

      {/* Rating */}
      <StarRating rating={rec.rating} />

      {/* Revenue + Earnings */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Revenue</p>
          <p className="text-white font-bold">${rec.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Earnings</p>
          <p className="text-green-400 font-bold">${rec.earnings.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Sales</p>
          <p className="text-white font-bold">{rec.sales}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Growth</p>
          <p className={cn('font-bold flex items-center gap-0.5', rec.growth >= 0 ? 'text-green-400' : 'text-red-400')}>
            {rec.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(rec.growth).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Conversion Rate</span>
          <span className="text-white font-medium">{rec.conversionRate.toFixed(1)}%</span>
        </div>
        <Progress value={rec.conversionRate} className="h-1.5" />
        <p className="text-xs text-slate-500">{rec.leadsConverted} / {rec.leadsReceived} leads</p>
      </div>
    </motion.div>
  );
}

export default function PerformanceAnalytics() {
  const performance = useSystemFlowStore(s => s.performance);
  const kpis = useSystemFlowStore(s => s.kpis);
  const leads = useSystemFlowStore(s => s.leads);
  const sales = useSystemFlowStore(s => s.sales);

  const perfList = Object.values(performance);
  const totalRevenue = kpis.totalRevenue;
  const overallConversion = kpis.totalLeads > 0
    ? ((kpis.convertedLeads / kpis.totalLeads) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-400" />
            Performance Analytics — L9
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">CEO / Boss aggregated view · franchise rating · reseller conversion</p>
        </div>
      </div>

      {/* CEO KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue',    value: `$${(totalRevenue / 1000).toFixed(1)}K`,  color: 'text-green-400',  icon: DollarSign },
          { label: 'Conversion Rate',  value: `${overallConversion}%`,                  color: 'text-blue-400',   icon: Target },
          { label: 'Active Resellers', value: kpis.activeResellers.toString(),          color: 'text-purple-400', icon: Users },
          { label: 'Active Franchises',value: kpis.activeFranchises.toString(),         color: 'text-orange-400', icon: Building2 },
        ].map(m => {
          const MIcon = m.icon;
          return (
            <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <MIcon className={cn('h-4 w-4', m.color)} />
              </div>
              <div>
                <p className={cn('text-xl font-bold', m.color)}>{m.value}</p>
                <p className="text-xs text-slate-400">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Period KPI Summary */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-sky-300 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          CEO Dashboard — Aggregated
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            { label: 'Traffic',    value: kpis.totalTraffic.toLocaleString() },
            { label: 'Leads',      value: kpis.totalLeads.toLocaleString() },
            { label: 'Assigned',   value: kpis.assignedLeads.toLocaleString() },
            { label: 'Converted',  value: kpis.convertedLeads.toLocaleString() },
            { label: 'Sales',      value: kpis.totalSales.toLocaleString() },
          ].map(kpi => (
            <div key={kpi.label} className="text-center">
              <p className="text-white font-bold text-sm">{kpi.value}</p>
              <p className="text-slate-400">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Cards */}
      {perfList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {perfList.map(rec => <PerformanceCard key={rec.entityId} rec={rec} />)}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-12 border border-white/10 rounded-xl">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No performance records yet.</p>
          <p className="text-xs text-slate-500 mt-1">Complete sales to populate analytics.</p>
        </div>
      )}
    </div>
  );
}
