// @ts-nocheck
// ENGINE 19 — Queue + Cache Fabric: job queues, retry, DLQ, cache keys + invalidation
import type { ValaAutomationTask, ValaQueueJob, ValaCacheEntry } from '@/vala/types';

function toQueueJob(task: ValaAutomationTask): ValaQueueJob {
  return {
    jobId:     task.taskId,
    channel:   task.pipeline.includes('deploy') ? 'deploy' : 'build',
    payload:   { pipeline: task.pipeline, bot: task.devBot },
    retries:   0,
    maxRetries: task.retries,
    inDlq:     false,
    createdAt: new Date().toISOString(),
  };
}

function shouldDLQ(job: ValaQueueJob): boolean {
  return job.retries >= job.maxRetries;
}

export function enqueueJobs(tasks: ValaAutomationTask[]): ValaQueueJob[] {
  return tasks.map(toQueueJob);
}

export function retryFailed(jobs: ValaQueueJob[]): ValaQueueJob[] {
  return jobs.map((j) => {
    if (j.inDlq) return j;
    if (j.retries < j.maxRetries) {
      return { ...j, retries: j.retries + 1 };
    }
    return { ...j, inDlq: true };
  });
}

export function flushDLQ(jobs: ValaQueueJob[]): ValaQueueJob[] {
  return jobs.filter((j) => !j.inDlq);
}

export function buildCacheManifest(modules: string[]): ValaCacheEntry[] {
  const TTL: Record<string, number> = {
    catalog:   120,
    products:   60,
    dashboard:  30,
    settings:  300,
    reports:   600,
    orders:     45,
  };
  const invalidationMap: Record<string, string[]> = {
    catalog:  ['products', 'banner'],
    orders:   ['cart', 'checkout'],
    settings: ['profile'],
  };

  return modules.map((mod) => ({
    key:          `vala:cache:${mod}`,
    ttlSeconds:   TTL[mod] ?? 60,
    invalidateOn: invalidationMap[mod] ?? [`${mod}:write`],
  }));
}
