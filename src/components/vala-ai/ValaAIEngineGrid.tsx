// @ts-nocheck
import { CheckCircle, XCircle, Loader, Circle } from 'lucide-react';
import { useValaAIStore } from '@/stores/valaAIStore';
import { ENGINE_REGISTRY } from '@/vala/types';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  design:   'text-violet-400 border-violet-500/30 bg-violet-500/5',
  build:    'text-blue-400   border-blue-500/30   bg-blue-500/5',
  quality:  'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  deploy:   'text-cyan-400   border-cyan-500/30   bg-cyan-500/5',
  ops:      'text-orange-400 border-orange-500/30 bg-orange-500/5',
  optimize: 'text-green-400  border-green-500/30  bg-green-500/5',
  data:     'text-pink-400   border-pink-500/30   bg-pink-500/5',
  ai:       'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'active')   return <Loader    className="w-4 h-4 text-violet-400 animate-spin" />;
  if (status === 'complete') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === 'error')    return <XCircle    className="w-4 h-4 text-red-400" />;
  return <Circle className="w-4 h-4 text-slate-600" />;
}

export default function ValaAIEngineGrid() {
  const { engineStates, setSelectedEngine, selectedEngine } = useValaAIStore();

  // Group by category
  const categories = [...new Set(ENGINE_REGISTRY.map((e) => e.category))];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-base font-semibold text-white">20 Engine Grid</h2>

      {categories.map((cat) => {
        const engines = ENGINE_REGISTRY.filter((e) => e.category === cat);
        const colorClass = CATEGORY_COLORS[cat] ?? 'text-slate-400 border-white/10 bg-white/5';

        return (
          <div key={cat}>
            <p className={cn('text-[10px] font-semibold uppercase tracking-widest mb-2', colorClass.split(' ')[0])}>
              {cat}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {engines.map((eng) => {
                const state = engineStates.find((s) => s.id === eng.id);
                const status = state?.status ?? 'dormant';
                const isSelected = selectedEngine === eng.id;

                return (
                  <button
                    key={eng.id}
                    onClick={() => setSelectedEngine(isSelected ? null : eng.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all',
                      colorClass,
                      isSelected ? 'ring-1 ring-violet-500' : 'hover:brightness-125',
                      status === 'active' && 'animate-pulse',
                    )}
                  >
                    <StatusIcon status={status} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 leading-none">#{String(eng.id).padStart(2, '0')}</p>
                      <p className="text-xs text-white truncate">{eng.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
