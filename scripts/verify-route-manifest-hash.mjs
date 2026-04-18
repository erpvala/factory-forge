#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const TARGET_DIRS = [
  'src/App.tsx',
  'src/routes',
  'src/app',
  'src/pages',
  'src/middleware.ts',
  'route_config.json',
];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);

function walk(absPath, out = []) {
  if (!fs.existsSync(absPath)) return out;
  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    out.push(absPath);
    return out;
  }
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const child = path.join(absPath, entry.name);
    if (entry.isDirectory()) walk(child, out);
    else out.push(child);
  }
  return out;
}

function gatherFiles() {
  const files = [];
  for (const item of TARGET_DIRS) {
    const abs = path.join(ROOT, item);
    files.push(...walk(abs));
  }
  return Array.from(new Set(files))
    .filter((file) => /\.(ts|tsx|js|jsx|json)$/.test(file))
    .sort();
}

function computeHash(files) {
  const hasher = crypto.createHash('sha256');
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    let content = fs.readFileSync(file, 'utf8');
    if (rel === 'route_config.json' || rel === 'public/route_config.json') {
      const parsed = JSON.parse(content);
      parsed.routes_hash = '__ROUTES_HASH__';
      content = `${JSON.stringify(parsed, null, 2)}\n`;
    }
    hasher.update(`FILE:${rel}\n`);
    hasher.update(content);
    hasher.update('\n');
  }
  return hasher.digest('hex');
}

function readTrim(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8').trim();
}

const files = gatherFiles();
const currentHash = computeHash(files);
const rootHash = readTrim(path.join(ROOT, 'route-manifest.hash'));
const publicHash = readTrim(path.join(ROOT, 'public', 'route-manifest.hash'));
const routeConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'route_config.json'), 'utf8'));
const expectedConfigHash = routeConfig.routes_hash;

const failures = [];
if (!rootHash) failures.push('missing route-manifest.hash');
if (!publicHash) failures.push('missing public/route-manifest.hash');
if (rootHash && rootHash !== currentHash) failures.push(`root route-manifest.hash mismatch expected=${currentHash} actual=${rootHash}`);
if (publicHash && publicHash !== currentHash) failures.push(`public route-manifest.hash mismatch expected=${currentHash} actual=${publicHash}`);
if (expectedConfigHash !== currentHash) failures.push(`route_config.json routes_hash mismatch expected=${currentHash} actual=${expectedConfigHash}`);

if (failures.length > 0) {
  console.error('ROUTE MANIFEST HASH CHECK FAILED.');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log(`Route manifest hash check passed: ${currentHash}`);