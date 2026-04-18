import { z } from 'zod';
import { CONTROL_PANEL_MODULES } from '@/config/controlPanelModules';
import { enqueueDeliveryJob } from '@/lib/queue/deliveryQueue';
import { createCentralNotification } from '@/lib/notifications/centralNotification';

export type HookType = 'pre_action_hook' | 'post_action_hook' | 'error_hook' | 'system_hook';
export type HookActionMode = 'sequential' | 'parallel';
export type HookJobStatus = 'queued' | 'running' | 'success' | 'failed';

export interface HookRegistryEntry {
  id: string;
  event: string;
  module: string;
  hookType: HookType;
  trigger: string;
  priority: number;
  mode: HookActionMode;
  action: string;
  dependsOn?: string[];
  timeoutMs?: number;
}

export interface HookJob {
  id: string;
  event: string;
  module: string;
  hook_type: HookType;
  action: string;
  status: HookJobStatus;
  retry_count: number;
  trace_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface HookLog {
  id: string;
  event: string;
  module: string;
  status: 'success' | 'failed';
  payload: Record<string, unknown>;
  trace_id: string;
  action?: string;
  created_at: string;
}

const LOG_KEY = 'global_hook_logs';
const JOB_KEY = 'global_hook_jobs';
const REGISTRY_KEY = 'global_hook_registry';

const EVENT_SCHEMA_MAP: Record<string, z.ZodTypeAny> = {
  apply_created: z.object({
    application_id: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
  }).passthrough(),
  approved: z.object({
    application_id: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
  }).passthrough(),
  payment_success: z.object({
    order_id: z.string().min(1).optional(),
    payment_id: z.string().min(1).optional(),
  }).passthrough(),
  ledger_done: z.object({
    order_id: z.string().min(1).optional(),
  }).passthrough(),
  commission_done: z.object({
    order_id: z.string().min(1).optional(),
  }).passthrough(),
  delivery_done: z.object({
    order_id: z.string().min(1).optional(),
  }).passthrough(),
  order_paid: z.object({
    order_id: z.string().min(1),
    amount: z.number().nonnegative().optional(),
  }).passthrough(),
  apply_submitted: z.object({
    application_id: z.string().min(1),
    role: z.string().min(1),
  }).passthrough(),
  ticket_created: z.object({
    ticket_id: z.string().min(1),
  }).passthrough(),
  product_published: z.object({
    product_id: z.string().min(1),
  }).passthrough(),
  ticket_resolved: z.object({
    ticket_id: z.string().min(1).optional(),
  }).passthrough(),
  hook_failed: z.object({
    source_event: z.string().min(1),
    source_module: z.string().min(1),
    reason: z.string().min(1),
  }).passthrough(),
};

const SYSTEM_ALLOWED_MODULES = new Set<string>([
  ...CONTROL_PANEL_MODULES.map((moduleDef) => moduleDef.id),
  'orders',
  'payments',
  'applications',
  'support',
  'marketplace',
  'platform',
  'auth',
]);

const EVENT_ALLOWED_MODULES: Record<string, string[]> = {
  apply_created: ['applications'],
  approved: ['applications'],
  payment_success: ['orders', 'payments', 'marketplace'],
  ledger_done: ['orders', 'payments', 'marketplace'],
  commission_done: ['orders', 'payments', 'marketplace'],
  delivery_done: ['orders', 'payments', 'marketplace', 'support'],
  order_paid: ['orders', 'payments', 'marketplace', 'marketplace-manager', 'reseller-dashboard'],
  apply_submitted: ['applications', 'lead-manager', 'reseller-manager', 'franchise-manager'],
  ticket_created: ['support', 'assist-manager', 'customer-support'],
  ticket_resolved: ['support', 'assist-manager', 'customer-support'],
  product_published: ['marketplace', 'marketplace-manager', 'product-manager', 'demo-manager'],
  hook_failed: ['platform'],
};

const DEFAULT_REGISTRY: HookRegistryEntry[] = [
  {
    id: 'apply-created-boss-notify',
    event: 'apply_created',
    module: 'applications',
    hookType: 'post_action_hook',
    trigger: 'application_create',
    priority: 1,
    mode: 'parallel',
    action: 'notification_send',
    timeoutMs: 4000,
  },
  {
    id: 'approved-user-notify',
    event: 'approved',
    module: 'applications',
    hookType: 'post_action_hook',
    trigger: 'application_approved',
    priority: 1,
    mode: 'parallel',
    action: 'notification_send',
    timeoutMs: 4000,
  },
  {
    id: 'payment-success-ledger',
    event: 'payment_success',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'payment_verify',
    priority: 1,
    mode: 'sequential',
    action: 'ledger_create',
    timeoutMs: 6000,
  },
  {
    id: 'ledger-done-commission',
    event: 'ledger_done',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'ledger_entry',
    priority: 1,
    mode: 'sequential',
    action: 'commission_split',
    timeoutMs: 6000,
  },
  {
    id: 'commission-done-wallet',
    event: 'commission_done',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'commission_calc',
    priority: 1,
    mode: 'sequential',
    action: 'wallet_update',
    timeoutMs: 6000,
  },
  {
    id: 'commission-done-delivery-queue',
    event: 'commission_done',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'commission_calc',
    priority: 2,
    mode: 'sequential',
    action: 'queue_delivery',
    dependsOn: ['commission-done-wallet'],
    timeoutMs: 6000,
  },
  {
    id: 'delivery-done-notify',
    event: 'delivery_done',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'delivery_complete',
    priority: 1,
    mode: 'parallel',
    action: 'notification_send',
    timeoutMs: 4000,
  },
  {
    id: 'payment-success-analytics',
    event: 'payment_success',
    module: 'orders',
    hookType: 'system_hook',
    trigger: 'payment_verify',
    priority: 2,
    mode: 'parallel',
    action: 'analytics_insert',
    dependsOn: ['payment-success-ledger'],
    timeoutMs: 4000,
  },
  {
    id: 'order-paid-ledger',
    event: 'order_paid',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'payment_success',
    priority: 1,
    mode: 'sequential',
    action: 'ledger_create',
    timeoutMs: 6000,
  },
  {
    id: 'order-paid-commission',
    event: 'order_paid',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'payment_success',
    priority: 2,
    mode: 'sequential',
    action: 'commission_split',
    dependsOn: ['order-paid-ledger'],
    timeoutMs: 6000,
  },
  {
    id: 'order-paid-delivery',
    event: 'order_paid',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'payment_success',
    priority: 3,
    mode: 'sequential',
    action: 'delivery_trigger',
    dependsOn: ['order-paid-ledger'],
    timeoutMs: 8000,
  },
  {
    id: 'order-paid-notify',
    event: 'order_paid',
    module: 'orders',
    hookType: 'post_action_hook',
    trigger: 'payment_success',
    priority: 3,
    mode: 'parallel',
    action: 'notification_send',
    dependsOn: ['order-paid-ledger'],
    timeoutMs: 4000,
  },
  {
    id: 'apply-approval-notify',
    event: 'apply_submitted',
    module: 'applications',
    hookType: 'post_action_hook',
    trigger: 'application_create',
    priority: 1,
    mode: 'parallel',
    action: 'notification_send',
    timeoutMs: 4000,
  },
  {
    id: 'apply-role-assign',
    event: 'apply_submitted',
    module: 'applications',
    hookType: 'post_action_hook',
    trigger: 'application_approved',
    priority: 2,
    mode: 'sequential',
    action: 'role_assign',
    dependsOn: ['apply-approval-notify'],
    timeoutMs: 6000,
  },
  {
    id: 'ticket-assist',
    event: 'ticket_created',
    module: 'support',
    hookType: 'post_action_hook',
    trigger: 'ticket_create',
    priority: 1,
    mode: 'sequential',
    action: 'assist_trigger',
    timeoutMs: 5000,
  },
  {
    id: 'ticket-resolve-notify',
    event: 'ticket_created',
    module: 'support',
    hookType: 'post_action_hook',
    trigger: 'ticket_resolve',
    priority: 2,
    mode: 'parallel',
    action: 'notification_send',
    dependsOn: ['ticket-assist'],
    timeoutMs: 4000,
  },
  {
    id: 'product-marketplace-publish',
    event: 'product_published',
    module: 'marketplace',
    hookType: 'post_action_hook',
    trigger: 'product_publish',
    priority: 1,
    mode: 'sequential',
    action: 'marketplace_publish',
    timeoutMs: 6000,
  },
  {
    id: 'product-publish-notify',
    event: 'product_published',
    module: 'marketplace',
    hookType: 'post_action_hook',
    trigger: 'product_publish',
    priority: 2,
    mode: 'parallel',
    action: 'notification_send',
    dependsOn: ['product-marketplace-publish'],
    timeoutMs: 4000,
  },
  {
    id: 'ticket-resolved-user-notify',
    event: 'ticket_resolved',
    module: 'support',
    hookType: 'post_action_hook',
    trigger: 'ticket_resolve',
    priority: 1,
    mode: 'parallel',
    action: 'notification_send',
    timeoutMs: 4000,
  },
  {
    id: 'error-alert-boss',
    event: 'hook_failed',
    module: 'platform',
    hookType: 'error_hook',
    trigger: 'error',
    priority: 1,
    mode: 'parallel',
    action: 'alert_boss_panel',
    timeoutMs: 4000,
  },
  {
    id: 'error-rollback',
    event: 'hook_failed',
    module: 'platform',
    hookType: 'error_hook',
    trigger: 'error',
    priority: 2,
    mode: 'sequential',
    action: 'rollback_if_needed',
    timeoutMs: 6000,
  },
];

const eventThreads = new Map<string, Promise<void>>();

function hasWindow() {
  return typeof window !== 'undefined';
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

const memoryStore: Record<string, string> = {};

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = hasWindow() ? window.localStorage.getItem(key) : memoryStore[key];
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  if (hasWindow()) {
    window.localStorage.setItem(key, serialized);
    return;
  }
  memoryStore[key] = serialized;
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    task
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getRegistry(): HookRegistryEntry[] {
  const custom = readStore<HookRegistryEntry[]>(REGISTRY_KEY, []);
  if (custom.length > 0) return custom;
  return DEFAULT_REGISTRY;
}

export function getHooksRegistry(): HookRegistryEntry[] {
  return getRegistry();
}

export function upsertHookRegistry(entries: HookRegistryEntry[]): void {
  writeStore(REGISTRY_KEY, entries);
}

function getJobs(): HookJob[] {
  return readStore<HookJob[]>(JOB_KEY, []);
}

function setJobs(jobs: HookJob[]): void {
  writeStore(JOB_KEY, jobs.slice(-2000));
}

function getLogs(): HookLog[] {
  return readStore<HookLog[]>(LOG_KEY, []);
}

function setLogs(logs: HookLog[]): void {
  writeStore(LOG_KEY, logs.slice(-3000));
}

function logHook(entry: HookLog): void {
  const logs = getLogs();
  logs.push(entry);
  setLogs(logs);

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent('sv:hook-log', { detail: entry }));
  }
}

