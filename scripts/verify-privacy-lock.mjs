#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);
const TARGET_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const BASELINE_PATH = path.join(ROOT, 'scripts', 'privacy-lock-baseline.json');
const WRITE_BASELINE = process.argv.includes('--write-baseline');

const FORBIDDEN_LOG_PATTERNS = [
  /console\.(log|error|warn)\([^\n]*password/gi,
  /console\.(log|error|warn)\([^\n]*token/gi,
  /console\.(log|error|warn)\([^\n]*api[_-]?key/gi,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (TARGET_EXT.has(path.extname(entry.name).toLowerCase())) out.push(abs);
  }
  return out;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const findings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  for (const pattern of FORBIDDEN_LOG_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push(`${rel}:forbidden_sensitive_log_pattern`);
    }
  }
}

const privacyUtilPath = path.join(ROOT, 'src', 'lib', 'security', 'dataPrivacy.ts');
if (!fs.existsSync(privacyUtilPath)) {
  findings.push('missing privacy utility: src/lib/security/dataPrivacy.ts');
}

const current = Array.from(new Set(findings)).sort();

if (WRITE_BASELINE) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings: current }, null, 2));
  console.log(`Privacy lock baseline updated: ${path.relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings: current }, null, 2));
  console.warn(`Baseline initialized at ${path.relative(ROOT, BASELINE_PATH)}.`);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const known = new Set(Array.isArray(baseline.findings) ? baseline.findings : []);
const regressions = current.filter((item) => !known.has(item));

if (regressions.length > 0) {
  console.error('PRIVACY LOCK CHECK FAILED (REGRESSION).');
  for (const item of regressions.slice(0, 300)) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

const debtMessage = current.length > 0 ? ` Existing baseline findings: ${current.length}.` : '';
console.log(`Privacy lock check passed with no new regressions.${debtMessage}`);
