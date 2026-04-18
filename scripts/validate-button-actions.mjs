#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'button-actions-baseline.json');
const STRICT_MODE = process.env.STRICT_BUTTON_ENFORCEMENT === 'true';
const WRITE_BASELINE = process.argv.includes('--write-baseline');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);
const TARGET_EXT = new Set(['.tsx', '.jsx']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (TARGET_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(abs);
    }
  }
  return out;
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function hasActionProps(openTag) {
  return /(onClick|onSubmit|type\s*=\s*"submit"|href\s*=|to\s*=|asChild|disabled)/.test(openTag);
}

function validateFile(filePath) {
  const findings = [];
  const text = fs.readFileSync(filePath, 'utf8');
  const regexes = [
    { kind: 'button', rx: /<button\b[^>]*>/g },
    { kind: 'Button', rx: /<Button\b[^>]*>/g },
  ];

  for (const { kind, rx } of regexes) {
    let match;
    while ((match = rx.exec(text)) !== null) {
      const openTag = match[0];
      if (!hasActionProps(openTag)) {
        findings.push({
          file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
          line: lineNumber(text, match.index),
          kind,
          snippet: openTag,
        });
      }
    }
  }

  return findings;
}

const files = walk(SRC);
const findings = files.flatMap(validateFile).map((entry) => `${entry.file}:${entry.line}:${entry.kind}`);
const current = Array.from(new Set(findings)).sort();

if (WRITE_BASELINE) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings: current }, null, 2));
  console.log(`Button action baseline updated: ${path.relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (STRICT_MODE) {
  if (current.length > 0) {
    console.error('BUTTON ACTION VALIDATION FAILED (STRICT MODE).');
    for (const item of current.slice(0, 300)) {
      console.error(` - ${item}`);
    }
    process.exit(1);
  }
  console.log(`Button action validation passed in strict mode across ${files.length} files.`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings: current }, null, 2));
  console.warn(`Baseline initialized at ${path.relative(ROOT, BASELINE_PATH)}.`);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const allowed = new Set(Array.isArray(baseline.findings) ? baseline.findings : []);
const regressions = current.filter((entry) => !allowed.has(entry));

if (regressions.length > 0) {
  console.error('BUTTON ACTION VALIDATION FAILED (REGRESSION).');
  for (const item of regressions.slice(0, 300)) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

const debtCount = current.length;
const debtMessage = debtCount > 0 ? ` Existing baseline findings: ${debtCount}.` : '';
console.log(`Button action validation passed with no new regressions across ${files.length} files.${debtMessage}`);