#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const checks = [
  {
    file: path.join(ROOT, 'src', 'lib', 'api', 'edge-client.ts'),
    mustContain: ['assertNewOnlyModeRuntime', 'assertNoLegacyReference'],
  },
  {
    file: path.join(ROOT, 'src', 'lib', 'database.ts'),
    mustContain: ['assertNewOnlyModeServer', 'assertNoLegacyReference'],
  },
  {
    file: path.join(ROOT, 'src', 'lib', 'security', 'systemMode.ts'),
    mustContain: ['isLegacyReference', 'assertNewOnlyModeServer', 'assertNewOnlyModeRuntime'],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`missing file: ${path.relative(ROOT, check.file)}`);
    continue;
  }

  const content = fs.readFileSync(check.file, 'utf8');
  for (const token of check.mustContain) {
    if (!content.includes(token)) {
      failures.push(`${path.relative(ROOT, check.file)} missing token: ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error('NEW_ONLY RUNTIME GUARD FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('NEW_ONLY runtime guard passed.');
