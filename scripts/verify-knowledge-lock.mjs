#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const requiredDocs = [
  'docs/SYSTEM_MASTER_MAP.md',
  'docs/FLOW_DOCUMENTATION.md',
  'docs/API_DOCUMENTATION_LOCK.md',
  'docs/DB_SCHEMA_DOC.md',
  'docs/RUNBOOKS.md',
  'docs/ACCESS_GUIDE.md',
  'docs/CHANGELOG.md',
  'docs/TROUBLESHOOT_GUIDE.md',
  'docs/ONBOARDING_GUIDE.md',
];

const failures = [];
for (const rel of requiredDocs) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`missing_doc:${rel}`);
    continue;
  }

  const content = fs.readFileSync(abs, 'utf8').trim();
  if (!content.startsWith('#')) {
    failures.push(`doc_missing_heading:${rel}`);
  }
  if (content.length < 120) {
    failures.push(`doc_too_small:${rel}`);
  }
}

if (failures.length > 0) {
  console.error('KNOWLEDGE LOCK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('Knowledge lock passed: required docs are present and non-trivial.');