async function simulateAction(action: string, payload: Record<string, unknown>): Promise<void> {
  if (action === 'queue_delivery') {
    enqueueDeliveryJob({
      order_id: String(payload.order_id || `ord_${Date.now()}`),
      user_id: String(payload.user_id || ''),
      product_id: String(payload.product_id || ''),
      trace_id: String(payload.trace_id || ''),
    });
    return;
  }

  switch (action) {
    case 'ledger_create':
    case 'commission_split':
    case 'delivery_trigger':
    case 'notification_send':
      createCentralNotification({
        source: 'hook-system',
        event: String(payload.event || 'notification_event'),
        level: 'info',
        target_user_id: String(payload.user_id || payload.target_user_id || ''),
        message: String(payload.message || `Notification: ${String(payload.event || 'event')}`),
        trace_id: String(payload.trace_id || ''),
      });
      return;
    case 'assist_trigger':
    case 'role_assign':
    case 'marketplace_publish':
    case 'wallet_update':
    case 'analytics_insert':
    case 'alert_boss_panel':
      createCentralNotification({
        source: 'hook-system',
        event: 'boss_alert',
        level: 'error',
        message: String(payload.message || payload.reason || 'Critical alert for Boss Panel'),
        trace_id: String(payload.trace_id || ''),
      });
      return;
    case 'rollback_if_needed':
      return;
    default:
      throw new Error(`unknown_hook_action:${action}`);
  }
}

