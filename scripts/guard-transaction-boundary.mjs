#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED = [
  path.join(ROOT, 'src', 'lib', 'transactions', 'distributedConsistency.ts'),
  path.join(ROOT, 'src', 'lib', 'api', 'edge-client.ts'),
  path.join(ROOT, 'src', 'services', 'flowLockRuntime.ts'),
];

const failures = [];

for (const filePath of REQUIRED) {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${path.relative(ROOT, filePath)}`);
  }
}

if (failures.length === 0) {
  const consistency = fs.readFileSync(REQUIRED[0], 'utf8');
  const edge = fs.readFileSync(REQUIRED[1], 'utf8');

  const requiredConsistencyTokens = [
    'executeDistributedSaga',
    'assertOrderStateTransition',
    'markIdempotencyKeyUsed',
    'step_compensated',
  ];

  for (const token of requiredConsistencyTokens) {
    if (!consistency.includes(token)) {
      failures.push(`distributedConsistency missing token: ${token}`);
    }
  }

  const requiredEdgeTokens = ['x-idempotency-key', 'x-trace-id'];
  for (const token of requiredEdgeTokens) {
    if (!edge.toLowerCase().includes(token)) {
      failures.push(`edge-client missing transport token: ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error('TRANSACTION BOUNDARY GUARD FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Transaction boundary guard passed.');
