// @ts-nocheck
import { LayoutGrid, Terminal, GitBranch, History, Cpu, Settings } from 'lucide-react';
import { useValaAIStore } from '@/stores/valaAIStore';
import { cn } from '@/lib/utils';

const NAV = [
  { id: 'pipeline', label: 'Pipeline',    icon: GitBranch },
  { id: 'engines',  label: 'Engines',     icon: Cpu       },
  { id: 'console',  label: 'Console',     icon: Terminal  },
  { id: 'history',  label: 'History',     icon: History   },
] as const;

export default function ValaAISidebar() {
  const { activeTab, setActiveTab, isRunning, activePipeline } = useValaAIStore();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">VALA AI</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Software Factory</p>
          </div>
        </div>

        {/* Status pill */}
        <div className={cn(
          'mt-3 flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full w-fit',
          isRunning
            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
            : activePipeline?.status === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-white/5',
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            isRunning ? 'bg-violet-400 animate-pulse' : activePipeline?.status === 'success' ? 'bg-emerald-400' : 'bg-slate-600',
          )} />
          {isRunning ? 'Running' : activePipeline?.status === 'success' ? 'Complete' : 'Idle'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
              activeTab === id
                ? 'bg-violet-500/15 text-violet-300 font-medium'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Build target info */}
      {activePipeline && (
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[10px] text-slate-500 mb-1">Active Job</p>
          <p className="text-xs text-white truncate">{activePipeline.idea.slice(0, 38)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
              {activePipeline.target}
            </span>
            <span className="text-[10px] text-slate-500">
              {activePipeline.currentEngine}/20
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
