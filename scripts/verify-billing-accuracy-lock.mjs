#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];

const required = [
  'config/billing-control-policy.json',
  'src/services/billingReconciliationGuard.ts',
  'docs/BILLING_RECONCILIATION_LOCK.md',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

const policyPath = path.join(ROOT, 'config/billing-control-policy.json');
if (fs.existsSync(policyPath)) {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  if (policy.billing_source !== 'ledger') failures.push('billing_source_not_ledger');
  if (!policy.reconciliation?.alert_on_mismatch) failures.push('reconciliation_alert_not_enabled');
}

if (failures.length > 0) {
  console.error('BILLING ACCURACY LOCK FAILED.');
  for (const item of failures) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log('Billing accuracy lock passed: ledger source and reconciliation contracts are present.');
