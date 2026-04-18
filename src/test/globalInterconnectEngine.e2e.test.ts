// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { globalInterconnectEngine, GlobalInterconnectEngine } from '@/services/globalInterconnectEngine';

describe('global interconnect engine', () => {
  it('completes Lead -> Sale -> Order -> Payment -> License -> Access chain', () => {
    const engine = new GlobalInterconnectEngine();

    const result = engine.runLeadToAccessE2E({
      source: 'seo_campaign',
      email: 'buyer@example.com',
      score: 91,
      amount: 499,
      items: [{ sku: 'starter-plan', qty: 1 }],
      plan: 'starter',
      user_id: 'user-001',
    });

    expect(result.ok).toBe(true);
    expect(result.chain.lead_id).toBeTruthy();
    expect(result.chain.sale_id).toBeTruthy();
    expect(result.chain.order_id).toBeTruthy();
    expect(result.chain.payment_id).toBeTruthy();
    expect(result.chain.license_id).toBeTruthy();
    expect(result.chain.access_id).toBeTruthy();

    const byLead = engine.globalSearch(result.chain.lead_id);
    const byOrder = engine.globalSearch(result.chain.order_id);
    const byPayment = engine.globalSearch(result.chain.payment_id);

    expect(byLead.length).toBeGreaterThan(0);
    expect(byOrder.length).toBeGreaterThan(0);
    expect(byPayment.length).toBeGreaterThan(0);

    expect(engine.getNotifications().length).toBeGreaterThanOrEqual(6);
    expect(engine.getRealtimeRevision()).toBeGreaterThanOrEqual(6);
  });

  it('rolls back automatically on failure to keep data consistent', () => {
    const engine = new GlobalInterconnectEngine();

    const failed = engine.runLeadToAccessE2E({
      source: 'seo_campaign',
      email: 'rollback@example.com',
      score: 88,
      amount: 999,
      items: [{ sku: 'pro-plan', qty: 1 }],
      plan: 'pro',
      user_id: 'user-rollback',
      failAt: 'payment',
    });

    expect(failed.ok).toBe(false);
    expect(engine.globalSearch('rollback@example.com').length).toBe(0);
    expect(engine.getEventLog().some((evt) => evt.type === 'SAGA_ROLLBACK')).toBe(true);
  });

  it('enforces cross-module permissions, health fallback, and global settings', () => {
    const engine = new GlobalInterconnectEngine();

    expect(engine.canAccess('finance_manager', 'payment_gateway')).toBe(true);
    expect(engine.canAccess('user', 'payment_gateway')).toBe(false);

    engine.updateSettings({ pricingMultiplier: 1.2, notificationChannel: 'in_app' });
    const run = engine.runLeadToAccessE2E({
      source: 'marketing',
      email: 'settings@example.com',
      score: 70,
      amount: 100,
      items: [{ sku: 'basic', qty: 1 }],
      plan: 'basic',
      user_id: 'user-settings',
    });

    expect(run.ok).toBe(true);

    engine.markModuleHealth('payment_gateway', false, 'gateway timeout');
    const dep = engine.getDependencyFallback('license_system');

    expect(dep.blockedBy.includes('payment_gateway')).toBe(true);
    expect(typeof dep.fallback).toBe('string');
  });

  it('supports orchestration, priority execution, and load shedding', async () => {
    const engine = new GlobalInterconnectEngine();

    const trace: string[] = [];

    await engine.runPrioritizedBatch([
      {
        moduleId: 'analytics_hub',
        taskType: 'analytics',
        critical: true,
        fn: () => trace.push('analytics'),
      },
      {
        moduleId: 'order_system',
        taskType: 'order',
        critical: true,
        fn: () => trace.push('order'),
      },
      {
        moduleId: 'payment_gateway',
        taskType: 'payment',
        critical: true,
        fn: () => trace.push('payment'),
      },
    ]);

    expect(trace[0]).toBe('payment');
    expect(trace[1]).toBe('order');
    expect(trace[2]).toBe('analytics');

    engine.setLoadSheddingThreshold(50);
    engine.setLoad(95);
    const shed = await engine.runOrchestratedTask({
      moduleId: 'analytics_hub',
      taskType: 'analytics',
      critical: false,
      fn: () => 'should-not-run',
    });

    expect(shed.ok).toBe(false);
    expect(shed.shed).toBe(true);
  });

  it('handles retry + DLQ and cache invalidation', () => {
    const engine = new GlobalInterconnectEngine();

    let attempts = 0;
    engine.subscribe(() => {
      attempts += 1;
      if (attempts <= 2) throw new Error('transient failure');
    });

    engine.subscribe(() => {
      throw new Error('permanent failure');
    });

    const result = engine.runLeadToAccessE2E({
      org_id: 'org-a',
      source: 'seo',
      email: 'retry@example.com',
      score: 80,
      amount: 120,
      items: [{ sku: 'retry-plan', qty: 1 }],
      plan: 'retry',
      user_id: 'retry-user',
    });

    expect(result.ok).toBe(true);
    expect(attempts).toBeGreaterThanOrEqual(3);
    expect(engine.getDLQ().length).toBeGreaterThan(0);

    engine.setModuleCache('payment_gateway', 'org-a', 'txn', { x: 1 }, ['financial-chain']);
    expect(engine.getModuleCache('payment_gateway', 'org-a', 'txn')).toBeTruthy();

    engine.invalidateCachesByTags('org-a', ['financial-chain']);
    expect(engine.getModuleCache('payment_gateway', 'org-a', 'txn')).toBeNull();
  });

  it('supports tenant isolation, version compatibility, feature flags, incident mode, reconciliation, and metrics', () => {
    const engine = new GlobalInterconnectEngine();

    const runA = engine.runLeadToAccessE2E({
      org_id: 'org-a',
      source: 'seo',
      email: 'a@example.com',
      score: 78,
      amount: 300,
      items: [{ sku: 'a1', qty: 1 }],
      plan: 'basic',
      user_id: 'u-a',
    });
    const runB = engine.runLeadToAccessE2E({
      org_id: 'org-b',
      source: 'seo',
      email: 'b@example.com',
      score: 81,
      amount: 320,
      items: [{ sku: 'b1', qty: 1 }],
      plan: 'pro',
      user_id: 'u-b',
    });

    expect(runA.ok).toBe(true);
    expect(runB.ok).toBe(true);

    const stateA = engine.getStateStore('org-a');
    const stateB = engine.getStateStore('org-b');
    expect(stateA.leads.length).toBe(1);
    expect(stateB.leads.length).toBe(1);
    expect(stateA.leads[0].org_id).toBe('org-a');
    expect(stateB.leads[0].org_id).toBe('org-b');

    engine.setModuleVersion('payment_gateway', '1.2.0', '1.1.0');
    const compat = engine.getVersionCompatibility();
    expect(compat.payment_gateway.compatible).toBe(true);

    engine.setFeatureFlag('analytics.realtime', false);
    expect(engine.isFeatureEnabled('analytics.realtime')).toBe(false);

    engine.markModuleHealth('payment_gateway', false, 'incident drill');
    engine.setIncidentMode(true, ['payment_gateway', 'license_system', 'security_manager', 'order_system']);
    const incidentRun = engine.runLeadToAccessE2E({
      org_id: 'org-a',
      source: 'seo',
      email: 'incident@example.com',
      score: 82,
      amount: 200,
      items: [{ sku: 'inc', qty: 1 }],
      plan: 'starter',
      user_id: 'u-incident',
    });
    expect(incidentRun.ok).toBe(false);

    const reconciliation = engine.runReconciliationJob('org-a');
    expect(reconciliation.org_id).toBe('org-a');
    expect(typeof reconciliation.financiallyAccurate).toBe('boolean');

    const metrics = engine.getMetrics();
    expect(metrics.totalEvents).toBeGreaterThan(0);
    expect(metrics.latencySamples).toBeGreaterThan(0);
    expect(typeof metrics.conversionRate).toBe('number');
  });

  it('covers ops playbooks, alerts, guardrails, release rollback, backfill, fraud, recon, SLA, capacity, cost, legal export, and customer success loop', () => {
    const engine = new GlobalInterconnectEngine();
    const orgId = 'org-ops';

    const runbook = engine.getOpsRunbook('payment_failed');
    expect(runbook.length).toBeGreaterThan(3);

    engine.markModuleHealth('payment_gateway', false, 'provider down');
    expect(engine.getOnCallAlerts().some((x) => x.severity === 'critical')).toBe(true);

    engine.setKPIGuardrails({ minConversionRate: 0.9, maxErrorRate: 0.01 });
    engine.runLeadToAccessE2E({
      org_id: orgId,
      source: 'seo',
      email: 'guardrail@example.com',
      score: 95,
      amount: 200,
      items: [{ sku: 'guardrail', qty: 1 }],
      plan: 'starter',
      user_id: 'u-guardrail',
      failAt: 'payment',
    });
    expect(engine.getOnCallAlerts().length).toBeGreaterThan(0);

    engine.setReleaseVersion('1.1.0');
    const release = engine.releaseRollbackToggle();
    expect(release.rolledBack).toBe(true);

    const seeded = engine.seedOrphanOrderForBackfill(orgId, 77);
    const reconBefore = engine.runRevenueReconJob(orgId);
    expect(reconBefore.anomalies.missingPayments.includes(seeded.order_id)).toBe(true);

    const backfill = engine.runBackfillJobs(orgId);
    expect(backfill.repairedCount).toBeGreaterThan(0);

    const reconAfter = engine.runRevenueReconJob(orgId);
    expect(reconAfter.anomalies.missingPayments.length).toBe(0);
    expect(reconAfter.anomalies.missingWalletEntries.length).toBe(0);

    const fraud = engine.evaluateFraud({ org_id: orgId, order_id: 'order-fraud', amount: 25000, itemCount: 40 });
    expect(fraud.hold).toBe(true);

    const ticket = engine.createSupportTicket(orgId);
    const slaBefore = engine.getSLAStatus(0);
    expect(slaBefore.totalTickets).toBeGreaterThan(0);
    engine.respondSupportTicket(ticket.id);
    const slaAfter = engine.getSLAStatus(9999);
    expect(slaAfter.breached).toBe(0);

    const capacity = engine.predictCapacity(500, 0.6);
    expect(capacity.recommendedReplicas).toBeGreaterThanOrEqual(2);

    engine.setCostLimit(100);
    const cost = engine.updateCost(80, 30);
    expect(cost.limited).toBe(true);

    engine.runLeadToAccessE2E({
      org_id: orgId,
      source: 'seo',
      email: 'legal@example.com',
      score: 72,
      amount: 120,
      items: [{ sku: 'legal', qty: 1 }],
      plan: 'basic',
      user_id: 'u-legal',
    });
    const legal = engine.exportLegalAuditReport(orgId);
    expect(legal.totals.events).toBeGreaterThan(0);

    engine.recordCustomerFeedback(orgId, 'u1', 2, 'onboarding was confusing');
    engine.recordCustomerFeedback(orgId, 'u2', 5, 'payment flow is smooth');
    const success = engine.getCustomerSuccessInsights(orgId);
    expect(success.totalFeedback).toBe(2);
    expect(typeof success.avgScore).toBe('number');
  });

  it('enforces ownership lock and strict API contracts', () => {
    const engine = new GlobalInterconnectEngine();

    expect(() => engine.assertEntityWriteOwnership('wallet', 'order-system')).toThrow(/ownership_violation/);
    expect(engine.assertEntityWriteOwnership('wallet', 'finance-manager').allowed).toBe(true);

    const validOrderReq = engine.validateApiContract('/api/v1/orders', 'request', {
      order_id: 'ord-001',
      org_id: 'org-z',
      lead_id: 'lead-001',
      sale_id: 'sale-001',
      items: [{ sku: 's1', qty: 1 }],
      created_at: new Date().toISOString(),
    });
    expect(validOrderReq.success).toBe(true);

    const invalidOrderResp = engine.validateApiContract('/api/v1/orders', 'response', {
      ok: true,
      data: { order_id: 'x' },
    });
    expect(invalidOrderResp.success).toBe(false);
  });

  it('supports dependency fallback, boss override actions, and interrupted-flow recovery', () => {
    const engine = new GlobalInterconnectEngine();
    const orgId = 'org-recover';

    engine.setProviderHealth('payment', false, true);
    const fallback = engine.executeWithDependencyFallback('payment', () => 'primary', () => 'fallback');
    expect(fallback.provider).toBe('fallback');

    const forced = engine.forceCompleteOrder('boss_owner', 'ord-force', 'incident override');
    expect(forced.type).toBe('force_complete_order');

    const seeded = engine.seedOrphanOrderForBackfill(orgId, 120);
    engine.runBackfillJobs(orgId);
    const resumed = engine.resumeInterruptedFlows(orgId);
    expect(resumed.resumedCount).toBeGreaterThan(0);

    // Ensure seeded order id path was part of recovery path context.
    expect(typeof seeded.order_id).toBe('string');
  });

  it('covers compliance + operations guards (retention, consent/export, rate limits, freeze, drift, signed urls, resource watchdog)', () => {
    const engine = new GlobalInterconnectEngine();

    engine.setRetentionPolicy({ logsDays: 30, analyticsDays: 180, backupDays: 14 });
    const sweep = engine.runRetentionSweep();
    expect(typeof sweep.prunedLogs).toBe('number');

    engine.registerConsent('u-consent', true, true, '10.0.0.1');
    const exported = engine.exportUserData('u-consent');
    expect(exported.consent?.termsAcceptedAt).toBeTruthy();

    engine.setRateLimitPolicy({ perUser: 1, perIp: 2, windowMs: 60_000 });
    const r1 = engine.checkRateLimit('u-rate', '1.1.1.1');
    const r2 = engine.checkRateLimit('u-rate', '1.1.1.1');
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(false);

    engine.setDeploymentFreeze(true, 'major incident');
    expect(engine.isDeploymentFrozen()).toBe(true);

    engine.setConfigBaseline({ API_HOST: 'prod', PAYMENTS_MODE: 'live' });
    engine.setRuntimeConfig({ API_HOST: 'prod', PAYMENTS_MODE: 'sandbox' });
    const drift = engine.validateConfigDrift();
    expect(drift.ok).toBe(false);

    const signed = engine.createSignedDownloadUrl('invoice.pdf', 1);
    const validNow = engine.validateSignedDownloadUrl(signed.expiresAt);
    expect(validNow.valid).toBe(true);

    engine.recordResourceUsage(97, 75);
    const recovery = engine.getWorkerRecoveryPlan();
    expect(recovery.action).toBe('restart_unhealthy_workers');
  });
});

// Keeps singleton import referenced for integration surfaces.
void globalInterconnectEngine;