async function emitFollowUpEvent(params: {
  action: string;
  event: string;
  module: string;
  payload: Record<string, unknown>;
  traceId: string;
}): Promise<void> {
  if (params.action === 'ledger_create') {
    await triggerGlobalHooks({
      event: 'ledger_done',
      module: params.module,
      payload: { ...params.payload, trace_id: params.traceId },
      hookType: 'post_action_hook',
      traceId: params.traceId,
    });
  }

  if (params.action === 'commission_split') {
    await triggerGlobalHooks({
      event: 'commission_done',
      module: params.module,
      payload: { ...params.payload, trace_id: params.traceId },
      hookType: 'post_action_hook',
      traceId: params.traceId,
    });
  }
}

function sortByPriorityAndDeps(entries: HookRegistryEntry[]): HookRegistryEntry[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const visited = new Set<string>();
  const stack = new Set<string>();
  const sorted: HookRegistryEntry[] = [];

  const ordered = [...entries].sort((a, b) => a.priority - b.priority);

  const visit = (entry: HookRegistryEntry) => {
    if (visited.has(entry.id)) return;
    if (stack.has(entry.id)) {
      throw new Error(`hook_dependency_cycle:${entry.id}`);
    }

    stack.add(entry.id);
    const deps = entry.dependsOn || [];
    for (const depId of deps) {
      const dep = byId.get(depId);
      if (!dep) {
        throw new Error(`hook_dependency_missing:${entry.id}->${depId}`);
      }
      visit(dep);
    }

    stack.delete(entry.id);
    visited.add(entry.id);
    sorted.push(entry);
  };

  for (const entry of ordered) {
    visit(entry);
  }

  return sorted;
}

