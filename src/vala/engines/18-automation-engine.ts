// @ts-nocheck
// ENGINE 18 — Automation Engine: task graph (DAG), dev-bots, SLA, retries
import type { ValaAIDecision, ValaAutomationTask } from '@/vala/types';

const BOT_POOL = ['bot-refactor', 'bot-deploy', 'bot-test', 'bot-security', 'bot-optimizer'];

function pickBot(action: string): string {
  const map: Record<string, string> = {
    refactor: 'bot-refactor',
    optimize: 'bot-optimizer',
    reprice:  'bot-refactor',
    scale:    'bot-deploy',
  };
  return map[action] ?? BOT_POOL[0];
}

function buildTask(decision: ValaAIDecision, index: number): ValaAutomationTask {
  const taskId = `task_${Date.now().toString(36)}_${index}`;
  return {
    taskId,
    description:  `Execute ${decision.action} via ${decision.executedVia}`,
    devBot:       pickBot(decision.action),
    pipeline:     decision.executedVia,
    slaMs:        decision.action === 'refactor' ? 300_000 : 120_000,
    retries:      2,
    status:       'queued',
  };
}

export function runAutomationEngine(decisions: ValaAIDecision[]): ValaAutomationTask[] {
  // DAG: tasks sorted by priority action
  const priority = ['refactor', 'scale', 'optimize', 'reprice', 'no_action'];
  const sorted = [...decisions].sort(
    (a, b) => priority.indexOf(a.action) - priority.indexOf(b.action),
  );
  return sorted.map(buildTask);
}

export function advanceTask(task: ValaAutomationTask): ValaAutomationTask {
  const next: Record<ValaAutomationTask['status'], ValaAutomationTask['status']> = {
    queued:  'running',
    running: 'done',
    done:    'done',
    failed:  'failed',
  };
  return { ...task, status: next[task.status] };
}
