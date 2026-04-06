// @ts-nocheck
// VALA AI — Autonomous Software Factory Core: Shared Types

export type BuildTarget = 'web' | 'apk' | 'software';
export type PipelineStatus = 'idle' | 'running' | 'success' | 'failed' | 'healing';
export type EngineStatus = 'dormant' | 'active' | 'complete' | 'error';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type DeployEnv = 'dev' | 'stage' | 'prod';
export type DeployStrategy = 'blue-green' | 'canary' | 'rolling';

// ─── Job Request ────────────────────────────────────────────────────────────
export interface ValaJobRequest {
  jobId: string;
  idea: string;
  target: BuildTarget;
  userId?: string | null;
  projectName?: string;
  modules?: string[];
  timestamp: string;
}

// ─── 01 Intent / Spec ───────────────────────────────────────────────────────
export interface ValaSpec {
  modules: string[];
  routes: string[];
  dbTables: string[];
  apis: string[];
  constraints: string[];
  ambiguities: string[];
}

// ─── 02 Architecture ────────────────────────────────────────────────────────
export interface ValaArchitect {
  services: string[];
  boundaries: Record<string, string[]>;
  dataFlow: string[];
  standards: string[];
  framework: 'vite' | 'next';
}

// ─── 03 Code Synthesis ──────────────────────────────────────────────────────
export interface CodeFile {
  path: string;
  language: 'tsx' | 'ts' | 'sql' | 'json';
  stub: string;
}

export interface ValaCodeOutput {
  components: CodeFile[];
  services: CodeFile[];
  hooks: CodeFile[];
  tests: CodeFile[];
}

// ─── 04 Repo ────────────────────────────────────────────────────────────────
export interface ValaRepoState {
  repoName: string;
  branch: string;
  version: string;
  commitMessage: string;
  tags: string[];
  rollbackAvailable: boolean;
}

// ─── 05 Dependency ──────────────────────────────────────────────────────────
export interface ValaDependency {
  name: string;
  version: string;
  type: 'dev' | 'prod';
  status: 'ok' | 'conflict' | 'vulnerable' | 'updated';
  cve?: string | null;
}

export interface ValaDependencyReport {
  total: number;
  resolved: ValaDependency[];
  conflicts: ValaDependency[];
  patched: ValaDependency[];
}

// ─── 06 Tests ───────────────────────────────────────────────────────────────
export interface ValaTestResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  coverage: number;
  flaky: string[];
}

// ─── 07 CI/CD ───────────────────────────────────────────────────────────────
export interface ValaCICDJob {
  name: string;
  steps: string[];
  parallel: boolean;
  retryMax: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
}

export interface ValaCICDPipeline {
  trigger: string;
  jobs: ValaCICDJob[];
  autoRetry: boolean;
}

// ─── 08 Build ───────────────────────────────────────────────────────────────
export interface ValaBuildOutput {
  target: BuildTarget;
  artifact: string;
  sizeMb?: number;
  durationMs?: number;
  signed?: boolean;
  downloadUrl?: string | null;
}

// ─── 09 Deployment ──────────────────────────────────────────────────────────
export interface ValaDeployment {
  environment: DeployEnv;
  strategy: DeployStrategy;
  url?: string | null;
  status: 'deployed' | 'failed' | 'rolling-back';
  healthCheck: boolean;
  rollbackVersion?: string | null;
}

// ─── 10 Observability ───────────────────────────────────────────────────────
export interface ValaMetrics {
  errorRate: number;
  latencyP99Ms: number;
  throughputRps: number;
  alertsFired: number;
  requestId: string;
  traces: string[];
}

// ─── 11 Error Detection ─────────────────────────────────────────────────────
export interface ValaError {
  id: string;
  source: 'console' | 'runtime' | 'api';
  severity: Severity;
  message: string;
  file?: string | null;
  line?: number | null;
  isAnomaly: boolean;
  baseline?: number;
  spike?: number;
}

// ─── 12 Self-Healing ────────────────────────────────────────────────────────
export interface ValaHealPatch {
  errorId: string;
  file: string;
  patchType: 'ast_edit' | 'hotfix' | 'config_change';
  description: string;
  applied: boolean;
  retested: boolean;
  redeployed: boolean;
  rolledBack: boolean;
  hotfixBranch: string;
}

// ─── 13 Performance ─────────────────────────────────────────────────────────
export interface ValaPerformanceReport {
  codeSplit: boolean;
  lazyLoaded: string[];
  cacheStrategy: Record<string, number>; // key → TTL seconds
  queryOptimizations: string[];
  estimatedSavingMs: number;
}

// ─── 14 Security ────────────────────────────────────────────────────────────
export interface ValaSecurityReport {
  authGuardsAdded: string[];
  inputSanitized: string[];
  secretsScanned: boolean;
  secretsFound: number;
  cvePatched: string[];
  score: number; // 0-100
}

// ─── 15 Data + Schema ───────────────────────────────────────────────────────
export interface ValaSchemaSync {
  tablesInSync: boolean;
  contractValid: boolean;
  migrationScripts: string[];
  backwardCompatible: boolean;
  breakingChanges: string[];
}

