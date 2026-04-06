#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src', 'public'];
const REMOVE_DIR_NAMES = new Set(['__trash__', '__old__', 'tmp', 'temp-ui']);
const REMOVE_FILE_PATTERNS = [
  /\.bak$/i,
  /\.old$/i,
  /\.tmp$/i,
  /\.temp$/i,
  /-copy\./i,
  / copy\./i,
];

function rmSafe(absPath) {
  if (!fs.existsSync(absPath)) return;
  const rel = path.relative(ROOT, absPath).replace(/\\/g, '/');
  fs.rmSync(absPath, { recursive: true, force: true });
  console.log(`removed: ${rel}`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (REMOVE_DIR_NAMES.has(entry.name.toLowerCase())) {
        rmSafe(abs);
        continue;
      }
      walk(abs);
      continue;
    }
    if (REMOVE_FILE_PATTERNS.some((r) => r.test(entry.name))) {
      rmSafe(abs);
    }
  }
}

for (const d of TARGET_DIRS) {
  walk(path.join(ROOT, d));
}

console.log('Auto-clean completed.');
