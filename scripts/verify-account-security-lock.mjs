#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];

const required = [
  'config/account-security-policy.json',
  'src/services/accountTakeoverGuard.ts',
  'docs/ACCOUNT_RECOVERY_SECURITY_LOCK.md',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/login/page.tsx',
  'src/app/api/auth/firebase/login/route.ts',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

const policyPath = path.join(ROOT, 'config/account-security-policy.json');
if (fs.existsSync(policyPath)) {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  if (!policy.takeover_detection?.enabled) failures.push('takeover_detection_not_enabled');
  if (!policy.session_policy?.device_binding_required) failures.push('device_binding_not_required');
  if (!policy.boss_recovery?.manual_unlock_via_boss_panel) failures.push('boss_manual_unlock_not_enabled');
}

if (failures.length > 0) {
  console.error('ACCOUNT SECURITY LOCK FAILED.');
  for (const item of failures) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log('Account security lock passed: recovery and takeover prevention contracts are present.');
