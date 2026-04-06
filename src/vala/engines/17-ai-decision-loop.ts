// @ts-nocheck
// ENGINE 17 — AI Decision Loop: analyze usage/errors/conversions → decide → execute
import type { ValaMetrics, ValaError, ValaAIDecision } from '@/vala/types';

interface SignalInput {
  metrics: ValaMetrics;
  errors:  ValaError[];
  conversionRate?: number;
}

function decidePrimary(
  errorRate: number,
  latency: number,
  conversion: number,
): ValaAIDecision['action'] {
  if (errorRate > 5)    return 'refactor';
  if (latency > 500)    return 'optimize';
  if (conversion < 0.1) return 'reprice';
  if (errorRate > 2)    return 'scale';
  return 'no_action';
}

function buildDecision(
  signal: ValaAIDecision['signal'],
  value: number,
  threshold: number,
  action: ValaAIDecision['action'],
  reasoning: string,
  pipeline: string,
): ValaAIDecision {
  return { signal, value, threshold, action, reasoning, executedVia: pipeline };
}

export function runAIDecisionLoop(input: SignalInput): ValaAIDecision[] {
  const decisions: ValaAIDecision[] = [];
  const { metrics, errors, conversionRate = 0.15 } = input;

  const primaryAction = decidePrimary(metrics.errorRate, metrics.latencyP99Ms, conversionRate);

  if (primaryAction !== 'no_action') {
    const pipelineMap: Record<string, string> = {
      refactor: 'vala/self-heal-pipeline',
      optimize: 'vala/performance-pipeline',
      reprice:  'vala/pricing-advisor',
      scale:    'vala/scaling-pipeline',
    };
    decisions.push(buildDecision(
      metrics.errorRate > 2 ? 'error' : 'usage',
      metrics.errorRate > 2 ? metrics.errorRate : metrics.throughputRps,
      metrics.errorRate > 2 ? 2 : 100,
      primaryAction,
      `Detected ${primaryAction} need: errorRate=${metrics.errorRate}% latency=${metrics.latencyP99Ms}ms conversion=${conversionRate}`,
      pipelineMap[primaryAction],
    ));
  }

  if (errors.some((e) => e.isAnomaly)) {
    decisions.push(buildDecision(
      'error',
      errors.filter((e) => e.isAnomaly).length,
      1,
      'refactor',
      'Anomaly spike detected — trigger refactor + self-heal loop',
      'vala/anomaly-response',
    ));
  }

  return decisions;
}
