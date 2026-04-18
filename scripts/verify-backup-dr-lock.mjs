#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [
  'config/backup-dr-policy.json',
  'scripts/disaster-recover.mjs',
  'scripts/run-dr-drill.mjs',
  'docs/RUNBOOKS.md',
];

const failures = [];
for (const rel of files) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

if (fs.existsSync(path.join(ROOT, 'config/backup-dr-policy.json'))) {
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/backup-dr-policy.json'), 'utf8'));
  if (!policy?.targets?.rto_minutes_max || !policy?.targets?.rpo_minutes_max) {
    failures.push('backup_policy_missing_rto_rpo_targets');
  }
  if (!policy?.verification?.checksum_required) {
    failures.push('backup_policy_checksum_verification_not_enabled');
  }
}

if (failures.length > 0) {
  console.error('BACKUP/DR LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Backup/DR lock passed: policy, drill, and recover runbook contracts are present.');
