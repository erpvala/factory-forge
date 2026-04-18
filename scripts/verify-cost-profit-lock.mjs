#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredFiles = [
  'config/cost-control-policy.json',
  'src/services/costProfitGuard.ts',
  'src/lib/api/edge-client.ts',
];

const failures = [];
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    failures.push(`missing_required_file:${rel}`);
  }
}

if (failures.length === 0) {
  const edgeClient = fs.readFileSync(path.join(ROOT, 'src/lib/api/edge-client.ts'), 'utf8');
  if (!edgeClient.includes('enforceApiCostLimit')) failures.push('edge_client_missing_enforceApiCostLimit');
  if (!edgeClient.includes('trackApiUsageCost')) failures.push('edge_client_missing_trackApiUsageCost');
}

if (failures.length > 0) {
  console.error('COST/PROFIT LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Cost/Profit lock passed: policy and runtime hooks are present.');
