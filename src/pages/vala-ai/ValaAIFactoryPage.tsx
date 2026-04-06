// @ts-nocheck
import { useState } from 'react';
import { useValaAIStore } from '@/stores/valaAIStore';
import ValaAILayout from '@/components/vala-ai/ValaAILayout';
import ValaAIPipelinePanel from '@/components/vala-ai/ValaAIPipelinePanel';
import ValaAIEngineGrid from '@/components/vala-ai/ValaAIEngineGrid';
import ValaAIBuildConsole from '@/components/vala-ai/ValaAIBuildConsole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Smartphone,
  Monitor,
  Zap,
  RotateCcw,
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuildTarget } from '@/vala/types';

const TARGET_OPTIONS: Array<{ id: BuildTarget; label: string; icon: typeof Globe; desc: string }> = [
  { id: 'web',      label: 'Web',      icon: Globe,       desc: 'Bundle → CDN → Deploy'        },
  { id: 'apk',      label: 'APK',      icon: Smartphone,  desc: 'Gradle → Sign → Export'       },
  { id: 'software', label: 'Software', icon: Monitor,     desc: 'Package → Installer → Release' },
];

function HistoryTab() {
  const { history } = useValaAIStore();
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No completed jobs yet
      </div>
    );
  }
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-base font-semibold text-white">Job History</h2>
      <div className="space-y-2">
        {history.map((job) => (
          <div
            key={job.jobId}
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-900/50 border border-white/5"
          >
            {job.status === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : job.status === 'failed' ? (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{job.idea}</p>
              <p className="text-[10px] text-slate-500">{job.jobId} · {new Date(job.startedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 uppercase">
                {job.target}
              </Badge>
              <Badge className={cn(
                'text-[10px] uppercase',
                job.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20',
              )}>
                {job.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ValaAIFactoryPage() {
  const { startJob, cancelJob, resetPipeline, isRunning, activeTab, activePipeline } = useValaAIStore();
  const [idea, setIdea]     = useState('');
  const [target, setTarget] = useState<BuildTarget>('web');

  async function handleStart() {
    const trimmed = idea.trim();
    if (!trimmed || isRunning) return;
    await startJob(trimmed, target);
  }

  return (
    <ValaAILayout>
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm flex-shrink-0">
          {/* Idea input */}
          <div className="flex-1 max-w-xl">
            <Input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="Describe your idea… e.g. 'marketplace for digital products with wallet'"
              className="bg-slate-900 border-white/10 text-white placeholder:text-slate-600 h-9 text-sm"
              disabled={isRunning}
            />
          </div>

          {/* Target selector */}
          <div className="flex gap-1">
            {TARGET_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTarget(id)}
                disabled={isRunning}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  target === id
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                    : 'text-slate-400 border-white/5 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleStart}
              disabled={isRunning || !idea.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white h-9 gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              {isRunning ? 'Running…' : 'Start Factory'}
            </Button>

            {isRunning && (
              <Button
                size="sm"
                variant="outline"
                onClick={cancelJob}
                className="h-9 border-white/10 text-slate-300 hover:bg-red-500/10 hover:text-red-400 gap-1.5"
              >
                <StopCircle className="w-3.5 h-3.5" />
                Stop
              </Button>
            )}

            {!isRunning && activePipeline && (
              <Button
                size="sm"
                variant="outline"
                onClick={resetPipeline}
                className="h-9 border-white/10 text-slate-400 hover:bg-white/5 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>
        </header>

        {/* Build target description bar */}
        <div className="px-6 py-2 border-b border-white/5 bg-[#090c14]">
          <div className="flex items-center gap-6">
            {TARGET_OPTIONS.map(({ id, desc, icon: Icon }) => (
              <div
                key={id}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-all',
                  target === id ? 'text-violet-300' : 'text-slate-600',
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="uppercase font-medium">{id}:</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content — routed by activeTab */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'pipeline' && (
            <div className="h-full overflow-y-auto">
              <ValaAIPipelinePanel />
            </div>
          )}
          {activeTab === 'engines' && (
            <div className="h-full overflow-y-auto">
              <ValaAIEngineGrid />
            </div>
          )}
          {activeTab === 'console' && (
            <div className="h-full flex flex-col">
              <ValaAIBuildConsole />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="h-full overflow-y-auto">
              <HistoryTab />
            </div>
          )}
        </div>
      </div>
    </ValaAILayout>
  );
}
