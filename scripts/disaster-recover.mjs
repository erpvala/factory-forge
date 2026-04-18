#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const policyPath = path.join(ROOT, 'config', 'backup-dr-policy.json');

if (!fs.existsSync(policyPath)) {
  console.error('DISASTER RECOVER FAILED: missing config/backup-dr-policy.json');
  process.exit(1);
}

const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

console.log('DISASTER RECOVER RUNBOOK (simulated contract)');
console.log('1) Switch DNS to standby target');
console.log('2) Restore latest snapshot from verified backup');
console.log('3) Replay WAL/incremental logs to target timestamp');
console.log('4) Run health check: login -> control-panel -> order flow');
console.log('5) Re-open traffic after validation');
console.log(`Targets: RTO <= ${policy.targets?.rto_minutes_max} min, RPO <= ${policy.targets?.rpo_minutes_max} min`);
