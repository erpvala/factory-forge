#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const REQUIRED = {
  ALLOW_OLD_ROUTES: 'false',
  FORCE_CONTROL_PANEL: 'true',
  SYSTEM_MODE: 'NEW_ONLY',
  ALLOW_LEGACY_DB: 'false',
  ALLOW_LEGACY_API: 'false',
  VITE_SYSTEM_MODE: 'NEW_ONLY',
  VITE_ALLOW_LEGACY_API: 'false',
  VITE_SCHEMA_VERSION: 'v1',
};

function parseEnv(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

if (!fs.existsSync(ENV_PATH)) {
  console.error('ENV LOCK FAILED: .env file is missing.');
  process.exit(1);
}

const map = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
const violations = [];

for (const [key, expected] of Object.entries(REQUIRED)) {
  const actual = process.env[key] ?? map.get(key);
  if (actual !== expected) {
    violations.push(`${key} expected=${expected} actual=${actual ?? '<missing>'}`);
  }
}

if (violations.length > 0) {
  console.error('ENV LOCK FAILED.');
  for (const violation of violations) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log('Env lock passed.');