// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ValaFactoryPipeline,
  ValaEngineState,
  ValaJobRequest,
  BuildTarget,
  PipelineStatus,
  ENGINE_REGISTRY,
} from '@/vala/types';
import { ENGINE_REGISTRY as ENGINES } from '@/vala/types';
import {
  runValaFactory,
  webPipeline,
  apkPipeline,
  softwarePipeline,
} from '@/vala/factory-engine';

async function logValaAction(action: string, payload: Record<string, unknown> = {}) {
  try {
    await fetch('/api/v1/vala-ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    // Flow logging should be best-effort.
  }
}

// ─── Job History Entry ────────────────────────────────────────────────────────
export interface ValaJobHistoryEntry {
  jobId:       string;
  idea:        string;
  target:      BuildTarget;
  status:      PipelineStatus;
  startedAt:   string;
  completedAt: string | null;
}

// ─── Store State ──────────────────────────────────────────────────────────────
interface ValaAIState {
  // Active pipeline
  activePipeline: ValaFactoryPipeline | null;
  engineStates:   ValaEngineState[];
  logs:           string[];
  isRunning:      boolean;

  // History
  history:        ValaJobHistoryEntry[];

  // UI state
  activeTab:      'pipeline' | 'engines' | 'console' | 'history';
  selectedEngine: number | null;

  // Actions
  startJob:        (idea: string, target: BuildTarget, userId?: string) => Promise<void>;
  cancelJob:       () => void;
  resetPipeline:   () => void;
  setActiveTab:    (tab: ValaAIState['activeTab']) => void;
  setSelectedEngine: (id: number | null) => void;
  clearLogs:       () => void;

  // Live callbacks (used by factory engine, not persisted)
  _onEngineUpdate: (engineId: number, state: ValaEngineState) => void;
  _onLog:          (line: string) => void;
}

// ─── Initial Engine States ────────────────────────────────────────────────────
function makeInitialEngineStates(): ValaEngineState[] {
  return ENGINES.map((e) => ({ id: e.id, name: e.name, status: 'dormant' }));
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useValaAIStore = create<ValaAIState>()(
  persist(
    (set, get) => ({
      activePipeline:  null,
      engineStates:    makeInitialEngineStates(),
      logs:            [],
      isRunning:       false,
      history:         [],
      activeTab:       'pipeline',
      selectedEngine:  null,

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSelectedEngine: (id) => set({ selectedEngine: id }),

      clearLogs: () => set({ logs: [] }),

      _onEngineUpdate: (engineId, state) => {
        set((s) => ({
          engineStates: s.engineStates.map((e) => (e.id === engineId ? state : e)),
          activePipeline: s.activePipeline
            ? {
                ...s.activePipeline,
                currentEngine: engineId,
                engines: s.activePipeline.engines.map((e) =>
                  e.id === engineId ? state : e,
                ),
              }
            : null,
        }));
      },

      _onLog: (line) => {
        set((s) => ({
          logs: [...s.logs.slice(-499), line], // keep last 500 lines
          activePipeline: s.activePipeline
            ? { ...s.activePipeline, logs: [...(s.activePipeline.logs ?? []).slice(-499), line] }
            : null,
        }));
      },

      startJob: async (idea, target, userId) => {
        if (get().isRunning) return;

        const request: ValaJobRequest =
          target === 'apk'
            ? apkPipeline(idea, userId)
            : target === 'software'
              ? softwarePipeline(idea, userId)
              : webPipeline(idea, userId);

        set({
          isRunning:      true,
          logs:           [],
          engineStates:   makeInitialEngineStates(),
          activePipeline: {
            jobId:         request.jobId,
            idea:          request.idea,
            target:        request.target,
            status:        'running',
            currentEngine: 1,
            engines:       makeInitialEngineStates(),
            logs:          [],
            startedAt:     new Date().toISOString(),
            completedAt:   null,
          },
        });

        void logValaAction('start', { job_id: request.jobId, target: request.target, idea: request.idea });

        try {
          const result = await runValaFactory(
            request,
            get()._onEngineUpdate,
            get()._onLog,
          );

          set((s) => ({
            activePipeline: result,
            isRunning:      false,
            history: [
              {
                jobId:       result.jobId,
                idea:        result.idea,
                target:      result.target,
                status:      result.status,
                startedAt:   result.startedAt,
                completedAt: result.completedAt ?? null,
              },
              ...s.history.slice(0, 49), // keep last 50
            ],
          }));
          void logValaAction('complete', {
            job_id: result.jobId,
            target: result.target,
            status: result.status,
            completed_at: result.completedAt ?? null,
          });
        } catch {
          set({ isRunning: false });
          void logValaAction('failed', { job_id: request.jobId, target: request.target });
        }
      },

      cancelJob: () => {
        const active = get().activePipeline;
        set((s) => ({
          isRunning: false,
          activePipeline: s.activePipeline
            ? { ...s.activePipeline, status: 'failed', completedAt: new Date().toISOString() }
            : null,
        }));
        void logValaAction('stop', { job_id: active?.jobId || null });
      },

      resetPipeline: () => {
        set({
          activePipeline: null,
          engineStates:   makeInitialEngineStates(),
          logs:           [],
          isRunning:      false,
        });
        void logValaAction('reset', {});
      },
    }),
    {
      name:    'vala-ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        history:    s.history,
        activeTab:  s.activeTab,
      }),
    },
  ),
);
