#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const routeConfigPath = path.join(ROOT, 'route_config.json');
const middlewarePath = path.join(ROOT, 'src', 'middleware.ts');
const registryPath = path.join(ROOT, 'src', 'config', 'controlPanelModules.ts');
const appPath = path.join(ROOT, 'src', 'App.tsx');
const e2ePath = path.join(ROOT, 'tests', 'ultra-god-no-gap.spec.ts');

const failures = [];

if (!fs.existsSync(routeConfigPath)) {
  failures.push('missing_route_config');
} else {
  const cfg = JSON.parse(fs.readFileSync(routeConfigPath, 'utf8'));
  const allowed = Array.isArray(cfg.allowed) ? cfg.allowed.slice().sort() : [];
  const expectedAllowed = ['/api/*', '/control-panel', '/login'].sort();
  if (JSON.stringify(allowed) !== JSON.stringify(expectedAllowed)) {
    failures.push('route_allowlist_not_locked_to_login_control_panel_api');
  }
}

if (!fs.existsSync(middlewarePath)) {
  failures.push('missing_middleware');
} else {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  if (!content.includes("'/login'") || !content.includes("'/control-panel'") || !content.includes("'/api'")) {
    failures.push('middleware_allowlist_missing_core_paths');
  }
  if (!content.includes("'/admin'") || !content.includes("'/super-admin'") || !content.includes("'/user'")) {
    failures.push('middleware_blocklist_missing_legacy_admin_paths');
  }
  if (!content.includes('STRICT_ZERO_TRUST_CONTROL_PANEL')) {
    failures.push('middleware_missing_zero_trust_toggle');
  }
}

if (!fs.existsSync(registryPath)) {
  failures.push('missing_module_registry');
} else {
  const content = fs.readFileSync(registryPath, 'utf8');
  if (!content.includes('owner:')) failures.push('registry_missing_owner_field');
  if (!content.includes('path: `/control-panel/${seed.id}`')) failures.push('registry_route_derivation_not_locked');
  if (!content.includes('apiBase: `/api/v1/${seed.id}`')) failures.push('registry_api_derivation_not_locked');
}

if (!fs.existsSync(appPath)) {
  failures.push('missing_app_router');
} else {
  const content = fs.readFileSync(appPath, 'utf8');
  if (!content.includes('<Route path="/admin" element={<Navigate to={ROUTES.login} replace />} />')) {
    failures.push('admin_route_not_hard_redirected_to_login');
  }
  if (!content.includes('<Route path="/super-admin" element={<Navigate to={ROUTES.login} replace />} />')) {
    failures.push('super_admin_route_not_hard_redirected_to_login');
  }
}

if (!fs.existsSync(e2ePath)) {
  failures.push('missing_ultra_god_e2e_spec');
}

if (failures.length > 0) {
  console.error('ULTRA GOD E2E LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Ultra God E2E lock passed: single-panel, zero-trust, route lock, and test contracts are present.');
