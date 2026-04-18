#!/usr/bin/env node
import { execSync } from 'node:child_process';

const checks = [
  'node scripts/run-permanent-guard.mjs',
  'node scripts/flow-integrity-check.mjs',
  'node scripts/verify-route-manifest-hash.mjs',
];

for (const check of checks) {
  console.log(`Release validation: ${check}`);
  execSync(check, { stdio: 'inherit' });
}

console.log('Release validation passed: health + route + flow checks are green.');