function validatePayload(event: string, payload: Record<string, unknown>): void {
  const schema = EVENT_SCHEMA_MAP[event] || z.object({}).passthrough();
  const result = schema.safeParse(payload || {});
  if (!result.success) {
    throw new Error(`hook_payload_invalid:${event}:${result.error.issues[0]?.message || 'unknown'}`);
  }
}

function validateSourceModule(module: string): void {
  const normalized = String(module || '').trim().toLowerCase();
  const allowedPattern = /^[a-z0-9_-]+$/i.test(normalized);
  if (!allowedPattern) {
    throw new Error(`hook_source_module_invalid:${module}`);
  }

  if (!SYSTEM_ALLOWED_MODULES.has(normalized)) {
    throw new Error(`hook_source_module_unauthorized:${module}`);
  }
}

function validateEventModuleBinding(event: string, module: string): void {
  const allowedModules = EVENT_ALLOWED_MODULES[event];
  if (!allowedModules || allowedModules.length === 0) return;
  const normalized = module.toLowerCase();
  if (!allowedModules.includes(normalized)) {
    throw new Error(`hook_event_module_mismatch:${event}:${module}`);
  }
}

async function executeEntry(
  entry: HookRegistryEntry,
  params: { event: string; module: string; payload: Record<string, unknown>; traceId: string },
): Promise<void> {
  const jobs = getJobs();
  const jobId = generateId('hookjob');
  const newJob: HookJob = {
    id: jobId,
    event: params.event,
    module: params.module,
    hook_type: entry.hookType,
    action: entry.action,
    status: 'queued',
    retry_count: 0,
    trace_id: params.traceId,
    payload: params.payload,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  jobs.push(newJob);
  setJobs(jobs);

  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const updatedJobs = getJobs();
    const idx = updatedJobs.findIndex((job) => job.id === jobId);
    if (idx < 0) return;

    updatedJobs[idx] = {
      ...updatedJobs[idx],
      status: 'running',
      retry_count: attempt,
      updated_at: nowIso(),
      error: undefined,
    };
    setJobs(updatedJobs);

    try {
      await withTimeout(
        simulateAction(entry.action, params.payload),
        entry.timeoutMs || 5000,
        `hook_timeout:${entry.id}`,
      );

      const okJobs = getJobs();
      const okIdx = okJobs.findIndex((job) => job.id === jobId);
      if (okIdx >= 0) {
        okJobs[okIdx] = {
          ...okJobs[okIdx],
          status: 'success',
          updated_at: nowIso(),
        };
        setJobs(okJobs);
      }

      logHook({
        id: generateId('hooklog'),
        event: params.event,
        module: params.module,
        status: 'success',
        payload: params.payload,
        trace_id: params.traceId,
        action: entry.action,
        created_at: nowIso(),
      });

      await emitFollowUpEvent({
        action: entry.action,
        event: params.event,
        module: params.module,
        payload: params.payload,
        traceId: params.traceId,
      });

      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'hook_execute_failed';
      const failedJobs = getJobs();
      const failedIdx = failedJobs.findIndex((job) => job.id === jobId);
      if (failedIdx >= 0) {
        failedJobs[failedIdx] = {
          ...failedJobs[failedIdx],
          status: attempt >= maxRetries ? 'failed' : 'queued',
          updated_at: nowIso(),
          error: message,
          retry_count: attempt,
        };
        setJobs(failedJobs);
      }

      if (attempt >= maxRetries) {
        logHook({
          id: generateId('hooklog'),
          event: params.event,
          module: params.module,
          status: 'failed',
          payload: params.payload,
          trace_id: params.traceId,
          action: entry.action,
          created_at: nowIso(),
        });

        throw new Error(`hook_action_failed:${entry.id}:${message}`);
      }
    }
  }
}

