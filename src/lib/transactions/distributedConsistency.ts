type SagaStepStatus = 'pending' | 'completed' | 'compensated';

export type OrderState = 'created' | 'paid' | 'processing' | 'delivered' | 'cancelled' | 'refunded';

export interface DistributedSagaStep {
  id: string;
  label: string;
  run: () => Promise<void>;
  compensate?: () => Promise<void>;
}

interface PersistedSagaEvent {
  sagaId: string;
  stepId: string;
  type: 'step_completed' | 'step_failed' | 'step_compensated';
  traceId: string;
  timestamp: string;
  detail?: string;
}

const EVENT_STORE_KEY = 'distributed_saga_event_store';
const IDEMPOTENCY_KEY = 'distributed_saga_idempotency';

function readStore<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value.slice(-1000)));
}

function appendEvent(event: PersistedSagaEvent) {
  const current = readStore<PersistedSagaEvent>(EVENT_STORE_KEY);
  current.push(event);
  writeStore(EVENT_STORE_KEY, current);
}

export function assertOrderStateTransition(current: OrderState, next: OrderState): void {
  const graph: Record<OrderState, OrderState[]> = {
    created: ['paid', 'cancelled'],
    paid: ['processing', 'refunded'],
    processing: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };

  const allowed = graph[current] || [];
  if (!allowed.includes(next)) {
    throw new Error(`order_state_transition_invalid:${current}->${next}`);
  }
}

export function wasIdempotencyKeyUsed(idempotencyKey: string): boolean {
  const keys = new Set(readStore<string>(IDEMPOTENCY_KEY));
  return keys.has(idempotencyKey);
}

export function markIdempotencyKeyUsed(idempotencyKey: string): void {
  const keys = readStore<string>(IDEMPOTENCY_KEY);
  if (!keys.includes(idempotencyKey)) {
    keys.push(idempotencyKey);
    writeStore(IDEMPOTENCY_KEY, keys);
  }
}

export async function executeDistributedSaga(params: {
  sagaId: string;
  traceId: string;
  idempotencyKey: string;
  steps: DistributedSagaStep[];
}): Promise<{ ok: true } | { ok: false; failedStep: string; error: string }> {
  if (wasIdempotencyKeyUsed(params.idempotencyKey)) {
    return { ok: true };
  }

  const completed: Array<{ step: DistributedSagaStep; status: SagaStepStatus }> = [];

  for (const step of params.steps) {
    try {
      await step.run();
      completed.push({ step, status: 'completed' });
      appendEvent({
        sagaId: params.sagaId,
        stepId: step.id,
        traceId: params.traceId,
        type: 'step_completed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      appendEvent({
        sagaId: params.sagaId,
        stepId: step.id,
        traceId: params.traceId,
        type: 'step_failed',
        timestamp: new Date().toISOString(),
        detail: message,
      });

      for (let i = completed.length - 1; i >= 0; i -= 1) {
        const item = completed[i];
        if (!item.step.compensate) continue;
        try {
          await item.step.compensate();
          appendEvent({
            sagaId: params.sagaId,
            stepId: item.step.id,
            traceId: params.traceId,
            type: 'step_compensated',
            timestamp: new Date().toISOString(),
          });
        } catch {
          // compensation is best effort and is tracked through events.
        }
      }

      return { ok: false, failedStep: step.id, error: message };
    }
  }

  markIdempotencyKeyUsed(params.idempotencyKey);
  return { ok: true };
}
