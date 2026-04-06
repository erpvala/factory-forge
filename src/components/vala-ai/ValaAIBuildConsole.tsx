// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useValaAIStore } from '@/stores/valaAIStore';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function ValaAIBuildConsole() {
  const { logs, clearLogs, isRunning } = useValaAIStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as logs stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  function colorize(line: string): string {
    if (line.includes('✔') || line.includes('complete') || line.includes('COMPLETE'))  return 'text-emerald-400';
    if (line.includes('✘') || line.includes('FAILED') || line.includes('error'))       return 'text-red-400';
    if (line.includes('ENGINE'))                                                         return 'text-violet-300 font-semibold';
    if (line.includes('→'))                                                              return 'text-cyan-300';
    if (line.includes('WARNING') || line.includes('warn'))                               return 'text-yellow-400';
    return 'text-slate-400';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <p className="text-xs text-slate-400 ml-2 font-mono">vala-factory-console</p>
          {isRunning && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse ml-2" />
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-slate-500 hover:text-white hover:bg-white/5"
          onClick={clearLogs}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[11px] leading-5 space-y-0.5 bg-[#090c14]">
        {logs.length === 0 ? (
          <p className="text-slate-600">Waiting for pipeline to start...</p>
        ) : (
          logs.map((line, i) => (
            <p key={i} className={colorize(line)}>
              {line}
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
