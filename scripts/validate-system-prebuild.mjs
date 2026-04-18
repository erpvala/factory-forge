#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!key) continue;
    parsed[key] = value;
  }
  return parsed;
}

const fileEnv = {
  ...loadEnvFile(path.join(ROOT, '.env')),
  ...loadEnvFile(path.join(ROOT, '.env.local')),
};

const getEnv = (key) => process.env[key] || fileEnv[key] || '';

const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'APP_SIGNATURE',
  'VITE_SYSTEM_MODE',
  'VITE_SCHEMA_VERSION',
];

const optionalAnyProvider = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

for (const key of requiredEnv) {
  if (!getEnv(key) || !String(getEnv(key)).trim()) {
    failures.push(`missing_env:${key}`);
  }
}

const hasProvider = optionalAnyProvider.some((key) => Boolean(getEnv(key) && String(getEnv(key)).trim()));
if (!hasProvider) {
  failures.push(`missing_provider_env:any_of(${optionalAnyProvider.join(',')})`);
}

if (String(getEnv('VITE_SCHEMA_VERSION') || '') !== 'v1') {
  failures.push(`schema_mismatch:expected=v1 actual=${String(getEnv('VITE_SCHEMA_VERSION') || '<missing>')}`);
}

const requiredFiles = [
  'src/app/api/health/route.ts',
  'src/config/controlPanelModules.ts',
  'src/middleware.ts',
  'src/lib/hooks/globalHookSystem.ts',
  'src/lib/api/edge-client.ts',
];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_file:${rel}`);
  }
}

const middlewarePath = path.join(ROOT, 'src/middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middleware = fs.readFileSync(middlewarePath, 'utf8');
  if (!middleware.includes("allowedPrefixes = ['/login', '/control-panel', '/api']")) {
    failures.push('routing_lock_missing');
  }
}

if (failures.length > 0) {
  console.error('PREBUILD SYSTEM VALIDATION FAILED');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Prebuild system validation passed: env/schema/routing/health contracts are valid.');
