#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const policyPath = path.join(ROOT, 'config', 'release-control-policy.json');

if (!fs.existsSync(policyPath)) {
  console.error('ROLLBACK FAILED: missing config/release-control-policy.json');
  process.exit(1);
}

const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
console.log('ONE-CLICK ROLLBACK RUNBOOK (contract mode)');
console.log('1) Revert app artifact to previous tagged release');
console.log('2) Apply safe DB down migration or point-in-time restore');
console.log('3) Restore prior config snapshot');
console.log('4) Re-run release validation checks');
console.log(`Auto rollback enabled: ${Boolean(policy.auto_rollback?.enabled)}`);
