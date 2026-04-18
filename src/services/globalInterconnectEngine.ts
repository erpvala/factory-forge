// @ts-nocheck
import { z } from 'zod';

export type CoreModuleId =
  | 'seo_marketing'
  | 'lead_manager'
  | 'vala_ai'
  | 'sales_engine'
  | 'order_system'
  | 'payment_gateway'
  | 'license_system'
  | 'user_dashboard'
  | 'notification_center'
  | 'analytics_hub'
  | 'security_manager';

export type SystemRole =
  | 'boss_owner'
  | 'ceo'
  | 'admin'
  | 'sales_support'
  | 'lead_manager'
  | 'finance_manager'
  | 'license_manager'
  | 'analytics_manager'
  | 'notification_manager'
  | 'security_manager'
  | 'user';

export type InterconnectEventType =
  | 'LEAD_CAPTURED'
  | 'SALE_CREATED'
  | 'ORDER_CREATED'
  | 'PAYMENT_CAPTURED'
  | 'LICENSE_ACTIVATED'
  | 'ACCESS_GRANTED'
  | 'SETTINGS_UPDATED'
  | 'MODULE_HEALTH_CHANGED'
  | 'SAGA_ROLLBACK';

export interface InterconnectEvent {
  eventId: string;
  type: InterconnectEventType;
  moduleId: CoreModuleId;
  payload: Record<string, any>;
  at: string;
}

const LeadSchema = z.object({
  lead_id: z.string().min(4),
  org_id: z.string().min(2),
  source: z.string().min(2),
  email: z.string().email(),
  score: z.number().int().min(0).max(100),
  created_at: z.string(),
});

const SaleSchema = z.object({
  sale_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  created_at: z.string(),
});

const OrderSchema = z.object({
  order_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  sale_id: z.string().min(4),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })).min(1),
  created_at: z.string(),
});

const PaymentSchema = z.object({
  payment_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  order_id: z.string().min(4),
  amount: z.number().positive(),
  status: z.literal('captured'),
  created_at: z.string(),
});

const LicenseSchema = z.object({
  license_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  payment_id: z.string().min(4),
  plan: z.string().min(2),
  created_at: z.string(),
});

const AccessSchema = z.object({
  access_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  license_id: z.string().min(4),
  user_id: z.string().min(3),
  created_at: z.string(),
});

interface SystemSettings {
  pricingMultiplier: number;
  realtimeEnabled: boolean;
  notificationChannel: 'in_app' | 'email' | 'both';
  strictContracts: boolean;
}

interface HealthState {
  moduleId: CoreModuleId;
  healthy: boolean;
  updatedAt: string;
  reason?: string;
}

interface ChainResult {
  lead_id: string;
  sale_id: string;
  order_id: string;
  payment_id: string;
  license_id: string;
  access_id: string;
}

interface LeadToAccessInput {
  org_id?: string;
  source: string;
  email: string;
  score: number;
  amount: number;
  items: Array<{ sku: string; qty: number }>;
  plan: string;
  user_id: string;
  failAt?: 'lead' | 'sale' | 'order' | 'payment' | 'license' | 'access';
}

interface EventTask {
  event: InterconnectEvent;
  handler: (event: InterconnectEvent) => void;
  attempts: number;
  maxAttempts: number;
}

interface QueuedTask {
  id: string;
  moduleId: CoreModuleId;
  taskType: 'payment' | 'order' | 'analytics' | 'other';
  critical: boolean;
  fn: () => any;
}

interface EngineMetrics {
  totalEvents: number;
  retriedEvents: number;
  dlqCount: number;
  shedCount: number;
  errorCount: number;
  conversions: number;
  latencySamples: number;
  latencyMsTotal: number;
}

interface OnCallAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  details: string;
  at: string;
  acknowledged: boolean;
}

interface KPIGuardrails {
  minConversionRate: number;
  maxErrorRate: number;
}

interface SupportTicket {
  id: string;
  org_id: string;
  createdAt: string;
  firstResponseAt: string | null;
}

interface CapacityPlan {
  predictedRps: number;
  currentRps: number;
  recommendedReplicas: number;
  action: 'scale_up' | 'hold';
}

interface CostSnapshot {
  infraUsd: number;
  apiUsd: number;
  totalUsd: number;
  limited: boolean;
}

interface CustomerFeedback {
  id: string;
  org_id: string;
  user_id: string;
  score: number;
  comment: string;
  createdAt: string;
}

type OwnedEntity = 'product' | 'order' | 'wallet';

type OwnerModule = 'marketplace-manager' | 'order-system' | 'finance-manager';

