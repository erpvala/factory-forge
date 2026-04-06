// @ts-nocheck
// ENGINE 02 — System Architect: spec → architecture graph
import type { ValaSpec, ValaArchitect } from '@/vala/types';

const SERVICE_MAP: Record<string, string[]> = {
  auth:       ['AuthService', 'JWTGuard', 'SessionStore'],
  dashboard:  ['MetricsService', 'WidgetRenderer'],
  catalog:    ['CatalogService', 'SearchIndex', 'FilterEngine'],
  cart:       ['CartService', 'CartStore'],
  checkout:   ['CheckoutService', 'PaymentGateway'],
  orders:     ['OrderService', 'OrderProcessor'],
  payments:   ['PaymentService', 'StripeAdapter', 'WebhookHandler'],
  leads:      ['LeadService', 'PipelineEngine'],
  pipeline:   ['StageEngine', 'AutomationRules'],
  inventory:  ['StockService', 'WarehouseAdapter'],
  employees:  ['HRService', 'PayrollProcessor'],
  patients:   ['PatientService', 'AppointmentScheduler'],
  fleet:      ['FleetService', 'GPSAdapter', 'DispatchEngine'],
  notifications: ['NotifyService', 'PushAdapter', 'EmailAdapter'],
  settings:   ['ConfigService', 'FeatureFlagEngine'],
};

function resolveServices(modules: string[]): string[] {
  const services = new Set<string>();
  for (const mod of modules) {
    const svcList = SERVICE_MAP[mod] ?? [`${toPascal(mod)}Service`];
    svcList.forEach((s) => services.add(s));
  }
  return [...services];
}

function toPascal(str: string): string {
  return str
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function buildBoundaries(modules: string[]): Record<string, string[]> {
  const domains: Record<string, string[]> = {
    presentation: [],
    business:     [],
    data:         [],
    integration:  [],
  };
  for (const mod of modules) {
    domains.presentation.push(`${toPascal(mod)}Page`);
    domains.business.push(`${toPascal(mod)}Service`);
    domains.data.push(`${toPascal(mod)}Repository`);
    if (['payments', 'auth', 'notifications'].includes(mod)) {
      domains.integration.push(`${toPascal(mod)}Adapter`);
    }
  }
  return domains;
}

function buildDataFlow(modules: string[]): string[] {
  const flow: string[] = ['Client → API Gateway → Auth Guard'];
  for (const mod of modules.slice(0, 5)) {
    flow.push(`API Gateway → ${toPascal(mod)}Service → ${toPascal(mod)}Repository → DB`);
  }
  flow.push('DB → Event Bus → Notification Service → Client');
  return flow;
}

export function runArchitectEngine(spec: ValaSpec): ValaArchitect {
  return {
    services: resolveServices(spec.modules),
    boundaries: buildBoundaries(spec.modules),
    dataFlow: buildDataFlow(spec.modules),
    standards: [
      'feature-based directory structure',
      'single responsibility per service',
      'typed contracts between layers',
      'idempotent mutations',
      'UUID everywhere',
    ],
    framework: 'vite',
  };
}
