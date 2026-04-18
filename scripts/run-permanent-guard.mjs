#!/usr/bin/env node
import { execSync } from 'node:child_process';

const checks = [
  'node scripts/guard-banned-ui.mjs',
  'node scripts/guard-banned-route-tokens.mjs',
  'node scripts/enforce-route-allowlist.mjs',
  'node scripts/validate-button-actions.mjs',
  'node scripts/verify-route-config-signature.mjs',
  'node scripts/verify-route-manifest-hash.mjs',
  'node scripts/verify-module-synchronization.mjs',
  'node scripts/verify-ui-integrity-lock.mjs',
  'node scripts/verify-privacy-lock.mjs',
  'node scripts/verify-latency-lock.mjs',
  'node scripts/verify-cost-profit-lock.mjs',
  'node scripts/verify-version-rollback-lock.mjs',
  'node scripts/verify-billing-accuracy-lock.mjs',
  'node scripts/verify-account-security-lock.mjs',
  'node scripts/verify-ultra-god-e2e-lock.mjs',
  'node scripts/verify-backup-dr-lock.mjs',
  'node scripts/verify-knowledge-lock.mjs',
  'node scripts/flow-integrity-check.mjs',
  'node scripts/guard-env-lock.mjs',
  'node scripts/guard-new-only-runtime.mjs',
  'node scripts/guard-schema-contract-lock.mjs',
  'node scripts/guard-transaction-boundary.mjs',
  'node scripts/guard-hook-system-lock.mjs',
  'node scripts/guard-global-flow-lock.mjs',
  'node scripts/run-data-migration.mjs --strict',
  'node scripts/validate-data-migration.mjs',
  'node scripts/cleanup-ghost-data.mjs',
];

for (const check of checks) {
  console.log(`Running: ${check}`);
  execSync(check, { stdio: 'inherit' });
}

console.log('Permanent guard checks passed.');