export async function triggerGlobalHooks(input: {
  event: string;
  module: string;
  payload: Record<string, unknown>;
  hookType?: HookType;
  traceId?: string;
}): Promise<{ trace_id: string; executed: number }> {
  validateSourceModule(input.module);
  validatePayload(input.event, input.payload || {});
  validateEventModuleBinding(input.event, input.module);

  const traceId = input.traceId || generateId('trace');
  const hookType = input.hookType || 'post_action_hook';

  const queueKey = `${input.event}`;
  const previous = eventThreads.get(queueKey) || Promise.resolve();

  let executed = 0;

  const run = previous.then(async () => {
    const entries = sortByPriorityAndDeps(
      getRegistry().filter((entry) => entry.event === input.event && entry.hookType === hookType),
    );

    const completed = new Set<string>();

    const priorities = Array.from(new Set(entries.map((entry) => entry.priority))).sort((a, b) => a - b);
    for (const priority of priorities) {
      const level = entries.filter((entry) => entry.priority === priority);

      for (const entry of level.filter((item) => item.mode === 'sequential')) {
        const deps = entry.dependsOn || [];
        for (const depId of deps) {
          if (!completed.has(depId)) {
            throw new Error(`hook_dependency_blocked:${entry.id}:${depId}`);
          }
        }

        await executeEntry(entry, {
          event: input.event,
          module: input.module,
          payload: input.payload,
          traceId,
        });
        completed.add(entry.id);
        executed += 1;
      }

      const parallelEntries = level.filter((item) => item.mode === 'parallel');
      if (parallelEntries.length > 0) {
        await Promise.all(
          parallelEntries.map(async (entry) => {
            const deps = entry.dependsOn || [];
            for (const depId of deps) {
              if (!completed.has(depId)) {
                throw new Error(`hook_dependency_blocked:${entry.id}:${depId}`);
              }
            }

            await executeEntry(entry, {
              event: input.event,
              module: input.module,
              payload: input.payload,
              traceId,
            });
            completed.add(entry.id);
            executed += 1;
          }),
        );
      }
    }
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : 'hook_runner_failed';

    if (input.event !== 'hook_failed') {
      await triggerGlobalHooks({
        event: 'hook_failed',
        module: 'platform',
        payload: {
          source_event: input.event,
          source_module: input.module,
          reason: message,
          trace_id: traceId,
        },
        hookType: 'error_hook',
        traceId,
      }).catch(() => {
        // no-op fail-safe
      });
    }

    throw error;
  }).finally(() => {
    eventThreads.delete(queueKey);
  });

  eventThreads.set(queueKey, run);
  await run;
  return { trace_id: traceId, executed };
}

export function getHookLogs(limit = 200): HookLog[] {
  return getLogs().slice(-Math.max(limit, 1)).reverse();
}

export function getHookJobs(limit = 200): HookJob[] {
  return getJobs().slice(-Math.max(limit, 1)).reverse();
}

export function triggerGlobalHooksAsync(input: {
  event: string;
  module: string;
  payload: Record<string, unknown>;
  hookType?: HookType;
  traceId?: string;
}): { trace_id: string } {
  const traceId = input.traceId || generateId('trace');
  void triggerGlobalHooks({ ...input, traceId }).catch(() => {
    // no-op: fail-safe logs are handled in triggerGlobalHooks
  });
  return { trace_id: traceId };
}

export async function retryHookJob(jobId: string): Promise<{ retried: boolean; trace_id?: string }> {
  const job = getJobs().find((item) => item.id === jobId);
  if (!job) {
    throw new Error(`hook_job_not_found:${jobId}`);
  }

  await triggerGlobalHooks({
    event: job.event,
    module: job.module,
    payload: job.payload,
    hookType: job.hook_type,
    traceId: job.trace_id,
  });

  return { retried: true, trace_id: job.trace_id };
}
