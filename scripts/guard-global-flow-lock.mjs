#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredFiles = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/session/route.ts',
  'src/app/api/apply/route.ts',
  'src/app/api/apply/[role]/route.ts',
  'src/app/api/applications/route.ts',
  'src/app/api/applications/[id]/approve/route.ts',
  'src/app/api/v1/products/route.ts',
  'src/app/api/v1/products/[id]/route.ts',
  'src/app/api/v1/orders/route.ts',
  'src/app/api/v1/orders/user/route.ts',
  'src/app/api/v1/payments/init/route.ts',
  'src/app/api/v1/payments/verify/route.ts',
  'src/app/api/v1/licenses/route.ts',
  'src/app/api/v1/tickets/route.ts',
  'src/app/api/v1/assist/message/route.ts',
  'src/app/api/v1/promises/route.ts',
  'src/app/api/v1/ai/request/route.ts',
  'src/app/api/v1/projects/route.ts',
  'src/app/api/v1/deploy/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/orders/user/route.ts',
  'src/app/api/payments/init/route.ts',
  'src/app/api/payments/verify/route.ts',
  'src/app/api/licenses/route.ts',
  'src/app/api/tickets/route.ts',
  'src/app/api/assist/message/route.ts',
  'src/app/api/promises/route.ts',
  'src/app/api/ai/request/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/deploy/route.ts',
  'src/app/api/delivery/jobs/route.ts',
  'src/app/api/delivery/worker/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/analytics/events/route.ts',
  'src/lib/hooks/globalHookSystem.ts',
  'src/lib/api/edge-client.ts',
  'src/App.tsx',
  'src/middleware.ts',
];

const failures = [];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

if (failures.length === 0) {
  const hookSystem = fs.readFileSync(path.join(ROOT, 'src/lib/hooks/globalHookSystem.ts'), 'utf8');
  const edgeClient = fs.readFileSync(path.join(ROOT, 'src/lib/api/edge-client.ts'), 'utf8');
  const appRouter = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  const middleware = fs.readFileSync(path.join(ROOT, 'src/middleware.ts'), 'utf8');

  const mustHaveHookTokens = [
    'pre_action_hook',
    'post_action_hook',
    'error_hook',
    'system_hook',
    'priority',
    'dependsOn',
    'hook_dependency_blocked',
    'payment_success',
    'apply_created',
    'approved',
    'ticket_resolved',
    'triggerGlobalHooksAsync',
    'queueKey = `${input.event}`',
  ];

  for (const token of mustHaveHookTokens) {
    if (!hookSystem.includes(token)) {
      failures.push(`missing_hook_token:${token}`);
    }
  }

  if (!edgeClient.includes('triggerGlobalHooksAsync')) {
    failures.push('edge_client_missing_async_hook_trigger');
  }

  if (!appRouter.includes('/control-panel/hooks')) {
    failures.push('router_missing_hooks_control_panel_route');
  }

  const mustHaveSecurityTokens = ['auth_token', 'x-app-signature', 'x-tenant-id'];
  for (const token of mustHaveSecurityTokens) {
    if (!middleware.toLowerCase().includes(token.toLowerCase())) {
      failures.push(`middleware_missing_security_token:${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error('GLOBAL FLOW LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Global flow lock passed: login/session/control/apply/order/payment/delivery/support/ai/dev paths and hook chain contracts are present.');
