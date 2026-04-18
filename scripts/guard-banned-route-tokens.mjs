#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INCLUDE_DIRS = ['src', 'api', 'scripts'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

const BASELINE_PATH = path.join(ROOT, 'scripts', 'banned-route-tokens-baseline.json');
const STRICT_MODE = process.env.STRICT_BANNED_TOKENS === 'true';
const WRITE_BASELINE = process.argv.includes('--write-baseline');
const MAX_FINDINGS = 3000;

const PATTERNS = [
  { label: 'user/dashboard', regex: /user\/dashboard/gi },
  { label: 'super-admin', regex: /super-admin/gi },
  { label: 'admin', regex: /\badmin\b/gi },
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
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/').toLowerCase();
    if (rel.endsWith('baseline.json') || rel.endsWith('baseline.md')) {
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(abs);
    }
  }
  return out;
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function findInFile(filePath) {
  const findings = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');

  for (const { label, regex } of PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      findings.push(`${rel}:${label}`);
      if (findings.length >= MAX_FINDINGS) {
        return findings;
      }
    }
  }

  return findings;
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    return Array.isArray(parsed.findings) ? parsed.findings : [];
  } catch {
    return [];
  }
}

function writeBaseline(findings) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings }, null, 2));
}

const files = INCLUDE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const currentFindings = Array.from(new Set(files.flatMap(findInFile))).sort();

if (WRITE_BASELINE) {
  writeBaseline(currentFindings);
  console.log(`Banned token baseline updated: ${path.relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (STRICT_MODE) {
  if (currentFindings.length > 0) {
    console.error('BANNED TOKEN GUARD FAILED (STRICT MODE).');
    for (const finding of currentFindings.slice(0, 300)) {
      console.error(` - ${finding}`);
    }
    process.exit(1);
  }

  console.log(`Banned token guard passed in strict mode across ${files.length} files.`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  writeBaseline(currentFindings);
  console.warn(`Baseline initialized at ${path.relative(ROOT, BASELINE_PATH)}.`);
}

const baseline = new Set(readBaseline());
const regressions = currentFindings.filter((finding) => !baseline.has(finding));

if (regressions.length > 0) {
  console.error('BANNED TOKEN GUARD FAILED (REGRESSION).');
  for (const finding of regressions.slice(0, 300)) {
    console.error(` - ${finding}`);
  }
  process.exit(1);
}

const debtMessage = currentFindings.length > 0 ? ` Existing baseline findings: ${currentFindings.length}.` : '';
console.log(`Banned token guard passed with no new regressions across ${files.length} files.${debtMessage}`);
