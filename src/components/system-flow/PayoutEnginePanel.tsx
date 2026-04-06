// @ts-nocheck
/**
 * Payout Engine Panel — L8
 * Shows pending payouts, boss approval flow, cycle controls
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import {
  Banknote, Clock, CheckCircle, XCircle, Crown, TrendingUp,
  Building2, Zap, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PayoutRecord, PayoutStatus, PayoutCycle } from '@/services/systemFlowEngine';

const STATUS_STYLE: Record<PayoutStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-500/20 text-yellow-400',  icon: Clock },
  approved:   { label: 'Approved',   color: 'bg-blue-500/20 text-blue-400',      icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-cyan-500/20 text-cyan-400',      icon: Zap },
  completed:  { label: 'Completed',  color: 'bg-green-500/20 text-green-400',    icon: CheckCircle },
  failed:     { label: 'Failed',     color: 'bg-red-500/20 text-red-400',        icon: XCircle },
};

const OWNER_ICONS: Record<string, React.ComponentType<any>> = {
  reseller:  TrendingUp,
  franchise: Building2,
  boss:      Crown,
  user:      Clock,
};

const CYCLE_LABELS: Record<PayoutCycle, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function PayoutCard({ payout, onApprove, onExecute }: {
  payout: PayoutRecord;
  onApprove: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const meta = STATUS_STYLE[payout.status];
  const StatusIcon = meta.icon;
  const OwnerIcon = OWNER_ICONS[payout.ownerType] ?? Clock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <OwnerIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white capitalize">{payout.ownerType}</p>
            <p className="text-xs text-slate-400">{payout.ownerId.slice(0, 16)}</p>
          </div>
        </div>
        <Badge className={cn('text-xs', meta.color)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {meta.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">${payout.amount.toFixed(2)}</p>
          <p className="text-xs text-slate-400">
            {CYCLE_LABELS[payout.cycle]} · Due {new Date(payout.scheduledFor).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>#{payout.payoutId.slice(-8)}</p>
          <p>Comm {payout.commissionId.slice(-8)}</p>
        </div>
      </div>

      {payout.approvedBy && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Approved by boss · {new Date(payout.approvedAt!).toLocaleString()}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {payout.status === 'pending' && (
          <Button
            size="sm"
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30"
            onClick={() => onApprove(payout.payoutId)}
          >
            <Crown className="h-3 w-3 mr-1" />
            Boss Approve
          </Button>
        )}
        {payout.status === 'approved' && (
          <Button
            size="sm"
            className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/30"
            onClick={() => onExecute(payout.payoutId)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Execute
          </Button>
        )}
        {payout.status === 'completed' && (
          <p className="text-xs text-green-400 flex items-center gap-1 flex-1">
            <CheckCircle className="h-3 w-3" />
            Completed {payout.completedAt ? new Date(payout.completedAt).toLocaleDateString() : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function PayoutEnginePanel() {
  const payouts = useSystemFlowStore(s => s.payouts);
  const kpis = useSystemFlowStore(s => s.kpis);
  const approvePayout = useSystemFlowStore(s => s.approvePayout);
  const executePayout = useSystemFlowStore(s => s.executePayout);

  const [filterStatus, setFilterStatus] = useState<PayoutStatus | 'all'>('all');
  const [filterCycle, setFilterCycle] = useState<PayoutCycle | 'all'>('all');

  const list = Object.values(payouts).filter(p => {
    const statusOk = filterStatus === 'all' || p.status === filterStatus;
    const cycleOk = filterCycle === 'all' || p.cycle === filterCycle;
    return statusOk && cycleOk;
  });

  const pending = Object.values(payouts).filter(p => p.status === 'pending').length;
  const approved = Object.values(payouts).filter(p => p.status === 'approved').length;
  const completed = Object.values(payouts).filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="h-5 w-5 text-orange-400" />
            Payout Engine — L8
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Commission → Wallet Credit · Boss-approval for large payouts</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-400">${kpis.pendingPayouts.toLocaleString()}</p>
          <p className="text-xs text-slate-400">pending payout volume</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending',   value: pending,   color: 'text-yellow-400' },
          { label: 'Approved',  value: approved,  color: 'text-blue-400' },
          { label: 'Completed', value: completed, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
          <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-xs h-8">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCycle} onValueChange={v => setFilterCycle(v as any)}>
          <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-xs h-8">
            <RefreshCw className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payout Cards */}
      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {list.slice(0, 18).map(p => (
              <PayoutCard
                key={p.payoutId}
                payout={p}
                onApprove={id => approvePayout(id, 'boss-user-001')}
                onExecute={id => executePayout(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center text-slate-400 py-12 border border-white/10 rounded-xl">
          <Banknote className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No payouts match the current filter.</p>
        </div>
      )}
    </div>
  );
}