// ─── 16 Module Integrator ───────────────────────────────────────────────────
export interface ValaModuleLink {
  source: string;
  target: string;
  routeConnected: boolean;
  dataContractValid: boolean;
}

export interface ValaIntegrationMap {
  links: ValaModuleLink[];
  routeMap: Record<string, string>;
  deadRoutes: string[];
}

// ─── 17 AI Decision ─────────────────────────────────────────────────────────
export interface ValaAIDecision {
  signal: 'usage' | 'error' | 'conversion' | 'latency';
  value: number;
  threshold: number;
  action: 'refactor' | 'scale' | 'optimize' | 'reprice' | 'no_action';
  reasoning: string;
  executedVia: string;
}

// ─── 18 Automation ──────────────────────────────────────────────────────────
export interface ValaAutomationTask {
  taskId: string;
  description: string;
  devBot: string;
  pipeline: string;
  slaMs: number;
  retries: number;
  status: 'queued' | 'running' | 'done' | 'failed';
}

// ─── 19 Queue + Cache ───────────────────────────────────────────────────────
export interface ValaQueueJob {
  jobId: string;
  channel: 'email' | 'notify' | 'payout' | 'build' | 'deploy';
  payload: Record<string, any>;
  retries: number;
  maxRetries: number;
  inDlq: boolean;
  createdAt: string;
}

export interface ValaCacheEntry {
  key: string;
  ttlSeconds: number;
  invalidateOn: string[];
}

// ─── 20 Recovery + Governance ───────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  module: string;
  timestamp: string;
  immutable: true;
}

export interface ValaRecoveryState {
  snapshotId: string;
  rollbackVersion: string;
  restoredAt?: string | null;
  featureFlags: Record<string, boolean>;
  abTests: Record<string, string>;
  auditLog: AuditEntry[];
}

export interface ValaHardRuleStatus {
  idempotentOperations: boolean;
  sagaTransactions: 'running' | 'committed' | 'rolled_back';
  uuidEverywhere: boolean;
  zero404: boolean;
  changesTestedBeforeRelease: boolean;
}

// ─── Pipeline State ─────────────────────────────────────────────────────────
export interface ValaEngineState {
  id: number;
  name: string;
  status: EngineStatus;
  output?: any;
  error?: string | null;
  durationMs?: number;
}

export interface ValaFactoryPipeline {
  jobId: string;
  idea: string;
  target: BuildTarget;
  idempotencyKey?: string;
  status: PipelineStatus;
  currentEngine: number;
  engines: ValaEngineState[];
  spec?: ValaSpec;
  architect?: ValaArchitect;
  code?: ValaCodeOutput;
  repo?: ValaRepoState;
  deps?: ValaDependencyReport;
  tests?: ValaTestResult[];
  cicd?: ValaCICDPipeline;
  build?: ValaBuildOutput;
  deployment?: ValaDeployment;
  metrics?: ValaMetrics;
  errors?: ValaError[];
  healPatch?: ValaHealPatch;
  performance?: ValaPerformanceReport;
  security?: ValaSecurityReport;
  schema?: ValaSchemaSync;
  integrations?: ValaIntegrationMap;
  decisions?: ValaAIDecision[];
  tasks?: ValaAutomationTask[];
  queue?: ValaQueueJob[];
  recovery?: ValaRecoveryState;
  hardRules?: ValaHardRuleStatus;
  logs: string[];
  startedAt: string;
  completedAt?: string | null;
}

// ─── Engine Registry ────────────────────────────────────────────────────────
export const ENGINE_REGISTRY: Array<{ id: number; name: string; category: string }> = [
  { id: 1,  name: 'Intent Engine',           category: 'design'   },
  { id: 2,  name: 'System Architect',        category: 'design'   },
  { id: 3,  name: 'Code Synthesis',          category: 'build'    },
  { id: 4,  name: 'Repo Orchestrator',       category: 'build'    },
  { id: 5,  name: 'Dependency Resolver',     category: 'build'    },
  { id: 6,  name: 'Test Intelligence',       category: 'quality'  },
  { id: 7,  name: 'CI/CD Orchestrator',      category: 'quality'  },
  { id: 8,  name: 'Multi-Build Engine',      category: 'deploy'   },
  { id: 9,  name: 'Deployment Controller',   category: 'deploy'   },
  { id: 10, name: 'Observability',           category: 'ops'      },
  { id: 11, name: 'Error Detection',         category: 'ops'      },
  { id: 12, name: 'Self-Healing Engine',     category: 'ops'      },
  { id: 13, name: 'Performance Optimizer',   category: 'optimize' },
  { id: 14, name: 'Security Engine',         category: 'optimize' },
  { id: 15, name: 'Data + Schema Engine',    category: 'data'     },
  { id: 16, name: 'Module Integrator',       category: 'data'     },
  { id: 17, name: 'AI Decision Loop',        category: 'ai'       },
  { id: 18, name: 'Automation Engine',       category: 'ai'       },
  { id: 19, name: 'Queue + Cache Fabric',    category: 'ai'       },
  { id: 20, name: 'Recovery + Governance',   category: 'ai'       },
];
