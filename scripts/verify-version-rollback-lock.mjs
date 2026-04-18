#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];

const required = [
  'config/release-control-policy.json',
  'scripts/release-validate.mjs',
  'scripts/release-rollback.mjs',
  'docs/VERSION_ROLLBACK_CONTROL.md',
  'docs/CHANGELOG.md',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

const policyPath = path.join(ROOT, 'config/release-control-policy.json');
if (fs.existsSync(policyPath)) {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  if (!policy.atomic_release) failures.push('atomic_release_not_enabled');
  if (!policy.auto_rollback?.enabled) failures.push('auto_rollback_not_enabled');
  if (!policy.canary?.enabled) failures.push('canary_not_enabled');
  if (policy.frontend_version !== policy.backend_version) failures.push('frontend_backend_version_mismatch');
}

const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  failures.push('missing_supabase_migrations_dir');
}

if (failures.length > 0) {
  console.error('VERSION/ROLLBACK LOCK FAILED.');
  for (const item of failures) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log('Version/Rollback lock passed: tagging, canary, atomic, rollback and migration safety contracts present.');
