import { describe, expect, it } from 'vitest';
import { getLiveModuleGraph, simulateMasterFlow, validateLiveModuleGraph } from '@/services/liveEngineModuleGraph';

describe('live engine module graph', () => {
  it('contains 40 connected modules with no isolation', () => {
    const modules = getLiveModuleGraph();
    const validation = validateLiveModuleGraph();

    expect(modules.length).toBe(40);
    expect(validation.missingInput).toEqual([]);
    expect(validation.missingOutput).toEqual([]);
    expect(validation.brokenEdges).toEqual([]);
    expect(validation.isolatedModules).toEqual([]);
    expect(validation.isConnectedEcosystem).toBe(true);
  });

  it('runs full master flow without dead handoff', () => {
    const run = simulateMasterFlow({ userId: 'demo-user', leadId: 'lead-42' });

    expect(run.path.length).toBeGreaterThan(12);
    expect(run.trail.length).toBe(run.path.length - 1);
    expect(run.connected).toBe(true);
    expect(run.endedAt).toBe('vala_ai');
  });
});
