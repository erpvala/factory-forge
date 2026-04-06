// @ts-nocheck
/**
 * SYSTEM FLOW DASHBOARD — MAIN HUB
 * The GOD MODE command center for the entire Software Factory
 * All 12 layers accessible from one unified interface
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import SystemFlowVisualizer from './SystemFlowVisualizer';
import WalletSplitPanel from './WalletSplitPanel';
import CommissionTracker from './CommissionTracker';
import PayoutEnginePanel from './PayoutEnginePanel';
import AIEventLoop from './AIEventLoop';
import PerformanceAnalytics from './PerformanceAnalytics';
import {
  Activity, Wallet, Calculator, Banknote, Bot, BarChart3,
  Play, RefreshCw, Layers, Zap, Crown, Shield, Database,
  Users, TrendingUp, Building2, Store, ShoppingCart,
  CheckCircle, AlertTriangle, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────

type Tab =
  | 'overview'
  | 'wallet'
  | 'commission'
  | 'payout'
  | 'ai-loop'
  | 'analytics';

const TABS: { id: Tab; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'overview',    label: 'Flow Overview',  icon: Activity,    color: 'text-cyan-400' },
  { id: 'wallet',      label: 'Wallets',         icon: Wallet,      color: 'text-green-400' },
  { id: 'commission',  label: 'Commission',      icon: Calculator,  color: 'text-teal-400' },
  { id: 'payout',      label: 'Payouts',         icon: Banknote,    color: 'text-orange-400' },
  { id: 'ai-loop',     label: 'Vala AI Loop',    icon: Bot,         color: 'text-violet-400' },
  { id: 'analytics',   label: 'Analytics',       icon: BarChart3,   color: 'text-sky-400' },
];

// ─────────────────────────────────────────────────────────────────────────────

function PipelineSimulator() {
  const runFullPipeline = useSystemFlowStore(s => s.runFullPipeline);
  const runAutonomousFactory = useSystemFlowStore(s => s.runAutonomousFactory);
  const getLatestFactoryRun = useSystemFlowStore(s => s.getLatestFactoryRun);
  const seedDemoData = useSystemFlowStore(s => s.seedDemoData);
  const resetStore = useSystemFlowStore(s => s.resetStore);
  const ensureWallet = useSystemFlowStore(s => s.ensureWallet);
  const [running, setRunning] = useState(false);
  const [factoryRunning, setFactoryRunning] = useState(false);
  const [factoryTarget, setFactoryTarget] = useState<'web' | 'apk' | 'software'>('web');
  const [factoryIdea, setFactoryIdea] = useState('AI-powered support + wallet + marketplace platform');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastFactoryResult, setLastFactoryResult] = useState<string | null>(null);

  const PRODUCTS = [
    { id: 'prod-pos-001',    name: 'Restaurant POS',  price: 2400 },
    { id: 'prod-erp-001',    name: 'School ERP',      price: 5800 },
    { id: 'prod-crm-001',    name: 'CRM Suite',       price: 1200 },
    { id: 'prod-hms-001',    name: 'Hospital HMS',    price: 8500 },
    { id: 'prod-hr-001',     name: 'HR Platform',     price: 3200 },
  ];

  const SOURCES: Array<'seo' | 'ads' | 'referral' | 'campaign' | 'manual'> = ['seo', 'ads', 'referral', 'campaign', 'manual'];
  const REGIONS = [
    { region: 'Asia', country: 'India' },
    { region: 'Europe', country: 'Germany' },
    { region: 'Americas', country: 'Brazil' },
    { region: 'Africa', country: 'Nigeria' },
    { region: 'Asia', country: 'Philippines' },
  ];

  const handleRun = async () => {
    setRunning(true);
    setLastResult(null);

    // Ensure wallets exist
    const rw = ensureWallet('reseller-001', 'reseller');
    const fw = ensureWallet('franchise-001', 'franchise');
    const bw = ensureWallet('boss', 'boss');

    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    const location = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const score = Math.floor(Math.random() * 60) + 40; // 40–100

    try {
      const result = runFullPipeline({
        leadSource: source,
        region: location.region,
        country: location.country,
        aiScore: score,
        assignee: { id: 'reseller-001', type: 'reseller' },
        userId: `usr-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        saleAmount: product.price,
        walletMap: {
          resellerWalletId: rw.walletId,
          franchiseWalletId: fw.walletId,
          bossWalletId: bw.walletId,
        },
        payoutCycle: 'weekly',
      });

      const status = result.lead.status === 'rejected'
        ? `Lead rejected (score ${score})`
        : `✅ Sale $${product.price} · ${product.name} · ${result.payouts.length} payouts scheduled`;

      setLastResult(status);
    } catch (e) {
      setLastResult('Pipeline error');
    }

    setRunning(false);
  };

  const latestFactoryRun = getLatestFactoryRun();

  const handleFactoryRun = async () => {
    if (factoryRunning || !factoryIdea.trim()) return;
    setFactoryRunning(true);
    setLastFactoryResult(null);
    try {
      const run = await runAutonomousFactory({
        idea: factoryIdea.trim(),
        target: factoryTarget,
        userId: 'system-flow-dashboard',
      });
      setLastFactoryResult(
        run.status === 'success'
          ? `✅ ${run.target.toUpperCase()} factory run complete (${run.runId.slice(0, 8)})`
          : `Factory run failed (${run.runId.slice(0, 8)})`,
      );
    } catch {
      setLastFactoryResult('Factory run failed unexpectedly');
    }
    setFactoryRunning(false);
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-white">Pipeline Simulator</h3>
        <span className="text-xs text-slate-400">Run end-to-end flow in one click</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30"
          onClick={handleRun}
          disabled={running}
        >
          {running ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Zap className="h-3 w-3 mr-1.5" />}
          Run Pipeline
        </Button>

        <Button
          size="sm"
          className="bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 border border-violet-500/30"
          onClick={() => { seedDemoData(); setLastResult('Demo data seeded — 5 pipelines loaded'); }}
        >
          <Database className="h-3 w-3 mr-1.5" />
          Seed Demo Data
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="text-slate-400 border-slate-700 hover:bg-white/5 text-xs"
          onClick={() => { resetStore(); setLastResult('Store reset'); }}
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Reset
        </Button>
      </div>

      <div className="mt-2 border-t border-cyan-500/20 pt-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-semibold text-violet-300">VALA Autonomous Factory</h4>
          <span className="text-[11px] text-slate-400">Idea → Spec → Code → Test → Build → Deploy → Monitor → Heal</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
          <input
            value={factoryIdea}
            onChange={(e) => setFactoryIdea(e.target.value)}
            placeholder="Describe factory goal or bug"
            className="h-9 rounded-md bg-black/30 border border-white/10 px-3 text-sm text-white placeholder:text-slate-500"
            disabled={factoryRunning}
          />
          <div className="flex items-center gap-2">
            {(['web', 'apk', 'software'] as const).map((target) => (
              <button
                key={target}
                onClick={() => setFactoryTarget(target)}
                disabled={factoryRunning}
                className={cn(
                  'h-9 px-3 rounded-md text-xs uppercase border transition-colors',
                  factoryTarget === target
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10',
                )}
              >
                {target}
              </button>
            ))}
            <Button
              size="sm"
              className="h-9 bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 border border-violet-500/30"
              onClick={handleFactoryRun}
              disabled={factoryRunning || !factoryIdea.trim()}
            >
              {factoryRunning ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Bot className="h-3 w-3 mr-1.5" />}
              Run VALA
            </Button>
          </div>
        </div>

        {latestFactoryRun && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Latest Run:</span>
              <span className="text-white font-medium">{latestFactoryRun.runId}</span>
              <span className={cn(
                'px-2 py-0.5 rounded border uppercase',
                latestFactoryRun.status === 'success'
                  ? 'text-green-300 border-green-500/30 bg-green-500/10'
                  : 'text-red-300 border-red-500/30 bg-red-500/10',
              )}>
                {latestFactoryRun.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {latestFactoryRun.stages.map((stage) => (
                <div
                  key={stage.stage}
                  className={cn(
                    'rounded-md border px-2 py-2',
                    stage.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                    stage.status === 'running' ? 'bg-blue-500/5 border-blue-500/20' :
                    stage.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-white/5 border-white/10',
                  )}
                >
                  <p className="text-[10px] uppercase text-slate-400">{stage.stage}</p>
                  <p className="text-[11px] text-white capitalize">{stage.status}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Idempotent', ok: latestFactoryRun.hardRules.idempotentOperations },
                { label: 'Saga', ok: latestFactoryRun.hardRules.sagaTransactions === 'committed' },
                { label: 'UUID', ok: latestFactoryRun.hardRules.uuidEverywhere },
                { label: 'Zero 404', ok: latestFactoryRun.hardRules.zero404 },
                { label: 'Test Gate', ok: latestFactoryRun.hardRules.changesTestedBeforeRelease },
              ].map((rule) => (
                <div
                  key={rule.label}
                  className={cn(
                    'rounded-md border px-2 py-2',
                    rule.ok ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
                  )}
                >
                  <p className="text-[10px] uppercase text-slate-500">{rule.label}</p>
                  <p className={cn('text-xs font-medium', rule.ok ? 'text-green-300' : 'text-red-300')}>
                    {rule.ok ? 'PASS' : 'FAIL'}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Control Bus</p>
                <p className="text-sm text-cyan-300 font-semibold">{latestFactoryRun.controlBus.length} events</p>
              </div>
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Event Store</p>
                <p className="text-sm text-blue-300 font-semibold">append-only · {latestFactoryRun.eventStore.length}</p>
              </div>
              <div className="rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Digital Twin</p>
                <p className="text-sm text-violet-300 font-semibold">
                  {latestFactoryRun.digitalTwin.filter((item) => item.simulationPassed).length}/{latestFactoryRun.digitalTwin.length} pass
                </p>
              </div>
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Task Graph</p>
                <p className="text-sm text-emerald-300 font-semibold">
                  {latestFactoryRun.taskGraph.completed} done · {latestFactoryRun.taskGraph.failed} failed
                </p>
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Absolute Loop State</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {Object.entries(latestFactoryRun.loopState)
                  .filter(([key]) => key !== 'neverStops')
                  .map(([key, value]) => (
                    <div key={key} className="rounded border border-white/10 bg-black/20 px-2 py-1.5">
                      <p className="text-[10px] uppercase text-slate-500">{key}</p>
                      <p className={cn('text-xs capitalize', value === 'ok' ? 'text-green-300' : 'text-yellow-300')}>
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Consistency</p>
                <p className="text-xs text-cyan-300">default {latestFactoryRun.consistencyModel.defaultMode}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Identity Provider</p>
                <p className="text-xs text-blue-300">
                  {latestFactoryRun.identityProvider.ssoEnabled ? 'SSO enabled' : 'SSO disabled'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Scaling</p>
                <p className="text-xs text-emerald-300">
                  {latestFactoryRun.scalingPlan.scaleAction} · {latestFactoryRun.scalingPlan.desiredReplicas} replicas
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Circuit Breaker</p>
                <p className={cn('text-xs', latestFactoryRun.circuitBreaker.tripped ? 'text-red-300' : 'text-green-300')}>
                  {latestFactoryRun.circuitBreaker.state}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Policy Engine</p>
                <p className={cn(
                  'text-xs uppercase',
                  latestFactoryRun.policyEngine.decision === 'allow' ? 'text-green-300' :
                  latestFactoryRun.policyEngine.decision === 'review' ? 'text-yellow-300' : 'text-red-300',
                )}>
                  {latestFactoryRun.policyEngine.decision}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Sandbox</p>
                <p className={cn('text-xs', latestFactoryRun.sandboxExecution.passed ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.sandboxExecution.passed ? 'passed' : 'failed'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Human Override</p>
                <p className={cn('text-xs', latestFactoryRun.humanOverride.required ? 'text-yellow-300' : 'text-green-300')}>
                  {latestFactoryRun.humanOverride.required ? 'required' : 'not required'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Ethics Guardrails</p>
                <p className={cn('text-xs', latestFactoryRun.ethicsGuardrails.passed ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.ethicsGuardrails.passed ? 'passed' : 'blocked'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Time Travel Debug</p>
                <p className="text-xs text-cyan-300">{latestFactoryRun.timeTravelDebugging.replayableEvents} replay events</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Chaos Engine</p>
                <p className="text-xs text-orange-300">score {latestFactoryRun.chaosEngine.resilienceScore}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Cost Engine</p>
                <p className="text-xs text-emerald-300">${latestFactoryRun.costEngine.totalCostUsd.toFixed(2)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Contracts</p>
                <p className={cn('text-xs', latestFactoryRun.dataContractEnforcer.blockDeploy ? 'text-red-300' : 'text-green-300')}>
                  {latestFactoryRun.dataContractEnforcer.blockDeploy ? 'deploy blocked' : 'deploy allowed'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Offline Sync</p>
                <p className="text-xs text-blue-300">{latestFactoryRun.offlineModeSync.syncedOps} synced</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Failover</p>
                <p className={cn('text-xs', latestFactoryRun.multiRegionFailover.failoverTriggered ? 'text-yellow-300' : 'text-green-300')}>
                  {latestFactoryRun.multiRegionFailover.status}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Compliance</p>
                <p className={cn('text-xs', latestFactoryRun.legalCompliance.violations.length === 0 ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.legalCompliance.violations.length === 0 ? 'clean' : 'violation'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Learning Loop</p>
                <p className="text-xs text-violet-300">{latestFactoryRun.learningFeedbackLoop.signalsCollected} signals</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Digital Signature</p>
                <p className="text-xs text-cyan-300">{latestFactoryRun.digitalSignature.signedActions} signed</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Trust Score</p>
                <p className={cn(
                  'text-xs uppercase',
                  latestFactoryRun.trustScore.riskLevel === 'low' ? 'text-green-300' :
                  latestFactoryRun.trustScore.riskLevel === 'medium' ? 'text-yellow-300' : 'text-red-300',
                )}>
                  user {latestFactoryRun.trustScore.user} · {latestFactoryRun.trustScore.riskLevel}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Behavior Engine</p>
                <p className="text-xs text-orange-300">{latestFactoryRun.behaviorEngine.anomaliesDetected} anomalies</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Data Repair</p>
                <p className="text-xs text-emerald-300">{latestFactoryRun.autoDataRepair.repairedRecords} repaired</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Schema Evolution</p>
                <p className={cn('text-xs', latestFactoryRun.schemaEvolution.blocked ? 'text-red-300' : 'text-green-300')}>
                  {latestFactoryRun.schemaEvolution.targetVersion}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Latency Routing</p>
                <p className="text-xs text-blue-300">{latestFactoryRun.latencyAwareRouting.selectedRegion}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Simulation</p>
                <p className={cn('text-xs', latestFactoryRun.simulationEngine.approvedForApply ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.simulationEngine.approvedForApply ? 'approved' : 'blocked'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Governance</p>
                <p className="text-xs text-violet-300">{latestFactoryRun.systemGovernance.activeAuthority}</p>
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">AI Explanation Layer</p>
              <p className="text-xs text-slate-200 mt-1">{latestFactoryRun.explanationLayer.summary}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Negotiation</p>
                <p className="text-xs text-green-300">{Math.round(latestFactoryRun.autonomousNegotiation.acceptedDealRate * 100)}% accepted</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Self-Evolving UI</p>
                <p className="text-xs text-cyan-300">{latestFactoryRun.selfEvolvingUI.promotedVariant}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Contextual Access</p>
                <p className="text-xs text-yellow-300">
                  {latestFactoryRun.contextualAccess.decisions.filter((d) => d.outcome === 'challenge').length} challenges
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Intent Prediction</p>
                <p className="text-xs text-blue-300">{latestFactoryRun.intentPrediction.topIntents[0]?.intent ?? 'none'}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Zero-Trust</p>
                <p className="text-xs text-red-300">denied {latestFactoryRun.zeroTrustNetwork.deniedRequests}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Data Marketplace</p>
                <p className="text-xs text-emerald-300">{latestFactoryRun.dataMarketplace.assetsPublished} assets</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Auto SLA</p>
                <p className="text-xs text-orange-300">{latestFactoryRun.autoSlaEnforcer.escalationsTriggered} escalations</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Failure Prediction</p>
                <p className="text-xs text-violet-300">risk {latestFactoryRun.failurePrediction.riskScore}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Energy Optimizer</p>
                <p className="text-xs text-lime-300">{latestFactoryRun.energyResourceOptimizer.optimizationMode}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Live Collab</p>
                <p className="text-xs text-sky-300">{latestFactoryRun.realTimeCollab.activeSessions} sessions</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Meta Learning</p>
                <p className="text-xs text-fuchsia-300">{latestFactoryRun.metaLearning.learningStrategyVersion}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Orchestration Brain</p>
                <p className="text-xs text-indigo-300">{latestFactoryRun.globalOrchestrationBrain.brainState}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Self-Aware Model</p>
                <p className="text-xs text-cyan-300">{Math.round(latestFactoryRun.selfAwareSystem.selfModelConfidence * 100)}% confidence</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Intent Alignment</p>
                <p className="text-xs text-emerald-300">{Math.round(latestFactoryRun.intentAlignment.actionAlignmentScore * 100)}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Parallel Realities</p>
                <p className="text-xs text-violet-300">{latestFactoryRun.parallelRealitySimulation.scenarios.length} scenarios</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Zero-Knowledge Exec</p>
                <p className="text-xs text-blue-300">{latestFactoryRun.zeroKnowledgeExecution.protectedOperations} protected ops</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Compatibility</p>
                <p className="text-xs text-lime-300">{Math.round(latestFactoryRun.universalCompatibility.compatibilityScore * 100)} score</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Infinite Scaling</p>
                <p className="text-xs text-orange-300">index {latestFactoryRun.infiniteScaling.theoreticalScaleIndex}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Perfect Prediction</p>
                <p className="text-xs text-fuchsia-300">{Math.round(latestFactoryRun.perfectFailurePrediction.detectionConfidence * 100)}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Business Evolution</p>
                <p className="text-xs text-yellow-300">{latestFactoryRun.autoBusinessEvolution.selectedModel}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Human-AI Co-Decision</p>
                <p className="text-xs text-sky-300">{latestFactoryRun.humanAiCoDecision.finalAuthority}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Absolute Governance</p>
                <p className={cn('text-xs', latestFactoryRun.absoluteGovernance.ruleAlignmentProof ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.absoluteGovernance.ruleAlignmentProof ? 'proof valid' : 'proof failed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Universal Model</p>
                <p className="text-xs text-cyan-300">{Math.round(latestFactoryRun.universalModelAbstraction.abstractionCoverageScore * 100)}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Self-Rewriting</p>
                <p className={cn('text-xs', latestFactoryRun.selfRewritingCore.safeRewriteProof ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.selfRewritingCore.safeRewriteProof ? 'safe' : 'blocked'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Intent to Reality</p>
                <p className="text-xs text-emerald-300">{latestFactoryRun.intentToReality.ideaToExecutableMs}ms</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Causal Field</p>
                <p className="text-xs text-violet-300">{latestFactoryRun.causalSimulationField.simulatedChains} chains</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Zero-Latency Ideal</p>
                <p className="text-xs text-blue-300">{latestFactoryRun.zeroLatencyIdeal.effectiveLatencyMs}ms*</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Knowledge Graph</p>
                <p className="text-xs text-lime-300">{latestFactoryRun.perfectKnowledgeGraph.entities} entities</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Error-Less Compute</p>
                <p className="text-xs text-orange-300">budget {latestFactoryRun.errorLessComputation.runtimeErrorBudget}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Infinite Memory</p>
                <p className="text-xs text-fuchsia-300">{latestFactoryRun.infiniteMemoryModel.historicalEventsRetained} events</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">State Visibility</p>
                <p className={cn('text-xs', latestFactoryRun.totalStateVisibility.visibilityProof ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.totalStateVisibility.visibilityProof ? 'total' : 'partial'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Decision Optimality</p>
                <p className="text-xs text-sky-300">{Math.round(latestFactoryRun.absoluteDecisionOptimality.optimalityScore * 100)}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Self-Constraint</p>
                <p className="text-xs text-yellow-300">{latestFactoryRun.selfConstraint.interventionCount} interventions</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">Universal Governance Law</p>
                <p className={cn('text-xs', latestFactoryRun.universalGovernanceLaw.allActionsBound ? 'text-green-300' : 'text-red-300')}>
                  {latestFactoryRun.universalGovernanceLaw.allActionsBound ? 'bound' : 'unbound'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Monitoring + Alerts</p>
              {latestFactoryRun.alerts.length === 0 ? (
                <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-300">
                  No active alerts. Runtime, hard rules, and healing checks are healthy.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {latestFactoryRun.alerts.slice(0, 6).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'rounded-md border px-3 py-2 text-xs',
                        alert.severity === 'critical'
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : alert.severity === 'high'
                            ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                            : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="uppercase tracking-wide">{alert.code.replace(/_/g, ' ')}</span>
                        <span className="uppercase">{alert.severity}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-100">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lastResult && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-xs px-3 py-2 rounded-lg',
              lastResult.startsWith('✅')
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
            )}
          >
            {lastResult}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastFactoryResult && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-xs px-3 py-2 rounded-lg',
              lastFactoryResult.startsWith('✅')
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-300 border border-red-500/20'
            )}
          >
            {lastFactoryResult}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Live Stats Bar ───────────────────────────────────────────────────────────

function LiveStatsBar() {
  const kpis = useSystemFlowStore(s => s.kpis);

  const stats = [
    { label: 'Traffic',    value: kpis.totalTraffic.toLocaleString(),  icon: TrendingUp,  color: 'text-sky-400' },
    { label: 'Leads',      value: kpis.totalLeads.toLocaleString(),    icon: Users,       color: 'text-purple-400' },
    { label: 'Sales',      value: kpis.totalSales.toLocaleString(),    icon: ShoppingCart, color: 'text-pink-400' },
    { label: 'Revenue',    value: `$${(kpis.totalRevenue / 1000).toFixed(1)}K`, icon: Store, color: 'text-green-400' },
    { label: 'Commission', value: `$${(kpis.totalCommissions / 1000).toFixed(1)}K`, icon: Calculator, color: 'text-teal-400' },
    { label: 'Payouts',    value: `$${(kpis.totalPayouts / 1000).toFixed(1)}K`, icon: Banknote, color: 'text-orange-400' },
    { label: 'AI Actions', value: kpis.aiActionsToday.toLocaleString(), icon: Bot,        color: 'text-violet-400' },
    { label: 'Alerts',     value: kpis.securityAlerts.toString(),      icon: Shield,      color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Icon className={cn('h-3.5 w-3.5 mx-auto mb-1', s.color)} />
            <p className={cn('text-sm font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export default function SystemFlowDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const lastUpdated = useSystemFlowStore(s => s.lastUpdated);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-6 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Software Factory — GOD MODE
              </h1>
              <p className="text-xs text-slate-400">
                Ultra System Flow · 12 Layers · End-to-End · 10M+ Scalable
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400">Live · {new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── LIVE STATS ── */}
      <LiveStatsBar />

      {/* ── PIPELINE SIMULATOR ── */}
      <PipelineSimulator />

      {/* ── LAYER TABS ── */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
        <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap gap-1">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white',
                  activeTab === tab.id ? tab.color : 'text-slate-400',
                )}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview">
            <SystemFlowVisualizer />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletSplitPanel />
          </TabsContent>

          <TabsContent value="commission">
            <CommissionTracker />
          </TabsContent>

          <TabsContent value="payout">
            <PayoutEnginePanel />
          </TabsContent>

          <TabsContent value="ai-loop">
            <AIEventLoop />
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceAnalytics />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── SECURITY + DATA FOOTER ── */}
      <div className="border-t border-white/10 pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-red-400" />RBAC enforced</span>
        <span className="flex items-center gap-1"><Database className="h-3 w-3 text-slate-400" />ID-linked · no duplication</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-400" />Zero dead flow</span>
        <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-yellow-400" />Boss approval required for large payouts</span>
        <span className="flex items-center gap-1"><Bot className="h-3 w-3 text-violet-400" />Vala AI monitoring all events</span>
      </div>
    </div>
  );
}
