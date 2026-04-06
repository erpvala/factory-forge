// @ts-nocheck
// ENGINE 01 — Intent Engine: idea → structured spec
import type { ValaJobRequest, ValaSpec } from '@/vala/types';

const DOMAIN_SIGNALS: Record<string, string[]> = {
  marketplace: ['marketplace', 'catalog', 'seller', 'cart', 'checkout', 'product'],
  crm:         ['crm', 'lead', 'pipeline', 'contact', 'sales'],
  erp:         ['erp', 'inventory', 'procurement', 'finance', 'warehouse'],
  school:      ['school', 'student', 'attendance', 'exam', 'grade'],
  hospital:    ['hospital', 'patient', 'doctor', 'clinic', 'appointment'],
  transport:   ['transport', 'fleet', 'trip', 'driver', 'dispatch'],
  hr:          ['hr', 'employee', 'payroll', 'leave', 'recruitment'],
  pos:         ['pos', 'restaurant', 'order', 'table', 'menu'],
};

const ROUTE_TEMPLATES: Record<string, string[]> = {
  marketplace: ['/marketplace', '/marketplace/product/:id', '/cart', '/checkout', '/orders'],
  crm:         ['/leads', '/leads/:id', '/pipeline', '/contacts', '/deals'],
  erp:         ['/inventory', '/procurement', '/finance', '/reports'],
  school:      ['/students', '/attendance', '/exams', '/grades', '/staff'],
  hospital:    ['/patients', '/appointments', '/doctors', '/billing'],
  transport:   ['/fleet', '/trips', '/drivers', '/dispatch'],
  hr:          ['/employees', '/payroll', '/leave', '/recruitment'],
  pos:         ['/pos', '/menu', '/orders', '/tables', '/reports'],
};

const DB_TEMPLATES: Record<string, string[]> = {
  marketplace: ['products', 'orders', 'cart', 'licenses', 'payments'],
  crm:         ['leads', 'contacts', 'deals', 'activities', 'pipelines'],
  erp:         ['items', 'purchase_orders', 'transactions', 'warehouses'],
  school:      ['students', 'staff', 'attendance', 'exams', 'grades'],
  hospital:    ['patients', 'appointments', 'staff', 'treatments', 'bills'],
  transport:   ['vehicles', 'trips', 'drivers', 'routes', 'logs'],
  hr:          ['employees', 'payroll', 'leave_requests', 'departments'],
  pos:         ['menu_items', 'orders', 'tables', 'payments', 'sessions'],
};

function detectDomain(idea: string): string {
  const lower = idea.toLowerCase();
  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS)) {
    if (signals.some((s) => lower.includes(s))) return domain;
  }
  return 'generic';
}

function extractModules(idea: string, domain: string): string[] {
  const base = ['auth', 'dashboard', 'settings', 'notifications'];
  const domainModules: Record<string, string[]> = {
    marketplace: ['catalog', 'cart', 'checkout', 'orders', 'payments', 'licenses'],
    crm:         ['leads', 'pipeline', 'contacts', 'deals', 'activity-log'],
    erp:         ['inventory', 'procurement', 'finance', 'reporting'],
    school:      ['students', 'attendance', 'exams', 'timetable'],
    hospital:    ['patients', 'appointments', 'pharmacy', 'billing'],
    transport:   ['fleet-management', 'trip-tracking', 'dispatch'],
    hr:          ['employees', 'payroll', 'leave', 'recruitment'],
    pos:         ['menu', 'orders', 'tables', 'reports'],
    generic:     ['core', 'api', 'data'],
  };
  return [...base, ...(domainModules[domain] ?? domainModules.generic)];
}

function extractConstraints(idea: string): string[] {
  const constraints: string[] = [];
  if (/mobile|apk|android/.test(idea.toLowerCase())) constraints.push('mobile-first layout');
  if (/offline/.test(idea.toLowerCase())) constraints.push('offline support required');
  if (/multi.?tenant/.test(idea.toLowerCase())) constraints.push('multi-tenant isolation');
  if (/real.?time/.test(idea.toLowerCase())) constraints.push('real-time sync via websocket');
  if (/payment/.test(idea.toLowerCase())) constraints.push('PCI-DSS compliance');
  constraints.push('UUID primary keys', 'role-based access control', 'audit logging');
  return constraints;
}

function detectAmbiguities(idea: string): string[] {
  const ambiguities: string[] = [];
  if (idea.length < 30) ambiguities.push('Idea is very short — more domain detail needed');
  if (!/\b(user|admin|role|auth)\b/i.test(idea)) ambiguities.push('User roles not specified');
  if (!/\b(payment|free|subscription|license)\b/i.test(idea)) ambiguities.push('Monetisation model unclear');
  return ambiguities;
}

export function runIntentEngine(request: ValaJobRequest): ValaSpec {
  const domain = detectDomain(request.idea);
  const modules = request.modules?.length ? request.modules : extractModules(request.idea, domain);
  const routes   = ROUTE_TEMPLATES[domain]  ?? ['/dashboard', '/settings'];
  const dbTables = DB_TEMPLATES[domain]     ?? ['users', 'settings', 'logs'];
  const apis = modules.map((m) => `POST /api/${m.replace('-', '_')}/init`).concat([
    'GET /api/health',
    'GET /api/metrics',
    'POST /api/auth/login',
  ]);

  return {
    modules,
    routes,
    dbTables,
    apis,
    constraints: extractConstraints(request.idea),
    ambiguities: detectAmbiguities(request.idea),
  };
}
