// @ts-nocheck
import { CheckCircle, XCircle, Loader2, Circle, ChevronRight } from 'lucide-react';
import { useValaAIStore } from '@/stores/valaAIStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  dormant:  'text-slate-500',
  active:   'text-violet-300',
  complete: 'text-emerald-400',
  error:    'text-red-400',
};

function StepIcon({ status }: { status: string }) {
  if (status === 'active')   return <Loader2   className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />;
  if (status === 'complete') return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  if (status === 'error')    return <XCircle    className="w-4 h-4 text-red-400 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-slate-700 flex-shrink-0" />;
}

export default function ValaAIPipelinePanel() {
  const { activePipeline, engineStates, isRunning } = useValaAIStore();

  if (!activePipeline) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No active pipeline — submit an idea to start
      </div>
    );
  }

  const overallStatus = activePipeline.status;
  const completedCount = engineStates.filter((e) => e.status === 'complete').length;
  const hardRules = activePipeline.hardRules;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Active Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{activePipeline.idea}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={cn(
            'text-[10px] uppercase',
            overallStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            overallStatus === 'failed'  ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            overallStatus === 'running' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
            'bg-slate-800 text-slate-500 border-white/10',
          )}>
            {overallStatus}
          </Badge>
          <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 uppercase">
            {activePipeline.target}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            overallStatus === 'success' ? 'bg-emerald-500' :
            overallStatus === 'failed'  ? 'bg-red-500' :
            'bg-gradient-to-r from-violet-500 to-cyan-500',
          )}
          style={{ width: `${(completedCount / 20) * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500">{completedCount} / 20 engines complete</p>

      {hardRules && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: 'Idempotent', ok: hardRules.idempotentOperations },
            { label: 'Saga', ok: hardRules.sagaTransactions === 'committed' },
            { label: 'UUID', ok: hardRules.uuidEverywhere },
            { label: 'Zero 404', ok: hardRules.zero404 },
            { label: 'Test Gate', ok: hardRules.changesTestedBeforeRelease },
          ].map((rule) => (
            <div
              key={rule.label}
              className={cn(
                'rounded-md border px-2.5 py-2',
                rule.ok
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20',
              )}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{rule.label}</p>
              <p className={cn('text-xs font-medium', rule.ok ? 'text-emerald-300' : 'text-red-300')}>
                {rule.ok ? 'PASS' : 'FAIL'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Engine steps list */}
      <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {engineStates.map((eng) => (
          <div
            key={eng.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
              eng.status === 'active'   ? 'bg-violet-500/10 border border-violet-500/20' :
              eng.status === 'complete' ? 'bg-emerald-500/5  border border-emerald-500/10' :
              eng.status === 'error'    ? 'bg-red-500/10     border border-red-500/20' :
              'border border-transparent',
            )}
          >
            <StepIcon status={eng.status} />
            <span className="text-[11px] text-slate-400 w-5 flex-shrink-0">
              {String(eng.id).padStart(2, '0')}
            </span>
            <span className={cn('text-sm flex-1 truncate', STATUS_STYLE[eng.status])}>
              {eng.name}
            </span>
            {eng.status === 'active' && (
              <ChevronRight className="w-3 h-3 text-violet-400 animate-pulse" />
            )}
            {eng.error && (
              <span className="text-[10px] text-red-400 truncate max-w-32">{eng.error}</span>
            )}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      {overallStatus === 'success' && activePipeline.build && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
          {[
            { label: 'Artifact',  value: activePipeline.build.artifact       },
            { label: 'Size',      value: `${activePipeline.build.sizeMb} MB` },
            { label: 'Duration',  value: `${((activePipeline.build.durationMs ?? 0)/1000).toFixed(1)}s` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-xs text-white font-medium truncate">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
