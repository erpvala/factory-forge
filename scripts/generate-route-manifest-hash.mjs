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
    if (entry.isDirectory()) {
      walk(child, out);
      continue;
    }
    out.push(child);
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

function updateRouteConfig(routeHash) {
  const configPaths = [
    path.join(ROOT, 'route_config.json'),
    path.join(ROOT, 'public', 'route_config.json'),
  ];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    parsed.routes_hash = routeHash;
    fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  }
}

function writeArtifacts(routeHash) {
  const rootPath = path.join(ROOT, 'route-manifest.hash');
  const publicPath = path.join(ROOT, 'public', 'route-manifest.hash');
  fs.writeFileSync(rootPath, `${routeHash}\n`, 'utf8');
  fs.writeFileSync(publicPath, `${routeHash}\n`, 'utf8');
}

const files = gatherFiles();
const hash = computeHash(files);
updateRouteConfig(hash);
writeArtifacts(hash);

console.log(`Route manifest hash generated: ${hash}`);
console.log(`Files included: ${files.length}`);