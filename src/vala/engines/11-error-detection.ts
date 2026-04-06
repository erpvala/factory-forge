// @ts-nocheck
// ENGINE 11 — Error Detection Core: console/runtime/API failures + anomaly detection
import type { ValaMetrics, ValaError, Severity } from '@/vala/types';

function newId(): string {
  return 'err_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function classifySeverity(errorRate: number, latency: number): Severity {
  if (errorRate > 10 || latency > 2000) return 'critical';
  if (errorRate > 5  || latency > 800)  return 'high';
  if (errorRate > 2  || latency > 400)  return 'medium';
  return 'low';
}

export function runErrorDetection(metrics: ValaMetrics): ValaError[] {
  const errors: ValaError[] = [];
  const baseline = 0.3;

  if (metrics.errorRate > baseline) {
    const isAnomaly = metrics.errorRate > baseline * 3;
    errors.push({
      id:       newId(),
      source:   'api',
      severity: classifySeverity(metrics.errorRate, metrics.latencyP99Ms),
      message:  `API error rate ${metrics.errorRate}% (baseline ${baseline}%)`,
      file:     null,
      line:     null,
      isAnomaly,
      baseline,
      spike: metrics.errorRate,
    });
  }

  if (metrics.latencyP99Ms > 500) {
    errors.push({
      id:       newId(),
      source:   'runtime',
      severity: classifySeverity(metrics.errorRate, metrics.latencyP99Ms),
      message:  `P99 latency ${metrics.latencyP99Ms}ms exceeds 500ms threshold`,
      file:     null,
      line:     null,
      isAnomaly: metrics.latencyP99Ms > 1500,
      baseline: 500,
      spike: metrics.latencyP99Ms,
    });
  }

  if (metrics.alertsFired > 0) {
    errors.push({
      id:       newId(),
      source:   'console',
      severity: 'high',
      message:  `${metrics.alertsFired} alert rule(s) fired`,
      file:     null,
      line:     null,
      isAnomaly: false,
    });
  }

  return errors;
}

export function hasCriticalErrors(errors: ValaError[]): boolean {
  return errors.some((e) => e.severity === 'critical');
}
