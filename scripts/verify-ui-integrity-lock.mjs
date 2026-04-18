#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src/components', 'src/pages', 'src/app'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);
const TARGET_EXT = new Set(['.tsx', '.ts', '.jsx', '.js']);
const BASELINE_PATH = path.join(ROOT, 'scripts', 'ui-integrity-baseline.json');
const WRITE_BASELINE = process.argv.includes('--write-baseline');

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
    if (rel.includes('baseline.json')) continue;
    if (TARGET_EXT.has(path.extname(entry.name).toLowerCase())) out.push(abs);
  }
  return out;
}

function hasApiCall(content) {
  return /(callEdgeRoute|callModuleApi|supabase\s*\.|fetch\()/m.test(content);
}

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  if (/#[0-9a-fA-F]{3,8}/.test(content) && !rel.endsWith('index.css')) {
    findings.push(`${rel}:hardcoded_hex_color`);
  }

  if (/style=\{\{/.test(content)) {
    findings.push(`${rel}:inline_style_detected`);
  }

  if (hasApiCall(content)) {
    if (!/(loading|isLoading|Loader|Skeleton|spinner)/.test(content)) {
      findings.push(`${rel}:missing_loading_state`);
    }
    if (!/(error|Error|toast\.error|Alert)/.test(content)) {
      findings.push(`${rel}:missing_error_state`);
    }
    if (!/(empty|no data|No\s+data|isEmpty|length\s*===\s*0)/i.test(content)) {
      findings.push(`${rel}:missing_empty_state_hint`);
    }
  }

  if (/<button\b/.test(content) && !/(hover:|active:|focus:)/.test(content)) {
    findings.push(`${rel}:button_missing_interaction_feedback`);
  }

  return findings;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const current = Array.from(new Set(files.flatMap(scanFile))).sort();

if (WRITE_BASELINE) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ findings: current }, null, 2));
  console.log(`UI integrity baseline updated: ${path.relative(ROOT, BASELINE_PATH)}`);
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
  console.error('UI INTEGRITY LOCK FAILED (REGRESSION).');
  for (const item of regressions.slice(0, 300)) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

const debtMessage = current.length > 0 ? ` Existing baseline findings: ${current.length}.` : '';
console.log(`UI integrity lock passed with no new regressions across ${files.length} files.${debtMessage}`);
