#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const gitHooksDir = path.join(ROOT, '.githooks');
const preCommit = path.join(gitHooksDir, 'pre-commit');

if (!fs.existsSync(gitHooksDir)) {
  fs.mkdirSync(gitHooksDir, { recursive: true });
}

if (!fs.existsSync(preCommit)) {
  fs.writeFileSync(
    preCommit,
    '#!/usr/bin/env sh\nnode scripts/run-permanent-guard.mjs\n',
    'utf8',
  );
}

try {
  fs.chmodSync(preCommit, 0o755);
} catch {
  // On Windows this can fail harmlessly.
}

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
} catch {
  // Git may be unavailable in some CI containers.
}

console.log('Git hook files ensured at .githooks/pre-commit');
console.log('Configured git hooks path: .githooks');