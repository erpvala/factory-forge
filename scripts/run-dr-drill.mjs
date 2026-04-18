#!/usr/bin/env node
import { execSync } from 'node:child_process';

const steps = [
  'node scripts/verify-backup-dr-lock.mjs',
  'node scripts/flow-integrity-check.mjs',
  'npm run test:e2e:lock',
];

for (const step of steps) {
  console.log(`DR Drill step: ${step}`);
  execSync(step, { stdio: 'inherit' });
}

console.log('DR drill completed: restore-contract + smoke path checks passed.');