interface RateLimitPolicy {
  perUser: number;
  perIp: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

interface RetentionPolicy {
  logsDays: number;
  analyticsDays: number;
  transactionMode: 'permanent';
  backupDays: number;
}

interface RetentionSweepSummary {
  prunedLogs: number;
  prunedAnalytics: number;
  retainedTransactions: number;
  completedAt: string;
}

interface ConsentRecord {
  user_id: string;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  ip: string;
}

interface AccessLogEntry {
  id: string;
  actor: string;
  resource: string;
  action: string;
  at: string;
}

interface OverrideAction {
  id: string;
  type: 'force_approve' | 'force_reject' | 'force_complete_order' | 'force_delivery' | 'manual_ledger_entry' | 'manual_payout';
  actor: string;
  targetId: string;
  note?: string;
  at: string;
}

interface DependencyProviderState {
  key: 'payment' | 'ai';
  primaryUp: boolean;
  fallbackUp: boolean;
}

interface AlertThresholds {
  cpuPct: number;
  errorRate: number;
  paymentFailCount: number;
}

interface DailyHealthReport {
  at: string;
  errors: number;
  revenue: number;
  users: number;
  failures: number;
}

const MODULE_PERMISSIONS: Record<CoreModuleId, string[]> = {
  seo_marketing: ['ceo', 'boss_owner', 'admin', 'sales_support'],
  lead_manager: ['lead_manager', 'boss_owner', 'admin'],
  vala_ai: ['ceo', 'boss_owner', 'admin'],
  sales_engine: ['sales_support', 'boss_owner', 'admin'],
  order_system: ['sales_support', 'finance_manager', 'boss_owner', 'admin'],
  payment_gateway: ['finance_manager', 'boss_owner', 'admin'],
  license_system: ['license_manager', 'boss_owner', 'admin'],
  user_dashboard: ['user', 'boss_owner', 'admin'],
  notification_center: ['notification_manager', 'boss_owner', 'admin'],
  analytics_hub: ['analytics_manager', 'ceo', 'boss_owner', 'admin'],
  security_manager: ['security_manager', 'boss_owner', 'admin'],
};

const DEPENDENCY_FALLBACKS: Record<CoreModuleId, { dependsOn: CoreModuleId[]; fallback: string }> = {
  seo_marketing: { dependsOn: [], fallback: 'queue_campaign_for_retry' },
  lead_manager: { dependsOn: ['seo_marketing'], fallback: 'manual_lead_entry_mode' },
  vala_ai: { dependsOn: ['lead_manager', 'analytics_hub'], fallback: 'static_scoring_model' },
  sales_engine: { dependsOn: ['lead_manager', 'vala_ai'], fallback: 'manual_sales_assignment' },
  order_system: { dependsOn: ['sales_engine'], fallback: 'order_intake_queue_mode' },
  payment_gateway: { dependsOn: ['order_system'], fallback: 'pending_payment_intent_mode' },
  license_system: { dependsOn: ['payment_gateway'], fallback: 'provisional_license_mode' },
  user_dashboard: { dependsOn: ['license_system'], fallback: 'restricted_dashboard_mode' },
  notification_center: { dependsOn: ['order_system', 'payment_gateway', 'license_system'], fallback: 'batch_notification_mode' },
  analytics_hub: { dependsOn: ['notification_center'], fallback: 'delayed_analytics_pipeline' },
  security_manager: { dependsOn: ['analytics_hub'], fallback: 'strict_lockdown_mode' },
};

const ENTITY_OWNERS: Record<OwnedEntity, OwnerModule> = {
  product: 'marketplace-manager',
  order: 'order-system',
  wallet: 'finance-manager',
};

const ORDER_API_REQUEST_SCHEMA = z.object({
  order_id: z.string().min(4),
  org_id: z.string().min(2),
  lead_id: z.string().min(4),
  sale_id: z.string().min(4),
  items: z.array(z.object({ sku: z.string().min(1), qty: z.number().int().positive() })).min(1),
  created_at: z.string(),
});

const ORDER_API_RESPONSE_SCHEMA = z.object({
  ok: z.boolean(),
  data: ORDER_API_REQUEST_SCHEMA,
});

const PRODUCT_API_REQUEST_SCHEMA = z.object({
  product_id: z.string().min(4),
  org_id: z.string().min(2),
  slug: z.string().min(2),
  title: z.string().min(2),
  price: z.number().nonnegative(),
  updated_at: z.string(),
});

const PRODUCT_API_RESPONSE_SCHEMA = z.object({
  ok: z.boolean(),
  data: PRODUCT_API_REQUEST_SCHEMA,
});

function uid(prefix: string): string {
  const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${randomPart}`;
}

function now(): string {
  return new Date().toISOString();
}

function semverParts(v: string): [number, number, number] {
  const [a, b, c] = v.split('.').map((x) => Number(x || 0));
  return [a || 0, b || 0, c || 0];
}

function isVersionCompatible(current: string, minRequired: string) {
  const c = semverParts(current);
  const r = semverParts(minRequired);
  for (let i = 0; i < 3; i += 1) {
    if (c[i] > r[i]) return true;
    if (c[i] < r[i]) return false;
  }
  return true;
}

class GlobalEventBus {
  private listeners = new Set<(event: InterconnectEvent) => void>();

  subscribe(listener: (event: InterconnectEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getListeners() {
    return Array.from(this.listeners);
  }
}

export class GlobalInterconnectEngine {
  private bus = new GlobalEventBus();
  private realtimeRevision = 0;

  private settings: SystemSettings = {
    pricingMultiplier: 1,
    realtimeEnabled: true,
    notificationChannel: 'both',
    strictContracts: true,
  };

  private health: Record<CoreModuleId, HealthState> = Object.fromEntries(
    (Object.keys(MODULE_PERMISSIONS) as CoreModuleId[]).map((moduleId) => [moduleId, { moduleId, healthy: true, updatedAt: now() }]),
  ) as Record<CoreModuleId, HealthState>;

  // Global state store: single source of truth.
  private leads = new Map<string, any>();
  private sales = new Map<string, any>();
  private orders = new Map<string, any>();
  private payments = new Map<string, any>();
  private licenses = new Map<string, any>();
  private accesses = new Map<string, any>();
  private walletLedger = new Map<string, { org_id: string; payment_id: string; order_id: string; amount: number; created_at: string }>();

  private notifications: Array<{ id: string; title: string; body: string; at: string }> = [];
  private searchDocs = new Map<string, string>();
  private eventLog: InterconnectEvent[] = [];
  private onCallAlerts: OnCallAlert[] = [];
  private kpiGuardrails: KPIGuardrails = { minConversionRate: 0.05, maxErrorRate: 0.08 };
  private supportTickets: SupportTicket[] = [];
  private customerFeedback: CustomerFeedback[] = [];
  private products = new Map<string, any>();
  private softDeleted = new Map<string, { deleted_at: string; resource: string }>();

  private userRateLimits = new Map<string, RateLimitBucket>();
  private ipRateLimits = new Map<string, RateLimitBucket>();
  private rateLimitPolicy: RateLimitPolicy = { perUser: 60, perIp: 120, windowMs: 60_000 };

  private retentionPolicy: RetentionPolicy = { logsDays: 90, analyticsDays: 365, transactionMode: 'permanent', backupDays: 30 };
  private consentRecords = new Map<string, ConsentRecord>();
  private accessLogs: AccessLogEntry[] = [];
  private overrideActions: OverrideAction[] = [];

  private providerState: Record<'payment' | 'ai', DependencyProviderState> = {
    payment: { key: 'payment', primaryUp: true, fallbackUp: true },
    ai: { key: 'ai', primaryUp: true, fallbackUp: true },
  };

  private deploymentFrozen = false;
  private clockDriftMs = 0;
  private configBaseline = new Map<string, string>();
  private configRuntime = new Map<string, string>();
  private alertThresholds: AlertThresholds = { cpuPct: 80, errorRate: 0.08, paymentFailCount: 5 };
  private paymentFailCounter = 0;
  private uniqueEmails = new Set<string>();
  private uniqueOrderIds = new Set<string>();
  private uniqueProductSlugs = new Set<string>();
  private latestResourceSample = { cpuPct: 0, ramPct: 0, workerHealthy: true, sampledAt: now() };

  private releasedVersion = '1.0.0';
  private previousVersion = '1.0.0';
  private releaseRolledBack = false;

  // Retry + DLQ.
  private dlq: Array<{ event: InterconnectEvent; reason: string; attempts: number; at: string }> = [];
  private maxEventAttempts = 3;

  // Global cache invalidation.
  private moduleCache = new Map<string, { moduleId: CoreModuleId; org_id: string; value: any; revision: number; tags: string[] }>();

  // Version compatibility matrix.
  private moduleVersions: Record<CoreModuleId, { current: string; minRequired: string }> = Object.fromEntries(
    (Object.keys(MODULE_PERMISSIONS) as CoreModuleId[]).map((m) => [m, { current: '1.0.0', minRequired: '1.0.0' }]),
  ) as Record<CoreModuleId, { current: string; minRequired: string }>;

  // Feature flags.
  private featureFlags = new Map<string, boolean>([
    ['saga.strict_mode', true],
    ['analytics.realtime', true],
    ['notifications.central', true],
    ['payments.capture.enabled', true],
  ]);

  // Orchestration controls.
  private currentLoad = 0;
  private loadSheddingThreshold = 80;
  private queue: QueuedTask[] = [];
  private incidentMode = false;
  private incidentAllowedModules = new Set<CoreModuleId>(['payment_gateway', 'order_system', 'license_system', 'security_manager']);

  private costLimitUsd = 10000;
  private currentCost: CostSnapshot = { infraUsd: 0, apiUsd: 0, totalUsd: 0, limited: false };

  // Metrics.
  private metrics: EngineMetrics = {
    totalEvents: 0,
    retriedEvents: 0,
    dlqCount: 0,
    shedCount: 0,
    errorCount: 0,
    conversions: 0,
    latencySamples: 0,
    latencyMsTotal: 0,
  };

  constructor() {
    this.bus.subscribe((event) => {
      this.eventLog.push(event);
      this.realtimeRevision += 1;
      this.metrics.totalEvents += 1;

      if (['LEAD_CAPTURED', 'SALE_CREATED', 'ORDER_CREATED', 'PAYMENT_CAPTURED', 'LICENSE_ACTIVATED', 'ACCESS_GRANTED'].includes(event.type)) {
        this.notifications.push({
          id: uid('NTF'),
          title: event.type,
          body: JSON.stringify(event.payload),
          at: event.at,
        });
      }

      // Global cross-module cache invalidation by chain tags.
      if (event.payload?.org_id) {
        this.invalidateCachesByTags(event.payload.org_id, ['lead-chain', 'financial-chain']);
      }
    });
  }

  subscribe(listener: (event: InterconnectEvent) => void) {
    return this.bus.subscribe(listener);
  }

  // 1) Orchestration engine.
  async runOrchestratedTask(task: Omit<QueuedTask, 'id'>) {
    const queued: QueuedTask = { ...task, id: uid('tsk') };
    this.queue.push(queued);
    return this.processTaskQueue();
  }

  async runPrioritizedBatch(tasks: Array<Omit<QueuedTask, 'id'>>) {
    tasks.forEach((task) => {
      this.queue.push({ ...task, id: uid('tsk') });
    });

    const out: any[] = [];
    while (this.queue.length > 0) {
      out.push(await this.processTaskQueue());
    }
    return out;
  }

  // 2) Global state store.
  getStateStore(org_id?: string) {
    const filter = <T extends { org_id: string }>(values: T[]) => org_id ? values.filter((x) => x.org_id === org_id) : values;
    return {
      leads: filter(Array.from(this.leads.values())),
      sales: filter(Array.from(this.sales.values())),
      orders: filter(Array.from(this.orders.values())),
      payments: filter(Array.from(this.payments.values())),
      licenses: filter(Array.from(this.licenses.values())),
      accesses: filter(Array.from(this.accesses.values())),
    };
  }

  // 3) Event retry + DLQ.
  publishWithRetry(event: InterconnectEvent) {
    const listeners = this.bus.getListeners();
    for (const handler of listeners) {
      const task: EventTask = { event, handler, attempts: 0, maxAttempts: this.maxEventAttempts };
      this.dispatchTaskWithRetry(task);
    }
  }

  getDLQ() {
    return this.dlq;
  }

  // 4) Cross-module cache invalidation.
  setModuleCache(moduleId: CoreModuleId, org_id: string, key: string, value: any, tags: string[]) {
    this.moduleCache.set(`${org_id}:${moduleId}:${key}`, {
      moduleId,
      org_id,
      value,
      revision: this.realtimeRevision,
      tags,
    });
  }

  getModuleCache(moduleId: CoreModuleId, org_id: string, key: string) {
    return this.moduleCache.get(`${org_id}:${moduleId}:${key}`) ?? null;
  }

  invalidateCachesByTags(org_id: string, tags: string[]) {
    for (const [key, entry] of this.moduleCache.entries()) {
      if (entry.org_id !== org_id) continue;
      if (entry.tags.some((tag) => tags.includes(tag))) {
        this.moduleCache.delete(key);
      }
    }
  }

  // 5) Version compatibility.
  setModuleVersion(moduleId: CoreModuleId, current: string, minRequired: string) {
    this.moduleVersions[moduleId] = { current, minRequired };
  }

  getVersionCompatibility() {
    return Object.fromEntries(
      (Object.keys(this.moduleVersions) as CoreModuleId[]).map((moduleId) => {
        const info = this.moduleVersions[moduleId];
        return [moduleId, { ...info, compatible: isVersionCompatible(info.current, info.minRequired) }];
      }),
    );
  }

  // 6) Global feature flags.
  setFeatureFlag(flag: string, enabled: boolean) {
    this.featureFlags.set(flag, enabled);
  }

  isFeatureEnabled(flag: string) {
    return this.featureFlags.get(flag) ?? false;
  }

  getFeatureFlags() {
    return Object.fromEntries(this.featureFlags.entries());
  }

  // 2) Ops runbook metadata surface for common incidents.
  getOpsRunbook(issue: 'payment_failed' | 'api_down') {
    if (issue === 'payment_failed') {
      return [
        'Validate payment_gateway health status and provider uptime.',
        'Switch feature flag payments.capture.enabled=false to stop bad captures.',
        'Run runReconciliationJob(org_id) and identify affected orders.',
        'Run runBackfillJobs(org_id) to replay missing payment events.',
        'Enable incident mode with payment/order/security modules only.',
      ];
    }

    return [
      'Check module health and dependency fallback path for failed module.',
      'Enable incident mode and keep only critical modules active.',
      'Raise critical on-call alert with impacted org/module IDs.',
      'If release-induced, execute releaseRollbackToggle().',
      'After recovery, run backfill and reconciliation jobs.',
    ];
  }

  // 3) On-call alerting.
  getOnCallAlerts() {
    return this.onCallAlerts;
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.onCallAlerts.find((x) => x.id === alertId);
    if (alert) alert.acknowledged = true;
    return alert ?? null;
  }

  setKPIGuardrails(guardrails: Partial<KPIGuardrails>) {
    this.kpiGuardrails = { ...this.kpiGuardrails, ...guardrails };
    return this.kpiGuardrails;
  }

  // 4) Release switch (one-click rollback toggle).
  setReleaseVersion(version: string) {
    this.previousVersion = this.releasedVersion;
    this.releasedVersion = version;
    this.releaseRolledBack = false;
  }

  releaseRollbackToggle() {
    const current = this.releasedVersion;
    this.releasedVersion = this.previousVersion;
    this.previousVersion = current;
    this.releaseRolledBack = true;
    this.raiseOnCallAlert('high', 'Release rollback executed', `Rolled back to ${this.releasedVersion}`);
    return { current: this.releasedVersion, previous: this.previousVersion, rolledBack: this.releaseRolledBack };
  }

  getReleaseState() {
    return { current: this.releasedVersion, previous: this.previousVersion, rolledBack: this.releaseRolledBack };
  }

  // 5) Data backfill jobs.
  seedOrphanOrderForBackfill(org_id: string, amount: number) {
    const lead = LeadSchema.parse({
      lead_id: uid('lead-seed'),
      org_id,
      source: 'seed',
      email: `${uid('seed')}@example.com`,
      score: 55,
      created_at: now(),
    });
    this.leads.set(this.k(org_id, lead.lead_id), lead);

    const sale = SaleSchema.parse({
      sale_id: uid('sale-seed'),
      org_id,
      lead_id: lead.lead_id,
      amount,
      currency: 'USD',
      created_at: now(),
    });
    this.sales.set(this.k(org_id, sale.sale_id), sale);

    const order = OrderSchema.parse({
      order_id: uid('order-seed'),
      org_id,
      lead_id: lead.lead_id,
      sale_id: sale.sale_id,
      items: [{ sku: 'seed-sku', qty: 1 }],
      created_at: now(),
    });
    this.orders.set(this.k(org_id, order.order_id), order);

    return { lead_id: lead.lead_id, sale_id: sale.sale_id, order_id: order.order_id };
  }

  runBackfillJobs(org_id: string) {
    const orders = Array.from(this.orders.values()).filter((x) => x.org_id === org_id);
    const payments = Array.from(this.payments.values()).filter((x) => x.org_id === org_id);
    const paymentByOrder = new Set(payments.map((x) => x.order_id));

    const repaired: string[] = [];
    for (const order of orders) {
      if (!paymentByOrder.has(order.order_id)) {
        const payment = {
          payment_id: uid('payment-backfill'),
          org_id,
          lead_id: order.lead_id,
          order_id: order.order_id,
          amount: Array.from(this.sales.values()).find((s) => s.sale_id === order.sale_id)?.amount ?? 0,
          status: 'captured',
          created_at: now(),
        };
        this.payments.set(this.k(org_id, payment.payment_id), payment);
        this.walletLedger.set(this.k(org_id, payment.payment_id), {
          org_id,
          payment_id: payment.payment_id,
          order_id: order.order_id,
          amount: payment.amount,
          created_at: payment.created_at,
        });
        repaired.push(order.order_id);
      }
    }

    return { org_id, repairedOrders: repaired, repairedCount: repaired.length };
  }

  // 6) Fraud engine.
  evaluateFraud(order: { org_id: string; order_id: string; amount: number; itemCount: number }) {
    const score = (order.amount > 10000 ? 70 : 20) + (order.itemCount > 20 ? 30 : 5);
    const hold = score >= 80;
    if (hold) {
      this.raiseOnCallAlert('critical', 'Fraud hold triggered', `Order ${order.order_id} held (score=${score})`);
    }
    return { score, hold };
  }

  // 8) SLA tracking.
  createSupportTicket(org_id: string) {
    const ticket: SupportTicket = { id: uid('tkt'), org_id, createdAt: now(), firstResponseAt: null };
    this.supportTickets.push(ticket);
    return ticket;
  }

  respondSupportTicket(ticketId: string) {
    const ticket = this.supportTickets.find((x) => x.id === ticketId);
    if (!ticket) return null;
    ticket.firstResponseAt = now();
    return ticket;
  }

  getSLAStatus(maxResponseMinutes: number) {
    const breaches = this.supportTickets.filter((t) => {
      const end = t.firstResponseAt ? new Date(t.firstResponseAt).getTime() : Date.now();
      const diffMins = (end - new Date(t.createdAt).getTime()) / 60000;
      return diffMins > maxResponseMinutes;
    });
    return { maxResponseMinutes, totalTickets: this.supportTickets.length, breached: breaches.length, breachRate: this.supportTickets.length > 0 ? breaches.length / this.supportTickets.length : 0 };
  }

  // 9) Capacity planning.
  predictCapacity(currentRps: number, growthRate: number) {
    const predictedRps = Math.round(currentRps * (1 + growthRate));
    const recommendedReplicas = Math.max(2, Math.ceil(predictedRps / 250));
    const plan: CapacityPlan = { currentRps, predictedRps, recommendedReplicas, action: predictedRps > currentRps ? 'scale_up' : 'hold' };
    return plan;
  }

  // 10) Cost monitor.
  setCostLimit(limitUsd: number) {
    this.costLimitUsd = Math.max(1, limitUsd);
  }

  updateCost(infraUsd: number, apiUsd: number) {
    const totalUsd = Math.max(0, infraUsd) + Math.max(0, apiUsd);
    this.currentCost = {
      infraUsd: Math.max(0, infraUsd),
      apiUsd: Math.max(0, apiUsd),
      totalUsd,
      limited: totalUsd >= this.costLimitUsd,
    };
    if (this.currentCost.limited) {
      this.raiseOnCallAlert('high', 'Cost limit reached', `Total spend ${totalUsd} exceeded limit ${this.costLimitUsd}`);
    }
    return this.currentCost;
  }

  getCostSnapshot() {
    return this.currentCost;
  }

  // 11) Legal/audit export.
  exportLegalAuditReport(org_id: string) {
    const events = this.eventLog.filter((x) => x.payload?.org_id === org_id);
    const payments = Array.from(this.payments.values()).filter((x) => x.org_id === org_id);
    const orders = Array.from(this.orders.values()).filter((x) => x.org_id === org_id);
    return {
      exportedAt: now(),
      org_id,
      totals: {
        events: events.length,
        orders: orders.length,
        payments: payments.length,
      },
      events,
      orders,
      payments,
    };
  }

  // 12) Customer success loop.
  recordCustomerFeedback(org_id: string, user_id: string, score: number, comment: string) {
    const feedback: CustomerFeedback = {
      id: uid('fb'),
      org_id,
      user_id,
      score: Math.max(1, Math.min(5, score)),
      comment,
      createdAt: now(),
    };
    this.customerFeedback.push(feedback);
    return feedback;
  }

  getCustomerSuccessInsights(org_id: string) {
    const list = this.customerFeedback.filter((x) => x.org_id === org_id);
    const avgScore = list.length > 0 ? list.reduce((s, x) => s + x.score, 0) / list.length : 0;
    const action = avgScore < 3.5 ? 'improve_onboarding_and_support' : 'scale_growth_playbook';
    return { org_id, totalFeedback: list.length, avgScore, action };
  }

  // 7) Load shedding.
  setLoad(value: number) {
    this.currentLoad = Math.max(0, Math.min(100, value));
  }

  setLoadSheddingThreshold(value: number) {
    this.loadSheddingThreshold = Math.max(1, Math.min(100, value));
  }

  // 11) Incident mode.
  setIncidentMode(enabled: boolean, allowedModules?: CoreModuleId[]) {
    this.incidentMode = enabled;
    if (allowedModules && allowedModules.length > 0) {
      this.incidentAllowedModules = new Set(allowedModules);
    }
  }

  // 12) Global metrics.
  getMetrics() {
    const errorRate = this.metrics.totalEvents > 0 ? this.metrics.errorCount / this.metrics.totalEvents : 0;
    return {
      ...this.metrics,
      avgLatencyMs: this.metrics.latencySamples > 0 ? this.metrics.latencyMsTotal / this.metrics.latencySamples : 0,
      conversionRate: this.leads.size > 0 ? this.metrics.conversions / this.leads.size : 0,
      errorRate,
    };
  }

  canAccess(role: SystemRole, moduleId: CoreModuleId): boolean {
    return MODULE_PERMISSIONS[moduleId]?.includes(role) ?? false;
  }

  getDependencyFallback(moduleId: CoreModuleId) {
    const map = DEPENDENCY_FALLBACKS[moduleId];
    const blockedBy = map.dependsOn.filter((dep) => !this.health[dep]?.healthy);
    return {
      moduleId,
      healthy: this.health[moduleId]?.healthy ?? false,
      blockedBy,
      fallback: blockedBy.length > 0 ? map.fallback : null,
    };
  }

  updateSettings(partial: Partial<SystemSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.emit('SETTINGS_UPDATED', 'security_manager', { settings: this.settings });
    return this.settings;
  }

  markModuleHealth(moduleId: CoreModuleId, healthy: boolean, reason?: string) {
    this.health[moduleId] = { moduleId, healthy, reason, updatedAt: now() };
    if (!healthy) {
      this.raiseOnCallAlert('critical', 'Module health degraded', `${moduleId} unhealthy: ${reason || 'unknown'}`);
    }
    this.emit('MODULE_HEALTH_CHANGED', moduleId, { healthy, reason });
    return this.health[moduleId];
  }

  getHealthSnapshot() {
    return this.health;
  }

  getRealtimeRevision() {
    return this.realtimeRevision;
  }

  getNotifications() {
    return this.notifications;
  }

  getEventLog() {
    return this.eventLog;
  }

  globalSearch(query: string, org_id?: string) {
    const q = query.toLowerCase();
    return Array.from(this.searchDocs.entries())
      .filter(([id, text]) => {
        if (org_id && !id.startsWith(`${org_id}:`)) return false;
        return text.includes(q);
      })
      .map(([id, text]) => ({ id, text }));
  }

  // 9) Data reconciliation job (wallet vs orders vs payments).
  runReconciliationJob(org_id: string) {
    const orders = Array.from(this.orders.values()).filter((x) => x.org_id === org_id);
    const payments = Array.from(this.payments.values()).filter((x) => x.org_id === org_id);
    const sales = Array.from(this.sales.values()).filter((x) => x.org_id === org_id);
    const wallets = Array.from(this.walletLedger.values()).filter((x) => x.org_id === org_id);

    const missingPayments = orders.filter((o) => !payments.some((p) => p.order_id === o.order_id));
    const paymentSaleMismatch = payments.filter((p) => !sales.some((s) => s.sale_id === Array.from(this.orders.values()).find((o) => o.order_id === p.order_id)?.sale_id));
    const missingWalletEntries = payments.filter((p) => !wallets.some((w) => w.payment_id === p.payment_id));

    return {
      org_id,
      checkedAt: now(),
      totals: {
        orders: orders.length,
        payments: payments.length,
        sales: sales.length,
        walletEntries: wallets.length,
      },
      anomalies: {
        missingPayments: missingPayments.map((x) => x.order_id),
        paymentSaleMismatch: paymentSaleMismatch.map((x) => x.payment_id),
        missingWalletEntries: missingWalletEntries.map((x) => x.payment_id),
      },
      financiallyAccurate: missingPayments.length === 0 && paymentSaleMismatch.length === 0 && missingWalletEntries.length === 0,
    };
  }

  runRevenueReconJob(org_id: string) {
    return this.runReconciliationJob(org_id);
  }

  runLeadToAccessE2E(input: LeadToAccessInput) {
    if (this.deploymentFrozen) {
      return { ok: false, error: 'release_frozen' };
    }

    const org_id = input.org_id || 'org-default';
    const startedAt = Date.now();

    const compensation: Array<() => void> = [];
    const chain: Partial<ChainResult> = {};

    const step = <T>(name: string, moduleId: CoreModuleId, runner: () => T, rollback: () => void): T => {
      if (this.incidentMode && !this.incidentAllowedModules.has(moduleId)) {
        throw new Error(`incident_mode_blocked:${moduleId}`);
      }
      if (!this.health[moduleId]?.healthy && this.getDependencyFallback(moduleId).fallback) {
        throw new Error(`module_unhealthy:${moduleId}`);
      }
      if (input.failAt === name) {
        throw new Error(`forced_failure:${name}`);
      }
      const value = runner();
      compensation.push(rollback);
      return value;
    };

    try {
      const lead = step(
        'lead',
        'lead_manager',
        () => {
          if (this.uniqueEmails.has(input.email.toLowerCase())) {
            throw new Error(`unique_violation:email:${input.email}`);
          }
          const data = LeadSchema.parse({
            lead_id: uid('lead'),
            org_id,
            source: input.source,
            email: input.email,
            score: input.score,
            created_at: now(),
          });
          this.uniqueEmails.add(data.email.toLowerCase());
          this.leads.set(this.k(org_id, data.lead_id), data);
          this.index(org_id, data.lead_id, ['lead', data.lead_id, data.email, data.source]);
          this.emit('LEAD_CAPTURED', 'lead_manager', data);
          return data;
        },
        () => {
          const id = chain.lead_id as string;
          const existingLead = this.leads.get(this.k(org_id, id));
          if (existingLead?.email) {
            this.uniqueEmails.delete(String(existingLead.email).toLowerCase());
          }
          this.leads.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.lead_id = lead.lead_id;

      const sale = step(
        'sale',
        'sales_engine',
        () => {
          const data = SaleSchema.parse({
            sale_id: uid('sale'),
            org_id,
            lead_id: lead.lead_id,
            amount: Number((input.amount * this.settings.pricingMultiplier).toFixed(2)),
            currency: 'USD',
            created_at: now(),
          });
          this.sales.set(this.k(org_id, data.sale_id), data);
          this.index(org_id, data.sale_id, ['sale', data.sale_id, data.lead_id, String(data.amount)]);
          this.emit('SALE_CREATED', 'sales_engine', data);
          return data;
        },
        () => {
          const id = chain.sale_id as string;
          this.sales.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.sale_id = sale.sale_id;

      const order = step(
        'order',
        'order_system',
        () => {
          this.assertEntityWriteOwnership('order', 'order-system');
          const data = OrderSchema.parse({
            order_id: uid('order'),
            org_id,
            lead_id: lead.lead_id,
            sale_id: sale.sale_id,
            items: input.items,
            created_at: now(),
          });
          if (this.uniqueOrderIds.has(data.order_id)) {
            throw new Error(`unique_violation:order_id:${data.order_id}`);
          }
          this.uniqueOrderIds.add(data.order_id);
          this.orders.set(this.k(org_id, data.order_id), data);
          this.index(org_id, data.order_id, ['order', data.order_id, data.sale_id, data.lead_id]);
          this.emit('ORDER_CREATED', 'order_system', data);
          return data;
        },
        () => {
          const id = chain.order_id as string;
          this.uniqueOrderIds.delete(id);
          this.orders.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.order_id = order.order_id;

      const payment = step(
        'payment',
        'payment_gateway',
        () => {
          if (this.isFeatureEnabled('payments.capture.enabled') === false) {
            throw new Error('feature_flag_blocked:payments.capture.enabled');
          }

          const fraud = this.evaluateFraud({
            org_id,
            order_id: order.order_id,
            amount: sale.amount,
            itemCount: order.items.length,
          });
          if (fraud.hold) {
            throw new Error(`fraud_hold:${order.order_id}`);
          }

          const data = PaymentSchema.parse({
            payment_id: uid('payment'),
            org_id,
            lead_id: lead.lead_id,
            order_id: order.order_id,
            amount: sale.amount,
            status: 'captured',
            created_at: now(),
          });
          this.payments.set(this.k(org_id, data.payment_id), data);
          this.assertEntityWriteOwnership('wallet', 'finance-manager');
          this.walletLedger.set(this.k(org_id, data.payment_id), {
            org_id,
            payment_id: data.payment_id,
            order_id: data.order_id,
            amount: data.amount,
            created_at: data.created_at,
          });
          this.index(org_id, data.payment_id, ['payment', data.payment_id, data.order_id, data.lead_id]);
          this.emit('PAYMENT_CAPTURED', 'payment_gateway', data);
          return data;
        },
        () => {
          const id = chain.payment_id as string;
          this.payments.delete(this.k(org_id, id));
          this.walletLedger.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.payment_id = payment.payment_id;

      const license = step(
        'license',
        'license_system',
        () => {
          const data = LicenseSchema.parse({
            license_id: uid('license'),
            org_id,
            lead_id: lead.lead_id,
            payment_id: payment.payment_id,
            plan: input.plan,
            created_at: now(),
          });
          this.licenses.set(this.k(org_id, data.license_id), data);
          this.index(org_id, data.license_id, ['license', data.license_id, data.payment_id, data.lead_id, data.plan]);
          this.emit('LICENSE_ACTIVATED', 'license_system', data);
          return data;
        },
        () => {
          const id = chain.license_id as string;
          this.licenses.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.license_id = license.license_id;

      const access = step(
        'access',
        'user_dashboard',
        () => {
          const data = AccessSchema.parse({
            access_id: uid('access'),
            org_id,
            lead_id: lead.lead_id,
            license_id: license.license_id,
            user_id: input.user_id,
            created_at: now(),
          });
          this.accesses.set(this.k(org_id, data.access_id), data);
          this.index(org_id, data.access_id, ['access', data.access_id, data.license_id, data.user_id]);
          this.emit('ACCESS_GRANTED', 'user_dashboard', data);
          return data;
        },
        () => {
          const id = chain.access_id as string;
          this.accesses.delete(this.k(org_id, id));
          this.unindex(org_id, id);
        },
      );
      chain.access_id = access.access_id;

      this.metrics.conversions += 1;
      this.sampleLatency(Date.now() - startedAt);
      this.evaluateKpiGuardrails();

      return {
        ok: true,
        chain: chain as ChainResult,
      };
    } catch (error) {
      if (input.failAt === 'payment' || String(error).includes('payment')) {
        this.paymentFailCounter += 1;
      }
      while (compensation.length > 0) {
        const undo = compensation.pop();
        undo?.();
      }
      this.metrics.errorCount += 1;
      this.sampleLatency(Date.now() - startedAt);
      this.evaluateKpiGuardrails();
      this.emit('SAGA_ROLLBACK', 'security_manager', {
        org_id,
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }

  assertEntityWriteOwnership(entity: OwnedEntity, writer: OwnerModule, bossOverride = false) {
    if (bossOverride) return { allowed: true, owner: ENTITY_OWNERS[entity] };
    const owner = ENTITY_OWNERS[entity];
    if (owner !== writer) {
      throw new Error(`ownership_violation:${entity}:owner=${owner}:writer=${writer}`);
    }
    return { allowed: true, owner };
  }

  validateApiContract(endpoint: '/api/v1/orders' | '/api/v1/products', phase: 'request' | 'response', payload: unknown) {
    if (endpoint === '/api/v1/orders') {
      return phase === 'request'
        ? ORDER_API_REQUEST_SCHEMA.safeParse(payload)
        : ORDER_API_RESPONSE_SCHEMA.safeParse(payload);
    }
    return phase === 'request'
      ? PRODUCT_API_REQUEST_SCHEMA.safeParse(payload)
      : PRODUCT_API_RESPONSE_SCHEMA.safeParse(payload);
  }

  getFailureVisibilityPanel() {
    const failedJobs = this.dlq.map((x) => ({ eventId: x.event.eventId, reason: x.reason, at: x.at }));
    const failedApis = this.eventLog
      .filter((x) => x.type === 'SAGA_ROLLBACK')
      .map((x) => ({ eventId: x.eventId, reason: x.payload?.reason || 'unknown', at: x.at }));
    const brokenFlows = (Object.keys(this.health) as CoreModuleId[])
      .filter((moduleId) => !this.health[moduleId].healthy)
      .map((moduleId) => this.getDependencyFallback(moduleId));

    return {
      at: now(),
      failedJobs,
      failedApis,
      brokenFlows,
      alerts: this.onCallAlerts.filter((x) => !x.acknowledged),
    };
  }

  resumeInterruptedFlows(org_id: string) {
    const orders = Array.from(this.orders.values()).filter((x) => x.org_id === org_id);
    const payments = Array.from(this.payments.values()).filter((x) => x.org_id === org_id);
    const licenses = Array.from(this.licenses.values()).filter((x) => x.org_id === org_id);
    const accesses = Array.from(this.accesses.values()).filter((x) => x.org_id === org_id);

    const resumed: string[] = [];
    for (const payment of payments) {
      const order = orders.find((o) => o.order_id === payment.order_id);
      if (!order) continue;

      let license = licenses.find((l) => l.payment_id === payment.payment_id);
      if (!license) {
        license = LicenseSchema.parse({
          license_id: uid('license-resume'),
          org_id,
          lead_id: payment.lead_id,
          payment_id: payment.payment_id,
          plan: 'resume-plan',
          created_at: now(),
        });
        this.licenses.set(this.k(org_id, license.license_id), license);
        resumed.push(`license:${license.license_id}`);
      }

      const existingAccess = accesses.find((a) => a.license_id === license.license_id);
      if (!existingAccess) {
        const access = AccessSchema.parse({
          access_id: uid('access-resume'),
          org_id,
          lead_id: payment.lead_id,
          license_id: license.license_id,
          user_id: `resume-${payment.lead_id}`,
          created_at: now(),
        });
        this.accesses.set(this.k(org_id, access.access_id), access);
        resumed.push(`access:${access.access_id}`);
      }
    }

    return { org_id, resumedCount: resumed.length, resumed };
  }

  setProviderHealth(key: 'payment' | 'ai', primaryUp: boolean, fallbackUp: boolean) {
    this.providerState[key] = { key, primaryUp, fallbackUp };
    return this.providerState[key];
  }

  executeWithDependencyFallback<T>(key: 'payment' | 'ai', primary: () => T, fallback: () => T) {
    const provider = this.providerState[key];
    if (provider.primaryUp) {
      return { provider: 'primary', value: primary() };
    }
    if (provider.fallbackUp) {
      this.raiseOnCallAlert('high', 'Dependency fallback activated', `${key} primary unavailable, fallback active`);
      return { provider: 'fallback', value: fallback() };
    }
    throw new Error(`dependency_unavailable:${key}`);
  }

  forceApproveReject(actor: string, targetId: string, approve: boolean, note?: string) {
    const action: OverrideAction = {
      id: uid('ovr'),
      type: approve ? 'force_approve' : 'force_reject',
      actor,
      targetId,
      note,
      at: now(),
    };
    this.overrideActions.push(action);
    return action;
  }

  forceCompleteOrder(actor: string, order_id: string, note?: string) {
    const action: OverrideAction = {
      id: uid('ovr'),
      type: 'force_complete_order',
      actor,
      targetId: order_id,
      note,
      at: now(),
    };
    this.overrideActions.push(action);
    return action;
  }

  forceDelivery(actor: string, order_id: string, note?: string) {
    const action: OverrideAction = {
      id: uid('ovr'),
      type: 'force_delivery',
      actor,
      targetId: order_id,
      note,
      at: now(),
    };
    this.overrideActions.push(action);
    return action;
  }

  manualLedgerEntry(actor: string, org_id: string, payment_id: string, order_id: string, amount: number, note?: string) {
    this.walletLedger.set(this.k(org_id, payment_id), {
      org_id,
      payment_id,
      order_id,
      amount,
      created_at: now(),
    });
    const action: OverrideAction = {
      id: uid('ovr'),
      type: 'manual_ledger_entry',
      actor,
      targetId: payment_id,
      note,
      at: now(),
    };
    this.overrideActions.push(action);
    return action;
  }

  manualPayout(actor: string, targetId: string, note?: string) {
    const action: OverrideAction = {
      id: uid('ovr'),
      type: 'manual_payout',
      actor,
      targetId,
      note,
      at: now(),
    };
    this.overrideActions.push(action);
    return action;
  }

  getOverrideLog() {
    return this.overrideActions;
  }

  setRetentionPolicy(partial: Partial<RetentionPolicy>) {
    this.retentionPolicy = { ...this.retentionPolicy, ...partial, transactionMode: 'permanent' };
    return this.retentionPolicy;
  }

  runRetentionSweep() {
    const cutoffLogs = Date.now() - this.retentionPolicy.logsDays * 24 * 60 * 60 * 1000;
    const cutoffAnalytics = Date.now() - this.retentionPolicy.analyticsDays * 24 * 60 * 60 * 1000;

    const logsBefore = this.eventLog.length;
    this.eventLog = this.eventLog.filter((x) => new Date(x.at).getTime() >= cutoffLogs || x.type === 'AUDIT_LOG');
    const prunedLogs = logsBefore - this.eventLog.length;

    const analyticsBefore = this.notifications.length;
    this.notifications = this.notifications.filter((x) => new Date(x.at).getTime() >= cutoffAnalytics);
    const prunedAnalytics = analyticsBefore - this.notifications.length;

    return {
      prunedLogs,
      prunedAnalytics,
      retainedTransactions: this.payments.size,
      completedAt: now(),
    } as RetentionSweepSummary;
  }

  softDelete(resource: string, id: string) {
    this.softDeleted.set(`${resource}:${id}`, { deleted_at: now(), resource });
    return this.softDeleted.get(`${resource}:${id}`);
  }

  registerConsent(user_id: string, termsAccepted: boolean, privacyAccepted: boolean, ip: string) {
    const record: ConsentRecord = {
      user_id,
      termsAcceptedAt: termsAccepted ? now() : null,
      privacyAcceptedAt: privacyAccepted ? now() : null,
      ip,
    };
    this.consentRecords.set(user_id, record);
    return record;
  }

  exportUserData(user_id: string) {
    const leads = Array.from(this.leads.values()).filter((x) => x.email?.includes(user_id) || x.user_id === user_id);
    const accesses = Array.from(this.accesses.values()).filter((x) => x.user_id === user_id);
    return {
      exportedAt: now(),
      user_id,
      consent: this.consentRecords.get(user_id) ?? null,
      leads,
      accesses,
      feedback: this.customerFeedback.filter((x) => x.user_id === user_id),
    };
  }

  upsertProduct(writer: OwnerModule, input: unknown, bossOverride = false) {
    this.assertEntityWriteOwnership('product', writer, bossOverride);
    const parsed = PRODUCT_API_REQUEST_SCHEMA.parse(input);
    const key = this.k(parsed.org_id, parsed.product_id);
    const existing = this.products.get(key);

    if (!existing && this.uniqueProductSlugs.has(parsed.slug)) {
      throw new Error(`unique_violation:product_slug:${parsed.slug}`);
    }

    if (existing?.slug && existing.slug !== parsed.slug) {
      this.uniqueProductSlugs.delete(existing.slug);
    }
    this.uniqueProductSlugs.add(parsed.slug);

    this.products.set(key, parsed);
    this.index(parsed.org_id, parsed.product_id, ['product', parsed.slug, parsed.title]);
    return parsed;
  }

  createSignedDownloadUrl(fileKey: string, ttlSeconds: number) {
    const expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;
    const token = uid('sig');
    return {
      url: `/secure-download/${encodeURIComponent(fileKey)}?token=${encodeURIComponent(token)}&exp=${expiresAt}`,
      token,
      expiresAt,
    };
  }

  validateSignedDownloadUrl(exp: number) {
    return { valid: Date.now() <= exp, now: Date.now(), exp };
  }

  logSensitiveAccess(actor: string, resource: string, action: string) {
    const entry: AccessLogEntry = { id: uid('acl'), actor, resource, action, at: now() };
    this.accessLogs.push(entry);
    return entry;
  }

  getAccessLogs() {
    return this.accessLogs;
  }

  checkRateLimit(userId: string, ip: string) {
    const nowTs = Date.now();
    const apply = (map: Map<string, RateLimitBucket>, key: string, max: number) => {
      const existing = map.get(key);
      if (!existing || nowTs - existing.windowStart >= this.rateLimitPolicy.windowMs) {
        const fresh = { count: 1, windowStart: nowTs };
        map.set(key, fresh);
        return { allowed: true, remaining: max - 1 };
      }
      existing.count += 1;
      return { allowed: existing.count <= max, remaining: Math.max(0, max - existing.count) };
    };

    const byUser = apply(this.userRateLimits, userId, this.rateLimitPolicy.perUser);
    const byIp = apply(this.ipRateLimits, ip, this.rateLimitPolicy.perIp);
    return {
      allowed: byUser.allowed && byIp.allowed,
      userRemaining: byUser.remaining,
      ipRemaining: byIp.remaining,
    };
  }

  setRateLimitPolicy(policy: Partial<RateLimitPolicy>) {
    this.rateLimitPolicy = { ...this.rateLimitPolicy, ...policy };
    return this.rateLimitPolicy;
  }

  setClockDriftMs(driftMs: number) {
    this.clockDriftMs = driftMs;
    return this.clockDriftMs;
  }

  getClockSyncStatus(maxAllowedDriftMs = 1000) {
    return {
      utcNow: new Date().toISOString(),
      ntpDriftMs: this.clockDriftMs,
      inSync: Math.abs(this.clockDriftMs) <= maxAllowedDriftMs,
    };
  }

  setConfigBaseline(config: Record<string, string>) {
    this.configBaseline = new Map(Object.entries(config));
  }

  setRuntimeConfig(config: Record<string, string>) {
    this.configRuntime = new Map(Object.entries(config));
  }

  validateConfigDrift() {
    const drift: Array<{ key: string; expected: string; actual: string | null }> = [];
    for (const [key, expected] of this.configBaseline.entries()) {
      const actual = this.configRuntime.get(key) ?? null;
      if (actual !== expected) {
        drift.push({ key, expected, actual });
      }
    }
    return { ok: drift.length === 0, drift };
  }

  searchWithFallback(query: string, org_id?: string) {
    const indexed = this.globalSearch(query, org_id);
    if (indexed.length > 0) {
      return { mode: 'index', results: indexed };
    }
    const state = this.getStateStore(org_id);
    const haystack = [...state.leads, ...state.sales, ...state.orders, ...state.payments, ...state.licenses, ...state.accesses];
    const q = query.toLowerCase();
    const results = haystack
      .map((item) => ({ id: item.lead_id || item.sale_id || item.order_id || item.payment_id || item.license_id || item.access_id, text: JSON.stringify(item).toLowerCase() }))
      .filter((x) => x.text.includes(q));
    return { mode: 'db-fallback', results };
  }

  setDeploymentFreeze(enabled: boolean, reason?: string) {
    this.deploymentFrozen = enabled;
    if (enabled) {
      this.raiseOnCallAlert('high', 'Release freeze enabled', reason || 'incident release freeze');
    }
    return { frozen: this.deploymentFrozen };
  }

  isDeploymentFrozen() {
    return this.deploymentFrozen;
  }

  setAlertThresholds(partial: Partial<AlertThresholds>) {
    this.alertThresholds = { ...this.alertThresholds, ...partial };
    return this.alertThresholds;
  }

  evaluateOperationalThresholds(input: { cpuPct: number; errorRate: number; paymentFailures: number }) {
    if (input.cpuPct >= this.alertThresholds.cpuPct) {
      this.raiseOnCallAlert('critical', 'CPU threshold breached', `cpu=${input.cpuPct} threshold=${this.alertThresholds.cpuPct}`);
    }
    if (input.errorRate >= this.alertThresholds.errorRate) {
      this.raiseOnCallAlert('critical', 'Error rate threshold breached', `errorRate=${input.errorRate} threshold=${this.alertThresholds.errorRate}`);
    }
    if (input.paymentFailures >= this.alertThresholds.paymentFailCount) {
      this.raiseOnCallAlert('high', 'Payment failure threshold breached', `paymentFailures=${input.paymentFailures}`);
    }

    this.deduplicateOpenAlerts();
    return this.getOnCallAlerts();
  }

  private deduplicateOpenAlerts() {
    const seen = new Set<string>();
    this.onCallAlerts = this.onCallAlerts.filter((alert) => {
      if (alert.acknowledged) return true;
      const key = `${alert.severity}:${alert.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  createDailyHealthReport(org_id?: string): DailyHealthReport {
    const state = this.getStateStore(org_id);
    const revenue = state.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const users = new Set(state.accesses.map((a) => a.user_id)).size;
    const failures = this.getFailureVisibilityPanel().failedJobs.length + this.getFailureVisibilityPanel().brokenFlows.length;
    return {
      at: now(),
      errors: this.metrics.errorCount,
      revenue,
      users,
      failures,
    };
  }

  recordResourceUsage(cpuPct: number, ramPct: number) {
    const unhealthy = cpuPct >= 95 || ramPct >= 95;
    this.latestResourceSample = {
      cpuPct,
      ramPct,
      workerHealthy: !unhealthy,
      sampledAt: now(),
    };
    if (unhealthy) {
      this.raiseOnCallAlert('critical', 'Worker unhealthy', `cpu=${cpuPct}, ram=${ramPct}`);
    }
    return this.latestResourceSample;
  }

  getWorkerRecoveryPlan() {
    return {
      ...this.latestResourceSample,
      action: this.latestResourceSample.workerHealthy ? 'hold' : 'restart_unhealthy_workers',
    };
  }

  private async processTaskQueue() {
    const priority = (t: QueuedTask) => {
      if (t.taskType === 'payment') return 300;
      if (t.taskType === 'order') return 200;
      if (t.taskType === 'analytics') return 100;
      return 50;
    };

    this.queue.sort((a, b) => priority(b) - priority(a));

    const task = this.queue.shift();
    if (!task) return { ok: true, message: 'no_task' };

    if (this.currentLoad >= this.loadSheddingThreshold && !task.critical) {
      this.metrics.shedCount += 1;
      return { ok: false, shed: true, taskId: task.id };
    }

    const started = Date.now();
    try {
      const result = await Promise.resolve(task.fn());
      this.sampleLatency(Date.now() - started);
      return { ok: true, taskId: task.id, result };
    } catch (error) {
      this.metrics.errorCount += 1;
      this.sampleLatency(Date.now() - started);
      return { ok: false, taskId: task.id, error: error instanceof Error ? error.message : 'task_error' };
    }
  }

  private dispatchTaskWithRetry(task: EventTask) {
    while (task.attempts < task.maxAttempts) {
      try {
        task.attempts += 1;
        task.handler(task.event);
        return;
      } catch (error) {
        this.metrics.retriedEvents += 1;
        if (task.attempts >= task.maxAttempts) {
          this.dlq.push({
            event: task.event,
            reason: error instanceof Error ? error.message : 'handler_error',
            attempts: task.attempts,
            at: now(),
          });
          this.metrics.dlqCount += 1;
          this.metrics.errorCount += 1;
          return;
        }
      }
    }
  }

  private emit(type: InterconnectEventType, moduleId: CoreModuleId, payload: Record<string, any>) {
    const event: InterconnectEvent = {
      eventId: uid('evt'),
      type,
      moduleId,
      payload,
      at: now(),
    };

    this.publishWithRetry(event);
  }

  private index(org_id: string, id: string, parts: string[]) {
    this.searchDocs.set(this.k(org_id, id), parts.join(' ').toLowerCase());
  }

  private unindex(org_id: string, id: string) {
    this.searchDocs.delete(this.k(org_id, id));
  }

  private k(org_id: string, id: string) {
    return `${org_id}:${id}`;
  }

  private sampleLatency(ms: number) {
    this.metrics.latencySamples += 1;
    this.metrics.latencyMsTotal += Math.max(0, ms);
  }

  private raiseOnCallAlert(severity: 'critical' | 'high' | 'medium', title: string, details: string) {
    this.onCallAlerts.push({
      id: uid('alt'),
      severity,
      title,
      details,
      at: now(),
      acknowledged: false,
    });
  }

  private evaluateKpiGuardrails() {
    const metrics = this.getMetrics();
    if (metrics.conversionRate < this.kpiGuardrails.minConversionRate) {
      this.raiseOnCallAlert(
        'high',
        'KPI guardrail breach: conversion',
        `Conversion ${metrics.conversionRate.toFixed(4)} below min ${this.kpiGuardrails.minConversionRate.toFixed(4)}`,
      );
    }
    if (metrics.errorRate > this.kpiGuardrails.maxErrorRate) {
      this.raiseOnCallAlert(
        'critical',
        'KPI guardrail breach: error rate',
        `Error rate ${metrics.errorRate.toFixed(4)} above max ${this.kpiGuardrails.maxErrorRate.toFixed(4)}`,
      );
    }
  }
}

export const globalInterconnectEngine = new GlobalInterconnectEngine();
