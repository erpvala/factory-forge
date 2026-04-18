#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredFiles = [
  'src/lib/hooks/globalHookSystem.ts',
  'src/pages/control-panel/HooksControlPanel.tsx',
  'src/lib/api/edge-client.ts',
  'src/App.tsx',
  'src/app/api/v1/hooks/trigger/route.ts',
  'src/app/api/v1/hooks/logs/route.ts',
  'src/app/api/v1/hooks/retry/route.ts',
];

const failures = [];

for (const rel of requiredFiles) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    failures.push(`missing_required_file:${rel}`);
  }
}

if (failures.length === 0) {
  const hookSystem = fs.readFileSync(path.join(ROOT, 'src/lib/hooks/globalHookSystem.ts'), 'utf8');
  const edgeClient = fs.readFileSync(path.join(ROOT, 'src/lib/api/edge-client.ts'), 'utf8');
  const appRouter = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');

  const hookTokens = [
    'pre_action_hook',
    'post_action_hook',
    'error_hook',
    'system_hook',
    'priority',
    'dependsOn',
    'retry_count',
    'trace_id',
    'hook_dependency_blocked',
    'queueKey = `${input.event}`',
    'validateEventModuleBinding',
    'triggerGlobalHooksAsync',
  ];

  for (const token of hookTokens) {
    if (!hookSystem.includes(token)) {
      failures.push(`hook_engine_missing_token:${token}`);
    }
  }

  if (!edgeClient.includes('triggerGlobalHooks')) {
    failures.push('edge_client_missing_trigger_global_hooks');
  }

  if (!edgeClient.includes('triggerGlobalHooksAsync')) {
    failures.push('edge_client_missing_trigger_global_hooks_async');
  }

  if (!appRouter.includes('/control-panel/hooks')) {
    failures.push('app_router_missing_control_panel_hooks_route');
  }

  const triggerRoute = fs.readFileSync(path.join(ROOT, 'src/app/api/v1/hooks/trigger/route.ts'), 'utf8');
  if (!triggerRoute.includes('hook_trigger_unauthorized')) {
    failures.push('hook_trigger_route_missing_unauthorized_guard');
  }
}

if (failures.length > 0) {
  console.error('HOOK SYSTEM LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Hook system lock passed: registry, runner, API endpoints, and control-panel route are connected.');
