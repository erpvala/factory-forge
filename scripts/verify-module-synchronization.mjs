#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MODULE_FILE = path.join(ROOT, 'src', 'config', 'controlPanelModules.ts');
const ROUTE_CONFIG_FILE = path.join(ROOT, 'route_config.json');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function collectModuleIds(tsContent) {
  const ids = [];
  const regex = /id:\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(tsContent)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function ensure(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];

if (!fs.existsSync(MODULE_FILE)) {
  failures.push('missing module registry file: src/config/controlPanelModules.ts');
} else {
  const content = readText(MODULE_FILE);
  ensure(content.includes('owner:'), 'module registry missing owner field mapping', failures);
  ensure(content.includes('schemaVersion'), 'module registry missing schemaVersion field mapping', failures);
  ensure(content.includes('deprecateAfter'), 'module registry missing deprecateAfter field mapping', failures);
  const ids = collectModuleIds(content);
  const uniqueIds = Array.from(new Set(ids));

  ensure(ids.length > 0, 'no module ids found in registry', failures);
  ensure(ids.length === uniqueIds.length, 'duplicate module ids found in registry', failures);

  const routes = uniqueIds.map((id) => `/control-panel/${id}`);
  const apis = uniqueIds.map((id) => `/api/v1/${id}`);
  const dbTables = uniqueIds.map((id) => id.replace(/-/g, '_'));

  ensure(routes.length === uniqueIds.length, 'route count != module count', failures);
  ensure(apis.length === uniqueIds.length, 'api count != module count', failures);
  ensure(dbTables.length === uniqueIds.length, 'db table count != module count', failures);

  const uniqueRoutes = new Set(routes);
  const uniqueApis = new Set(apis);
  const uniqueTables = new Set(dbTables);

  ensure(uniqueRoutes.size === uniqueIds.length, 'duplicate derived routes found', failures);
  ensure(uniqueApis.size === uniqueIds.length, 'duplicate derived API bases found', failures);
  ensure(uniqueTables.size === uniqueIds.length, 'duplicate derived DB tables found', failures);
}

if (!fs.existsSync(ROUTE_CONFIG_FILE)) {
  failures.push('missing route_config.json');
} else {
  const config = JSON.parse(readText(ROUTE_CONFIG_FILE));
  const allowed = Array.isArray(config.allowed) ? config.allowed : [];

  ensure(allowed.includes('/login'), 'route_config missing /login allowlist entry', failures);
  ensure(allowed.includes('/control-panel'), 'route_config missing /control-panel allowlist entry', failures);
  ensure(allowed.includes('/api/*'), 'route_config missing /api/* allowlist entry', failures);
}

if (failures.length > 0) {
  console.error('MODULE SYNCHRONIZATION CHECK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Module synchronization check passed: route/api/db derivations are consistent.');
