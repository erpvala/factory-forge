// @ts-nocheck
/**
 * SYSTEM FLOW STORE
 * Zustand-powered single source of truth for the entire Software Factory pipeline
 * Covers all 12 layers of the Ultra System Flow
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type Lead,
  type Sale,
  type WalletEntry,
  type WalletSplit,
  type CommissionRecord,
  type PayoutRecord,
  type FlowEvent,
  type AIDecision,
  type PerformanceRecord,
  type AuditLog,
  type SystemFlowState,
  type WalletType,
  type PayoutCycle,
  type PayoutStatus,
  type FlowEventType,
  type FlowLayer,
  type BuildTarget,
  type AutonomousFactoryRun,
  captureLead,
  qualifyLead,
  assignLead,
  initiateSale,
  executeWalletSplit,
  calculateCommission,
  schedulePayout,
  approvePayout,
  completePayout,
  updateWalletBalance,
  createWallet,
  updatePerformance,
  processEventWithAI,
  createAuditLog,
  executeFullPipeline,
  executeAutonomousFactoryRun,
  aggregateKPIs,
  DEFAULT_COMMISSION_RATES,
} from '@/services/systemFlowEngine';

// ─────────────────────────────────────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

interface SystemFlowStore extends SystemFlowState {
  factoryRuns: Record<string, AutonomousFactoryRun>;

  // ── Data actions ──
  captureLead: (params: Parameters<typeof captureLead>[0]) => Lead;
  qualifyAndAssignLead: (leadId: string, score: number, assignee: { id: string; type: 'reseller' | 'franchise' }) => Lead | null;
  processSale: (params: {
    leadId: string;
    userId: string;
    productId: string;
    productName: string;
    amount: number;
    walletIds: { reseller: string; franchise: string; boss: string };
    payoutCycle?: PayoutCycle;
  }) => { sale: Sale; split: WalletSplit; commission: CommissionRecord; payouts: PayoutRecord[] } | null;
  approvePayout: (payoutId: string, bossId: string) => void;
  executePayout: (payoutId: string) => void;
  addTraffic: (count: number) => void;

  // ── Wallet actions ──
  ensureWallet: (ownerId: string, ownerType: WalletType) => WalletEntry;
  creditWallet: (walletId: string, amount: number) => void;

  // ── Pipeline shortcut ──
  runFullPipeline: (params: Parameters<typeof executeFullPipeline>[0]) => ReturnType<typeof executeFullPipeline>;
  runAutonomousFactory: (params: { idea: string; target: BuildTarget; userId?: string | null }) => Promise<AutonomousFactoryRun>;
  getLatestFactoryRun: () => AutonomousFactoryRun | null;

  // ── Query helpers ──
  getWalletByOwner: (ownerId: string) => WalletEntry | null;
  getLeadById: (leadId: string) => Lead | null;
  getSaleById: (saleId: string) => Sale | null;
  getCommissionsBySale: (saleId: string) => CommissionRecord[];
  getPayoutsByOwner: (ownerId: string) => PayoutRecord[];
  getPendingPayouts: () => PayoutRecord[];
  getRecentEvents: (limit?: number) => FlowEvent[];
  getAIDecisions: (limit?: number) => AIDecision[];
  getPerformanceByEntity: (entityId: string) => PerformanceRecord | null;

  // ── KPI refresh ──
  refreshKPIs: () => void;

  // ── Reset (dev/demo) ──
  resetStore: () => void;
  seedDemoData: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState: SystemFlowState = {
  leads: {},
  sales: {},
  wallets: {},
  splits: {},
  commissions: {},
  payouts: {},
  events: [],
  aiDecisions: [],
  performance: {},
  auditLogs: [],
  kpis: {
    totalTraffic: 0,
    totalLeads: 0,
    qualifiedLeads: 0,
    assignedLeads: 0,
    convertedLeads: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    activeResellers: 0,
    activeFranchises: 0,
    aiActionsToday: 0,
    securityAlerts: 0,
  },
  flowHealth: [
    { layer: 'CONTROL',     status: 'healthy', throughput: 100, latency: 12 },
    { layer: 'ACQUISITION', status: 'healthy', throughput: 4800, latency: 45 },
    { layer: 'LEAD_ENGINE', status: 'healthy', throughput: 320, latency: 22 },
    { layer: 'DISTRIBUTION',status: 'healthy', throughput: 280, latency: 18 },
    { layer: 'PRODUCT',     status: 'healthy', throughput: 150, latency: 30 },
    { layer: 'TRANSACTION', status: 'healthy', throughput: 95,  latency: 55 },
    { layer: 'COMMISSION',  status: 'healthy', throughput: 95,  latency: 10 },
    { layer: 'PAYOUT',      status: 'healthy', throughput: 40,  latency: 200 },
    { layer: 'ANALYTICS',   status: 'healthy', throughput: 500, latency: 80 },
    { layer: 'AI_LOOP',     status: 'healthy', throughput: 1200, latency: 35 },
    { layer: 'SECURITY',    status: 'healthy', throughput: 2000, latency: 5 },
    { layer: 'DATA',        status: 'healthy', throughput: 5000, latency: 3 },
  ],
  lastUpdated: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function pushEvent(state: SystemFlowState, event: FlowEvent): FlowEvent[] {
  return [event, ...state.events].slice(0, 500); // keep last 500
}

function pushDecision(state: SystemFlowState, decision: AIDecision): AIDecision[] {
  return [decision, ...state.aiDecisions].slice(0, 200);
}

function emitEvent(
  state: SystemFlowState,
  type: FlowEventType,
  layer: FlowLayer,
  sourceId: string,
  payload: Record<string, any>,
): { event: FlowEvent; decision: AIDecision | null } {
  const event: FlowEvent = {
    eventId: `EVT-${Date.now().toString(36)}`,
    type,
    layer,
    sourceId,
    sourceType: 'store',
    correlationId: sourceId,
    payload,
    timestamp: new Date().toISOString(),
    processedByAI: false,
  };
  const decision = processEventWithAI(event);
  if (decision) {
    event.processedByAI = true;
    event.aiDecision = decision.action;
  }
  return { event, decision };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useSystemFlowStore = create<SystemFlowStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      factoryRuns: {},

      // ── Lead Capture ──────────────────────────────────────────────────────
      captureLead: (params) => {
        const lead = captureLead(params);
        const { event, decision } = emitEvent(get(), 'LEAD_CAPTURED', 'LEAD_ENGINE', lead.leadId, { source: params.source });
        set((s) => ({
          leads: { ...s.leads, [lead.leadId]: lead },
          events: pushEvent(s, event),
          aiDecisions: decision ? pushDecision(s, decision) : s.aiDecisions,
          kpis: { ...s.kpis, totalLeads: s.kpis.totalLeads + 1 },
          lastUpdated: new Date().toISOString(),
        }));
        return lead;
      },

      // ── Qualify + Assign ──────────────────────────────────────────────────
      qualifyAndAssignLead: (leadId, score, assignee) => {
        const existing = get().leads[leadId];
        if (!existing) return null;

        let lead = qualifyLead(existing, score);

        if (lead.status === 'rejected') {
          const { event, decision } = emitEvent(get(), 'LEAD_REJECTED', 'LEAD_ENGINE', leadId, { score });
          set((s) => ({
            leads: { ...s.leads, [leadId]: lead },
            events: pushEvent(s, event),
            aiDecisions: decision ? pushDecision(s, decision) : s.aiDecisions,
            lastUpdated: new Date().toISOString(),
          }));
          return lead;
        }

        lead = assignLead(lead, assignee);
        const { event, decision } = emitEvent(get(), 'LEAD_ASSIGNED', 'DISTRIBUTION', leadId, { assignee });

        set((s) => ({
          leads: { ...s.leads, [leadId]: lead },
          events: pushEvent(s, event),
          aiDecisions: decision ? pushDecision(s, decision) : s.aiDecisions,
          kpis: {
            ...s.kpis,
            qualifiedLeads: s.kpis.qualifiedLeads + 1,
            assignedLeads: s.kpis.assignedLeads + 1,
          },
          lastUpdated: new Date().toISOString(),
        }));
        return lead;
      },

      // ── Process Sale (L5→L8) ──────────────────────────────────────────────
      processSale: (params) => {
        const lead = get().leads[params.leadId];
        if (!lead || lead.status !== 'assigned') return null;

        // Ensure wallets exist
        const state = get();
        const resellerWalletId = params.walletIds.reseller;
        const franchiseWalletId = params.walletIds.franchise;
        const bossWalletId = params.walletIds.boss;

        // L5
        const sale = initiateSale({ lead, userId: params.userId, productId: params.productId, productName: params.productName, amount: params.amount });

        // L6
        const split = executeWalletSplit({ sale, resellerWalletId, franchiseWalletId, bossWalletId });

        // L7
        const commission = calculateCommission(sale, split);

        // L8
        const cycle = params.payoutCycle ?? 'weekly';
        const payouts: PayoutRecord[] = [];
        if (commission.resellerId) payouts.push(schedulePayout({ commission, walletId: resellerWalletId, ownerId: commission.resellerId, ownerType: 'reseller', amount: commission.resellerCommission, cycle }));
        if (commission.franchiseId) payouts.push(schedulePayout({ commission, walletId: franchiseWalletId, ownerId: commission.franchiseId, ownerType: 'franchise', amount: commission.franchiseCommission, cycle }));
        payouts.push(schedulePayout({ commission, walletId: bossWalletId, ownerId: 'boss', ownerType: 'boss', amount: commission.bossCommission, cycle }));

        // Performance update
        const perfKey = `${lead.assignedType}-${lead.assignedTo}`;
        const existingPerf = state.performance[perfKey] ?? null;
        const updatedPerf = lead.assignedTo
          ? updatePerformance(existingPerf, lead.assignedTo, lead.assignedType as any, sale, commission)
          : null;

        // Updated lead → converted
        const convertedLead: Lead = { ...lead, status: 'converted', convertedAt: new Date().toISOString() };

        // Audit log
        const audit = createAuditLog({ actorId: params.userId, actorType: 'user', action: 'SALE_COMPLETED', entityId: sale.saleId, entityType: 'sale', after: { amount: params.amount } });

        // Events
        const ev1 = emitEvent(state, 'SALE_INITIATED', 'PRODUCT', sale.saleId, { amount: params.amount });
        const ev2 = emitEvent(state, 'PAYMENT_RECEIVED', 'TRANSACTION', sale.saleId, { amount: params.amount });
        const ev3 = emitEvent(state, 'COMMISSION_CALCULATED', 'COMMISSION', commission.commissionId, {});

        const payoutObjectMap = Object.fromEntries(payouts.map(p => [p.payoutId, p]));
        const commissionMap = { [commission.commissionId]: commission };

        set((s) => {
          const newEvents = [ev3.event, ev2.event, ev1.event, ...s.events].slice(0, 500);
          const newDecisions = [ev1.decision, ev2.decision, ev3.decision]
            .filter(Boolean)
            .concat(s.aiDecisions)
            .slice(0, 200) as AIDecision[];

          return {
            leads: { ...s.leads, [convertedLead.leadId]: convertedLead },
            sales: { ...s.sales, [sale.saleId]: { ...sale, commissionId: commission.commissionId, status: 'fulfilled', paidAt: new Date().toISOString() } },
            splits: { ...s.splits, [split.splitId]: split },
            commissions: { ...s.commissions, ...commissionMap },
            payouts: { ...s.payouts, ...payoutObjectMap },
            performance: updatedPerf ? { ...s.performance, [perfKey]: updatedPerf } : s.performance,
            auditLogs: [audit, ...s.auditLogs].slice(0, 1000),
            events: newEvents,
            aiDecisions: newDecisions,
            kpis: {
              ...s.kpis,
              convertedLeads: s.kpis.convertedLeads + 1,
              totalSales: s.kpis.totalSales + 1,
              totalRevenue: s.kpis.totalRevenue + params.amount,
              totalCommissions: s.kpis.totalCommissions + commission.resellerCommission + commission.franchiseCommission + commission.bossCommission,
              pendingPayouts: s.kpis.pendingPayouts + payouts.reduce((t, p) => t + p.amount, 0),
            },
            lastUpdated: new Date().toISOString(),
          };
        });

        return { sale, split, commission, payouts };
      },

      // ── Approve Payout ────────────────────────────────────────────────────
      approvePayout: (payoutId, bossId) => {
        const payout = get().payouts[payoutId];
        if (!payout) return;
        const approved = approvePayout(payout, bossId);
        const { event, decision } = emitEvent(get(), 'PAYOUT_APPROVED', 'PAYOUT', payoutId, { bossId });
        set((s) => ({
          payouts: { ...s.payouts, [payoutId]: approved },
          events: pushEvent(s, event),
          aiDecisions: decision ? pushDecision(s, decision) : s.aiDecisions,
        }));
      },

      // ── Execute Payout (credit wallet) ───────────────────────────────────
      executePayout: (payoutId) => {
        const payout = get().payouts[payoutId];
        if (!payout || payout.status !== 'approved') return;
        const completed = completePayout(payout);
        const wallet = get().wallets[payout.walletId];
        const updatedWallet = wallet ? updateWalletBalance(wallet, payout.amount) : null;
        const { event, decision } = emitEvent(get(), 'PAYOUT_COMPLETED', 'PAYOUT', payoutId, { amount: payout.amount });
        set((s) => ({
          payouts: { ...s.payouts, [payoutId]: completed },
          wallets: updatedWallet ? { ...s.wallets, [payout.walletId]: updatedWallet } : s.wallets,
          events: pushEvent(s, event),
          aiDecisions: decision ? pushDecision(s, decision) : s.aiDecisions,
          kpis: {
            ...s.kpis,
            totalPayouts: s.kpis.totalPayouts + payout.amount,
            pendingPayouts: Math.max(0, s.kpis.pendingPayouts - payout.amount),
          },
        }));
      },

      // ── Traffic ───────────────────────────────────────────────────────────
      addTraffic: (count) => {
        set((s) => ({
          kpis: { ...s.kpis, totalTraffic: s.kpis.totalTraffic + count },
          lastUpdated: new Date().toISOString(),
        }));
      },

      // ── Wallet ────────────────────────────────────────────────────────────
      ensureWallet: (ownerId, ownerType) => {
        const existing = Object.values(get().wallets).find(w => w.ownerId === ownerId);
        if (existing) return existing;
        const wallet = createWallet(ownerId, ownerType);
        set((s) => ({ wallets: { ...s.wallets, [wallet.walletId]: wallet } }));
        return wallet;
      },

      creditWallet: (walletId, amount) => {
        const wallet = get().wallets[walletId];
        if (!wallet) return;
        const updated = updateWalletBalance(wallet, amount);
        set((s) => ({ wallets: { ...s.wallets, [walletId]: updated } }));
      },

      // ── Full Pipeline Shortcut ────────────────────────────────────────────
      runFullPipeline: (params) => {
        const result = executeFullPipeline(params);
        const { lead, sale, split, commission, payouts, events, aiDecisions, auditLogs } = result;

        const payoutMap = Object.fromEntries(payouts.map(p => [p.payoutId, p]));
        const perfKey = `${lead.assignedType}-${lead.assignedTo}`;

        set((s) => ({
          leads: { ...s.leads, [lead.leadId]: lead },
          sales: { ...s.sales, [sale.saleId]: sale },
          splits: { ...s.splits, [split.splitId]: split },
          commissions: { ...s.commissions, [commission.commissionId]: commission },
          payouts: { ...s.payouts, ...payoutMap },
          events: [...events, ...s.events].slice(0, 500),
          aiDecisions: [...aiDecisions, ...s.aiDecisions].slice(0, 200),
          auditLogs: [...auditLogs, ...s.auditLogs].slice(0, 1000),
          kpis: {
            ...s.kpis,
            totalLeads: s.kpis.totalLeads + 1,
            totalSales: lead.status !== 'rejected' ? s.kpis.totalSales + 1 : s.kpis.totalSales,
            totalRevenue: s.kpis.totalRevenue + sale.amount,
            totalCommissions: s.kpis.totalCommissions + commission.resellerCommission + commission.franchiseCommission + commission.bossCommission,
          },
          lastUpdated: new Date().toISOString(),
        }));

        return result;
      },

      runAutonomousFactory: async (params) => {
        const result = await executeAutonomousFactoryRun(params);
        const newAlerts = result.alerts ?? [];
        const securityAlertCount = newAlerts.filter((alert) => alert.severity === 'high' || alert.severity === 'critical').length;
        set((s) => ({
          factoryRuns: {
            ...s.factoryRuns,
            [result.runId]: result,
          },
          events: [
            ...newAlerts.map((alert) => ({
              eventId: `EVT-VALA-ALERT-${alert.id}`,
              type: 'SECURITY_ALERT' as const,
              layer: 'SECURITY' as const,
              sourceId: result.runId,
              sourceType: 'vala_factory_alert',
              correlationId: result.runId,
              payload: {
                severity: alert.severity,
                code: alert.code,
                message: alert.message,
                stage: alert.stage ?? null,
              },
              timestamp: new Date().toISOString(),
              processedByAI: true,
              aiDecision: 'send_alert',
            })),
            {
              eventId: `EVT-VALA-${Date.now().toString(36)}`,
              type: 'AI_DECISION',
              layer: 'AI_LOOP',
              sourceId: result.runId,
              sourceType: 'vala_factory',
              correlationId: result.runId,
              payload: {
                target: result.target,
                status: result.status,
                hardRules: result.hardRules,
                alerts: result.alerts,
                controlBusEvents: result.controlBus.length,
                eventStoreEntries: result.eventStore.length,
                twinPassed: result.digitalTwin.filter((item) => item.simulationPassed).length,
                taskGraph: {
                  completed: result.taskGraph.completed,
                  failed: result.taskGraph.failed,
                },
                loopState: result.loopState,
                consistencyMode: result.consistencyModel.defaultMode,
                idp: {
                  ssoEnabled: result.identityProvider.ssoEnabled,
                  methods: result.identityProvider.methods,
                },
                scaling: {
                  action: result.scalingPlan.scaleAction,
                  desiredReplicas: result.scalingPlan.desiredReplicas,
                  costAction: result.scalingPlan.costAware.action,
                },
                circuitBreaker: {
                  state: result.circuitBreaker.state,
                  tripped: result.circuitBreaker.tripped,
                },
                sandbox: {
                  passed: result.sandboxExecution.passed,
                  promotedToLive: result.sandboxExecution.promotedToLive,
                },
                policyDecision: result.policyEngine.decision,
                overrideRequired: result.humanOverride.required,
                ethicsPassed: result.ethicsGuardrails.passed,
                timeTravel: {
                  replayableEvents: result.timeTravelDebugging.replayableEvents,
                  exactReconstruction: result.timeTravelDebugging.exactStateReconstruction,
                },
                chaos: {
                  resilienceScore: result.chaosEngine.resilienceScore,
                  injections: result.chaosEngine.injections.length,
                },
                cost: {
                  totalUsd: result.costEngine.totalCostUsd,
                  decision: result.costEngine.optimizationDecision,
                },
                contracts: {
                  blockDeploy: result.dataContractEnforcer.blockDeploy,
                  total: result.dataContractEnforcer.contracts.length,
                },
                meteringReady: result.featureUsageMetering.billingReady,
                secretRotationAt: result.secretManagement.nextRotationAt,
                edgeP95: Math.min(...result.edgeDelivery.regions.map((region) => region.p95LatencyMs)),
                offlineSync: {
                  queued: result.offlineModeSync.localQueuedOps,
                  synced: result.offlineModeSync.syncedOps,
                },
                failover: {
                  status: result.multiRegionFailover.status,
                  currentRegion: result.multiRegionFailover.currentRegion,
                },
                complianceViolations: result.legalCompliance.violations.length,
                anonymization: result.dataAnonymization.status,
                learningSignals: result.learningFeedbackLoop.signalsCollected,
                signature: {
                  signedActions: result.digitalSignature.signedActions,
                  nonRepudiation: result.digitalSignature.nonRepudiation,
                },
                trust: result.trustScore,
                behavior: {
                  anomalies: result.behaviorEngine.anomaliesDetected,
                  restricted: result.behaviorEngine.restrictedEntities.length,
                },
                dataRepair: {
                  detected: result.autoDataRepair.detectedCorruptRecords,
                  repaired: result.autoDataRepair.repairedRecords,
                },
                schemaEvolution: {
                  blocked: result.schemaEvolution.blocked,
                  targetVersion: result.schemaEvolution.targetVersion,
                },
                latencyRouting: {
                  region: result.latencyAwareRouting.selectedRegion,
                  reason: result.latencyAwareRouting.reason,
                },
                memoryPatterns: result.memoryEngine.longTermPatterns.length,
                simulationApproved: result.simulationEngine.approvedForApply,
                marketStrategyCount: result.marketIntelligence.strategySuggestions.length,
                docsVersion: result.autoDocumentation.docVersion,
                explanationSummary: result.explanationLayer.summary,
                governance: {
                  authority: result.systemGovernance.activeAuthority,
                  autonomyLevel: result.systemGovernance.autonomyLevel,
                },
                negotiation: {
                  offers: result.autonomousNegotiation.offersEvaluated,
                  acceptedRate: result.autonomousNegotiation.acceptedDealRate,
                },
                selfUi: {
                  variants: result.selfEvolvingUI.uiVariantsTested,
                  promoted: result.selfEvolvingUI.promotedVariant,
                },
                contextualAccessChallenges: result.contextualAccess.decisions.filter((d) => d.outcome === 'challenge').length,
                intentPrediction: {
                  top: result.intentPrediction.topIntents[0]?.intent ?? 'none',
                  preloaded: result.intentPrediction.preloadedActions.length,
                },
                zeroTrustDenied: result.zeroTrustNetwork.deniedRequests,
                dataMarketplaceAssets: result.dataMarketplace.assetsPublished,
                sla: {
                  breaches: result.autoSlaEnforcer.breachesDetected,
                  escalations: result.autoSlaEnforcer.escalationsTriggered,
                },
                failurePredictionRisk: result.failurePrediction.riskScore,
                energyMode: result.energyResourceOptimizer.optimizationMode,
                collab: {
                  sessions: result.realTimeCollab.activeSessions,
                  syncLatencyMs: result.realTimeCollab.syncLatencyMs,
                },
                metaLearningVersion: result.metaLearning.learningStrategyVersion,
                orchestrationBrain: result.globalOrchestrationBrain.brainState,
                selfAware: {
                  confidence: result.selfAwareSystem.selfModelConfidence,
                  safetyMargin: result.selfAwareSystem.limitProfile.currentSafetyMargin,
                },
                intentAlignmentScore: result.intentAlignment.actionAlignmentScore,
                parallelReality: {
                  scenarios: result.parallelRealitySimulation.scenarios.length,
                  selected: result.parallelRealitySimulation.selectedRealityId,
                },
                zkExecutionProtectedOps: result.zeroKnowledgeExecution.protectedOperations,
                compatibilityScore: result.universalCompatibility.compatibilityScore,
                infiniteScaleIndex: result.infiniteScaling.theoreticalScaleIndex,
                perfectFailurePredictionConfidence: result.perfectFailurePrediction.detectionConfidence,
                businessEvolution: result.autoBusinessEvolution.selectedModel,
                coDecisionAuthority: result.humanAiCoDecision.finalAuthority,
                absoluteGovernanceProof: {
                  aligned: result.absoluteGovernance.ruleAlignmentProof,
                  proofHash: result.absoluteGovernance.proofHash,
                },
                universalModel: {
                  coverage: result.universalModelAbstraction.abstractionCoverageScore,
                  domains: result.universalModelAbstraction.domainsRepresented.length,
                },
                selfRewriteSafe: result.selfRewritingCore.safeRewriteProof,
                intentToRealityMs: result.intentToReality.ideaToExecutableMs,
                causalFieldChains: result.causalSimulationField.simulatedChains,
                zeroLatencyIdealMs: result.zeroLatencyIdeal.effectiveLatencyMs,
                knowledgeGraph: {
                  entities: result.perfectKnowledgeGraph.entities,
                  completeness: result.perfectKnowledgeGraph.completenessScore,
                },
                errorLessBudget: result.errorLessComputation.runtimeErrorBudget,
                infiniteMemoryEvents: result.infiniteMemoryModel.historicalEventsRetained,
                totalStateVisible: result.totalStateVisibility.visibilityProof,
                absoluteOptimality: result.absoluteDecisionOptimality.optimalityScore,
                selfConstraintInterventions: result.selfConstraint.interventionCount,
                universalGovernanceLawBound: result.universalGovernanceLaw.allActionsBound,
              },
              timestamp: new Date().toISOString(),
              processedByAI: true,
              aiDecision: result.status === 'success' ? 'optimize_pipeline' : 'trigger_recovery',
            },
            ...s.events,
          ].slice(0, 500),
          kpis: {
            ...s.kpis,
            aiActionsToday: s.kpis.aiActionsToday + 1,
            securityAlerts: s.kpis.securityAlerts + securityAlertCount,
          },
          lastUpdated: new Date().toISOString(),
        }));
        return result;
      },

      getLatestFactoryRun: () => {
        const runs = Object.values(get().factoryRuns);
        if (runs.length === 0) return null;
        return [...runs].sort((a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
        )[0] ?? null;
      },

      // ── Query Helpers ────────────────────────────────────────────────────
      getWalletByOwner: (ownerId) =>
        Object.values(get().wallets).find(w => w.ownerId === ownerId) ?? null,

      getLeadById: (leadId) => get().leads[leadId] ?? null,
      getSaleById: (saleId) => get().sales[saleId] ?? null,

      getCommissionsBySale: (saleId) =>
        Object.values(get().commissions).filter(c => c.saleId === saleId),

      getPayoutsByOwner: (ownerId) =>
        Object.values(get().payouts).filter(p => p.ownerId === ownerId),

      getPendingPayouts: () =>
        Object.values(get().payouts).filter(p => p.status === 'pending' || p.status === 'approved'),

      getRecentEvents: (limit = 50) => get().events.slice(0, limit),

      getAIDecisions: (limit = 30) => get().aiDecisions.slice(0, limit),

      getPerformanceByEntity: (entityId) =>
        Object.values(get().performance).find(p => p.entityId === entityId) ?? null,

      // ── KPI Refresh ───────────────────────────────────────────────────────
      refreshKPIs: () => {
        const kpis = aggregateKPIs(get());
        set({ kpis, lastUpdated: new Date().toISOString() });
      },

      // ── Reset ────────────────────────────────────────────────────────────
      resetStore: () => set({ ...initialState, lastUpdated: new Date().toISOString() }),

      // ── Seed Demo Data ───────────────────────────────────────────────────
      seedDemoData: () => {
        const store = get();

        // Create wallets
        const resellerWallet = createWallet('reseller-001', 'reseller');
        const franchiseWallet = createWallet('franchise-001', 'franchise');
        const bossWallet = createWallet('boss', 'boss');
        const userWallet = createWallet('user-001', 'user');

        const wallets: Record<string, WalletEntry> = {
          [resellerWallet.walletId]: { ...resellerWallet, balance: 12400, totalEarned: 45800 },
          [franchiseWallet.walletId]: { ...franchiseWallet, balance: 8900, totalEarned: 103200 },
          [bossWallet.walletId]: { ...bossWallet, balance: 284500, totalEarned: 998400 },
          [userWallet.walletId]: { ...userWallet, balance: 1200, totalEarned: 5400 },
        };

        // Run 5 demo pipelines
        const pipelines = [
          { source: 'seo' as const, region: 'Asia', country: 'India', score: 78, amount: 2400, product: 'Restaurant POS' },
          { source: 'ads' as const, region: 'Europe', country: 'Germany', score: 85, amount: 5800, product: 'School ERP' },
          { source: 'referral' as const, region: 'Americas', country: 'Brazil', score: 62, amount: 1200, product: 'CRM Suite' },
          { source: 'campaign' as const, region: 'Asia', country: 'Philippines', score: 91, amount: 8500, product: 'Hospital HMS' },
          { source: 'manual' as const, region: 'Africa', country: 'Nigeria', score: 44, amount: 0, product: 'N/A' },
        ];

        let allLeads: Record<string, Lead> = {};
        let allSales: Record<string, Sale> = {};
        let allSplits: Record<string, WalletSplit> = {};
        let allCommissions: Record<string, CommissionRecord> = {};
        let allPayouts: Record<string, PayoutRecord> = {};
        let allEvents: FlowEvent[] = [];
        let allDecisions: AIDecision[] = [];
        let allAudit: AuditLog[] = [];
        let allPerformance: Record<string, PerformanceRecord> = {};

        let totalRevenue = 0;
        let totalSales = 0;
        let totalComm = 0;
        let pendingPO = 0;
        let convertedLeads = 0;
        let qualifiedLeads = 0;

        pipelines.forEach((p, i) => {
          const result = executeFullPipeline({
            leadSource: p.source,
            region: p.region,
            country: p.country,
            aiScore: p.score,
            assignee: { id: 'reseller-001', type: 'reseller' },
            userId: `user-00${i + 1}`,
            productId: `prod-00${i + 1}`,
            productName: p.product,
            saleAmount: p.amount,
            walletMap: { resellerWalletId: resellerWallet.walletId, franchiseWalletId: franchiseWallet.walletId, bossWalletId: bossWallet.walletId },
            payoutCycle: 'weekly',
          });

          allLeads[result.lead.leadId] = result.lead;
          allSales[result.sale.saleId] = result.sale;
          allSplits[result.split.splitId] = result.split;
          allCommissions[result.commission.commissionId] = result.commission;
          result.payouts.forEach(po => { allPayouts[po.payoutId] = po; });
          allEvents = [...result.events, ...allEvents];
          allDecisions = [...result.aiDecisions, ...allDecisions];
          allAudit = [...result.auditLogs, ...allAudit];

          if (result.lead.status !== 'rejected') {
            qualifiedLeads++;
            if (result.lead.status === 'converted' || result.sale.amount > 0) convertedLeads++;
            totalRevenue += result.sale.amount;
            totalSales++;
            totalComm += result.commission.resellerCommission + result.commission.franchiseCommission + result.commission.bossCommission;
            pendingPO += result.payouts.reduce((t, po) => t + po.amount, 0);
          }
        });

        // Performance records (demo)
        allPerformance['reseller-reseller-001'] = {
          entityId: 'reseller-001',
          entityType: 'reseller',
          period: new Date().toISOString().slice(0, 7),
          sales: 48,
          revenue: 124500,
          leadsReceived: 62,
          leadsConverted: 48,
          conversionRate: 77.4,
          earnings: 18675,
          rating: 4.7,
          growth: 23.5,
          rank: 3,
        };
        allPerformance['franchise-franchise-001'] = {
          entityId: 'franchise-001',
          entityType: 'franchise',
          period: new Date().toISOString().slice(0, 7),
          sales: 189,
          revenue: 892400,
          leadsReceived: 240,
          leadsConverted: 189,
          conversionRate: 78.75,
          earnings: 71392,
          rating: 4.9,
          growth: 31.2,
          rank: 1,
        };

        set({
          leads: allLeads,
          sales: allSales,
          wallets,
          splits: allSplits,
          commissions: allCommissions,
          payouts: allPayouts,
          events: allEvents.slice(0, 500),
          aiDecisions: allDecisions.slice(0, 200),
          performance: allPerformance,
          auditLogs: allAudit.slice(0, 1000),
          kpis: {
            totalTraffic: 48200,
            totalLeads: Object.keys(allLeads).length,
            qualifiedLeads,
            assignedLeads: qualifiedLeads,
            convertedLeads,
            totalSales,
            totalRevenue,
            totalCommissions: totalComm,
            totalPayouts: 0,
            pendingPayouts: pendingPO,
            activeResellers: 1,
            activeFranchises: 1,
            aiActionsToday: allDecisions.length,
            securityAlerts: 0,
          },
          flowHealth: initialState.flowHealth,
          lastUpdated: new Date().toISOString(),
        });
      },
    }),
    {
      name: 'system-flow-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        leads: state.leads,
        sales: state.sales,
        wallets: state.wallets,
        commissions: state.commissions,
        payouts: state.payouts,
        kpis: state.kpis,
        performance: state.performance,
        factoryRuns: state.factoryRuns,
      }),
    },
  ),
);
