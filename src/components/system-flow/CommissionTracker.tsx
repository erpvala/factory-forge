// @ts-nocheck
/**
 * Commission Tracker
 * Displays all commission records — 100% traceable by IDs
 */

import { motion } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import { Calculator, Link, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CommissionRecord } from '@/services/systemFlowEngine';

const STATUS_STYLE: Record<CommissionRecord['status'], { label: string; color: string; icon: React.ComponentType<any> }> = {
  calculated: { label: 'Calculated', color: 'bg-blue-500/20 text-blue-400',   icon: Clock },
  credited:   { label: 'Credited',   color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  reversed:   { label: 'Reversed',   color: 'bg-red-500/20 text-red-400',     icon: XCircle },
};

function CommissionRow({ rec, index }: { rec: CommissionRecord; index: number }) {
  const meta = STATUS_STYLE[rec.status];
  const StatusIcon = meta.icon;
  const total = rec.resellerCommission + rec.franchiseCommission + rec.bossCommission;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">#{rec.commissionId.slice(-8)}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Link className="h-3 w-3" />
            Sale {rec.saleId.slice(-8)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-emerald-400">${total.toFixed(2)}</p>
          <Badge className={cn('text-xs', meta.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {meta.label}
          </Badge>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-slate-400">Reseller</p>
          <p className="text-purple-400 font-bold">${rec.resellerCommission.toFixed(2)}</p>
          <p className="text-slate-500">{rec.commissionRate.reseller}%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-slate-400">Franchise</p>
          <p className="text-orange-400 font-bold">${rec.franchiseCommission.toFixed(2)}</p>
          <p className="text-slate-500">{rec.commissionRate.franchise}%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-slate-400">Boss</p>
          <p className="text-yellow-400 font-bold">${rec.bossCommission.toFixed(2)}</p>
          <p className="text-slate-500">{rec.commissionRate.boss}%</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Sale: ${rec.totalSaleAmount.toLocaleString()}</span>
        <span>Platform: ${rec.platformFee.toFixed(2)}</span>
        <span>{new Date(rec.calculatedAt).toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

export default function CommissionTracker() {
  const commissions = useSystemFlowStore(s => s.commissions);
  const kpis = useSystemFlowStore(s => s.kpis);

  const list = Object.values(commissions).slice(0, 20);
  const totalComm = kpis.totalCommissions;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            Commission Engine — L7
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Every commission 100% traceable by Sale ID → Commission ID → Wallet ID</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-teal-400">${totalComm.toLocaleString()}</p>
          <p className="text-xs text-slate-400">{list.length} commission records</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Reseller Total',  value: `$${Object.values(commissions).reduce((s,c) => s + c.resellerCommission, 0).toFixed(0)}`, color: 'text-purple-400' },
          { label: 'Franchise Total', value: `$${Object.values(commissions).reduce((s,c) => s + c.franchiseCommission, 0).toFixed(0)}`, color: 'text-orange-400' },
          { label: 'Boss Total',      value: `$${Object.values(commissions).reduce((s,c) => s + c.bossCommission, 0).toFixed(0)}`, color: 'text-yellow-400' },
        ].map(st => (
          <div key={st.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className={cn('text-xl font-bold', st.color)}>{st.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{st.label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((rec, i) => <CommissionRow key={rec.commissionId} rec={rec} index={i} />)}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-12 border border-white/10 rounded-xl">
          <Calculator className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No commission records yet.</p>
          <p className="text-xs text-slate-500 mt-1">Run the pipeline to generate commissions.</p>
        </div>
      )}
    </div>
  );
}
