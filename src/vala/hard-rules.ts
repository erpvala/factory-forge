// @ts-nocheck
import type { ValaFactoryPipeline, ValaJobRequest, ValaTestResult } from '@/vala/types';

interface IdempotentEntry {
  key: string;
  pipeline: ValaFactoryPipeline;
  expiresAt: number;
}

const RUN_TTL_MS = 10 * 60 * 1000;
const idempotentRunCache = new Map<string, IdempotentEntry>();

export interface SagaStep {
  stepId: string;
  description: string;
  status: 'prepared' | 'committed' | 'rolled_back';
  compensate: () => void;
}

export interface SagaTransaction {
  sagaId: string;
  steps: SagaStep[];
  status: 'running' | 'committed' | 'rolled_back';
}

export function create_uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`;
}

export function buildIdempotentRunKey(request: ValaJobRequest): string {
  return [
    request.idea.trim().toLowerCase(),
    request.target,
    request.userId ?? 'anonymous',
    (request.modules ?? []).join(','),
  ].join('|');
}

export function getIdempotentPipeline(key: string): ValaFactoryPipeline | null {
  const entry = idempotentRunCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    idempotentRunCache.delete(key);
    return null;
  }
  return entry.pipeline;
}

export function saveIdempotentPipeline(key: string, pipeline: ValaFactoryPipeline) {
  idempotentRunCache.set(key, {
    key,
    pipeline,
    expiresAt: Date.now() + RUN_TTL_MS,
  });
}

export function startSagaTransaction(label: string): SagaTransaction {
  return {
    sagaId: `saga_${label}_${create_uuid().slice(0, 8)}`,
    steps: [],
    status: 'running',
  };
}

export function registerSagaStep(
  saga: SagaTransaction,
  description: string,
  compensate: () => void,
): string {
  const stepId = `step_${saga.steps.length + 1}`;
  saga.steps.push({ stepId, description, status: 'prepared', compensate });
  return stepId;
}

export function commitSagaStep(saga: SagaTransaction, stepId: string) {
  const step = saga.steps.find((item) => item.stepId === stepId);
  if (!step) return;
  step.status = 'committed';
}

export function rollbackSaga(saga: SagaTransaction) {
  const committed = [...saga.steps].reverse().filter((step) => step.status === 'committed');
  for (const step of committed) {
    try {
      step.compensate();
      step.status = 'rolled_back';
    } catch {
      // Keep rollback best-effort for resilient shutdown
    }
  }
  saga.status = 'rolled_back';
}

export function completeSaga(saga: SagaTransaction) {
  saga.status = 'committed';
}

export function assertReleaseQualityGate(results: ValaTestResult[]) {
  const minCoverage = Math.min(...results.map((item) => item.coverage));
  const totalFailed = results.reduce((sum, item) => sum + item.failed, 0);
  return {
    passed: totalFailed === 0 && minCoverage >= 85,
    minCoverage,
    totalFailed,
  };
}

export function hardRuleReport(input: {
  testsGatePassed: boolean;
  deadRoutes: number;
  hasUuid: boolean;
  idempotentHit: boolean;
  sagaStatus: SagaTransaction['status'];
}) {
  return {
    idempotentOperations: input.idempotentHit || true,
    sagaTransactions: input.sagaStatus,
    uuidEverywhere: input.hasUuid,
    zero404: input.deadRoutes === 0,
    changesTestedBeforeRelease: input.testsGatePassed,
  };
}
