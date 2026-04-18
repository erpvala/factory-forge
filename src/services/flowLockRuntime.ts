// @ts-nocheck

const FLOW_KEY = 'flow_lock_runtime';

interface FlowRecord {
  id: string;
  module: string;
  action: string;
  steps: string[];
  startedAt: string;
  status: 'open' | 'failed' | 'completed';
  reason?: string;
}

const readFlows = (): FlowRecord[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FLOW_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFlows = (flows: FlowRecord[]) => {
  localStorage.setItem(FLOW_KEY, JSON.stringify(flows.slice(-200)));
};

const emit = (type: string, detail: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(type, { detail }));
};

export const beginFlow = (module: string, action: string) => {
  const id = `${module}:${action}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const flows = readFlows();
  flows.push({
    id,
    module,
    action,
    steps: ['ui'],
    startedAt: new Date().toISOString(),
    status: 'open',
  });
  writeFlows(flows);
  emit('sv:flow-begin', { id, module, action });
  return id;
};

export const markFlowStep = (flowId: string, step: 'api' | 'db' | 'event' | 'ui-refresh') => {
  const flows = readFlows();
  const idx = flows.findIndex((flow) => flow.id === flowId);
  if (idx < 0) return;

  const current = flows[idx];
  if (!current.steps.includes(step)) {
    current.steps.push(step);
  }
  flows[idx] = current;
  writeFlows(flows);
  emit('sv:flow-step', { flowId, step });
};

export const failFlow = (flowId: string, reason: string) => {
  const flows = readFlows();
  const idx = flows.findIndex((flow) => flow.id === flowId);
  if (idx < 0) return;

  flows[idx] = {
    ...flows[idx],
    status: 'failed',
    reason,
  };
  writeFlows(flows);
  emit('sv:flow-failed', { flowId, reason });
};

export const completeFlow = (flowId: string) => {
  const strict = (import.meta.env.VITE_STRICT_FLOW_LOCK || 'false') === 'true';
  const flows = readFlows();
  const idx = flows.findIndex((flow) => flow.id === flowId);
  if (idx < 0) return;

  const required = ['ui', 'api', 'db', 'event', 'ui-refresh'];
  const missing = required.filter((step) => !flows[idx].steps.includes(step));

  if (strict && missing.length > 0) {
    flows[idx] = {
      ...flows[idx],
      status: 'failed',
      reason: `missing_steps:${missing.join(',')}`,
    };
    writeFlows(flows);
    emit('sv:flow-failed', { flowId, reason: flows[idx].reason });
    throw new Error(`Flow lock failed: missing steps ${missing.join(', ')}`);
  }

  flows[idx] = {
    ...flows[idx],
    status: 'completed',
  };
  writeFlows(flows);
  emit('sv:flow-complete', { flowId });
};
