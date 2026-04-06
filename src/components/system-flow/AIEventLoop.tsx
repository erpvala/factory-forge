// @ts-nocheck
/**
 * AI Event Loop Monitor — L10
 * Real-time feed of all system events + Vala AI decisions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import {
  Bot, Activity, Zap, AlertTriangle, CheckCircle,
  ArrowRight, Clock, Brain, Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FlowEvent, AIDecision, FlowEventType } from '@/services/systemFlowEngine';

// ─────────────────────────────────────────────────────────────────────────────

const EVENT_STYLE: Partial<Record<FlowEventType, { color: string; label: string }>> = {
  TRAFFIC_INCOMING:      { color: 'text-sky-400',     label: 'Traffic' },
  LEAD_CAPTURED:         { color: 'text-purple-400',  label: 'Lead Captured' },
  LEAD_QUALIFIED:        { color: 'text-indigo-400',  label: 'Lead Qualified' },
  LEAD_ASSIGNED:         { color: 'text-blue-400',    label: 'Lead Assigned' },
  LEAD_REJECTED:         { color: 'text-red-400',     label: 'Lead Rejected' },
  SALE_INITIATED:        { color: 'text-pink-400',    label: 'Sale Initiated' },
  PAYMENT_RECEIVED:      { color: 'text-green-400',   label: 'Payment Received' },
  WALLET_SPLIT:          { color: 'text-emerald-400', label: 'Wallet Split' },
  COMMISSION_CALCULATED: { color: 'text-teal-400',    label: 'Commission Calc.' },
  PAYOUT_SCHEDULED:      { color: 'text-orange-400',  label: 'Payout Scheduled' },
  PAYOUT_COMPLETED:      { color: 'text-amber-400',   label: 'Payout Completed' },
  PAYOUT_APPROVED:       { color: 'text-yellow-400',  label: 'Payout Approved' },
  PERFORMANCE_UPDATED:   { color: 'text-cyan-400',    label: 'Analytics Updated' },
  AI_DECISION:           { color: 'text-violet-400',  label: 'AI Decision' },
  SECURITY_ALERT:        { color: 'text-red-500',     label: 'Security Alert' },
  AUDIT_LOG:             { color: 'text-slate-400',   label: 'Audit Log' },
  INACTIVITY_DETECTED:   { color: 'text-yellow-500',  label: 'Inactivity' },
  CAMPAIGN_TRIGGERED:    { color: 'text-blue-500',    label: 'Campaign' },
};

const AI_ACTION_LABELS: Record<string, string> = {
  assign_lead:       '🎯 Assign Lead',
  notify_user:       '🔔 Notify User',
  trigger_campaign:  '📣 Trigger Campaign',
  optimize_pricing:  '💡 Optimize Pricing',
  send_alert:        '⚡ Send Alert',
  escalate:          '🚨 Escalate',
  auto_approve:      '✅ Auto Approve',
  flag_fraud:        '🚩 Flag Fraud',
};

function EventCard({ event }: { event: FlowEvent }) {
  const style = EVENT_STYLE[event.type] ?? { color: 'text-slate-400', label: event.type };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', style.color.replace('text-', 'bg-'))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs font-semibold', style.color)}>{style.label}</span>
          {event.processedByAI && (
            <span className="bg-violet-500/20 text-violet-300 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <Brain className="h-2.5 w-2.5" />
              {event.aiDecision ? AI_ACTION_LABELS[event.aiDecision] ?? event.aiDecision : 'AI'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {event.sourceId} · {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}

function AIDecisionCard({ decision, index }: { decision: AIDecision; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-violet-300">
          {AI_ACTION_LABELS[decision.action] ?? decision.action}
        </span>
        <span className="text-xs text-slate-400">{(decision.confidence * 100).toFixed(0)}% conf.</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{decision.reasoning}</p>
      <p className="text-xs text-slate-500">{new Date(decision.executedAt).toLocaleString()}</p>
    </motion.div>
  );
}

export default function AIEventLoop() {
  const events = useSystemFlowStore(s => s.getRecentEvents(60));
  const decisions = useSystemFlowStore(s => s.getAIDecisions(12));
  const kpis = useSystemFlowStore(s => s.kpis);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            Vala AI — Automation Loop L10
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Every event → AI reads → AI decides → AI acts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400">Live · {kpis.aiActionsToday} actions today</span>
        </div>
      </div>

      {/* Action types legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(AI_ACTION_LABELS).map(([key, label]) => (
          <span key={key} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-slate-300">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Event Stream */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Live Event Stream
            <span className="text-xs text-slate-500 font-normal">({events.length} recent)</span>
          </h3>
          <div className="bg-black/30 border border-white/10 rounded-xl divide-y divide-white/5 max-h-96 overflow-y-auto">
            {events.length > 0 ? (
              <AnimatePresence>
                {events.map(e => <EventCard key={e.eventId} event={e} />)}
              </AnimatePresence>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No events yet. Run the pipeline.
              </div>
            )}
          </div>
        </div>

        {/* AI Decisions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-400" />
            AI Decisions
            <span className="text-xs text-slate-500 font-normal">({decisions.length} recent)</span>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {decisions.length > 0 ? (
              decisions.map((d, i) => <AIDecisionCard key={d.decisionId} decision={d} index={i} />)
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl py-8 text-center text-slate-500 text-sm">
                No AI decisions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
