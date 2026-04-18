type DeliveryJobStatus = 'queued' | 'processing' | 'done' | 'failed';

export type DeliveryJob = {
  id: string;
  order_id: string;
  user_id: string;
  product_id: string;
  status: DeliveryJobStatus;
  trace_id?: string;
  created_at: string;
  updated_at: string;
};

const STORE_KEY = 'sv_delivery_queue_jobs';
const memoryStore: Record<string, string> = {};

const nowIso = () => new Date().toISOString();

function hasWindow() {
  return typeof window !== 'undefined';
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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

function getJobs(): DeliveryJob[] {
  return readStore<DeliveryJob[]>(STORE_KEY, []);
}

function setJobs(jobs: DeliveryJob[]): void {
  writeStore(STORE_KEY, jobs.slice(-2000));
}

export function enqueueDeliveryJob(payload: {
  order_id: string;
  user_id: string;
  product_id: string;
  trace_id?: string;
}): DeliveryJob {
  const jobs = getJobs();
  const job: DeliveryJob = {
    id: generateId('djob'),
    order_id: payload.order_id,
    user_id: payload.user_id,
    product_id: payload.product_id,
    status: 'queued',
    trace_id: payload.trace_id,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  jobs.push(job);
  setJobs(jobs);
  return job;
}

export function claimNextDeliveryJob(): DeliveryJob | null {
  const jobs = getJobs();
  const idx = jobs.findIndex((job) => job.status === 'queued');
  if (idx < 0) return null;
  jobs[idx] = { ...jobs[idx], status: 'processing', updated_at: nowIso() };
  setJobs(jobs);
  return jobs[idx];
}

export function completeDeliveryJob(jobId: string, failed = false): DeliveryJob | null {
  const jobs = getJobs();
  const idx = jobs.findIndex((job) => job.id === jobId);
  if (idx < 0) return null;
  jobs[idx] = {
    ...jobs[idx],
    status: failed ? 'failed' : 'done',
    updated_at: nowIso(),
  };
  setJobs(jobs);
  return jobs[idx];
}

export function getDeliveryJobs(limit = 200): DeliveryJob[] {
  return getJobs().slice(-Math.max(limit, 1)).reverse();
}
