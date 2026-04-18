#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, 'src', 'app');
const PAGES_ROOT = path.join(ROOT, 'src', 'pages');
const APP_FILE = path.join(ROOT, 'src', 'App.tsx');
const APP_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'appRoutes.tsx');

const VIOLATION_LIMIT = 400;
const ALLOWED_ROUTE_PREFIXES = ['/login', '/control-panel', '/api'];
const BANNED_SEGMENTS = ['user', 'admin', 'super-admin', 'old'];
const BANNED_EXACT = ['/user/dashboard', '/dashboard'];
const BANNED_PATH_DIR_PATTERNS = [
  '/src/app/user/',
  '/src/app/admin/',
  '/src/app/super-admin/',
  '/src/pages/user/',
  '/src/pages/admin/',
  '/src/pages/super-admin/',
  '/src/pages/dashboard/',
];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', 'test-results']);
const BASELINE_PATH = path.join(ROOT, 'scripts', 'route-allowlist-baseline.json');
const STRICT_MODE = process.env.STRICT_ROUTE_ENFORCEMENT === 'true';
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
    out.push(abs);
  }
  return out;
}

function pushViolation(violations, message) {
  violations.push(message);
  if (violations.length >= VIOLATION_LIMIT) {
    throw new Error('Violation limit reached');
  }
}

function normalizeRoute(routePath) {
  if (!routePath || routePath === '/') return '/control-panel';
  const cleaned = routePath.startsWith('/') ? routePath : `/${routePath}`;
  if (cleaned === '/login') return '/login';
  if (cleaned.startsWith('/api')) return cleaned;
  return `/control-panel${cleaned}`.replace(/\/+/g, '/');
}

function isAllowed(routePath) {
  return ALLOWED_ROUTE_PREFIXES.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`));
}

function hasBannedSegment(routePath) {
  const normalized = routePath.toLowerCase();
  if (BANNED_EXACT.some((entry) => normalized === entry || normalized.startsWith(`${entry}/`))) {
    return true;
  }
  return BANNED_SEGMENTS.some((segment) => {
    const token = `/${segment}`;
    return normalized.includes(token);
  });
}

function extractReactRouterPaths(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  const regex = /<Route\s+path="([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    routes.push(match[1]);
  }
  return routes;
}

function extractNextAppRoutes() {
  if (!fs.existsSync(APP_ROOT)) return [];
  const pageFiles = walk(APP_ROOT).filter((file) => file.endsWith(`${path.sep}page.tsx`) || file.endsWith(`${path.sep}page.ts`));
  return pageFiles.map((file) => {
    const relativeDir = path.relative(APP_ROOT, path.dirname(file)).replace(/\\/g, '/');
    if (!relativeDir || relativeDir === '.') return '/control-panel';
    if (relativeDir === 'login') return '/login';
    return `/control-panel/${relativeDir}`.replace(/\/+/g, '/');
  });
}

function extractPagesRoutes() {
  if (!fs.existsSync(PAGES_ROOT)) return [];
  const pageFiles = walk(PAGES_ROOT).filter((file) => /\.(tsx?|jsx?)$/.test(file));
  return pageFiles.map((file) => {
    const relative = path.relative(PAGES_ROOT, file).replace(/\\/g, '/');
    const noExt = relative.replace(/\.(tsx?|jsx?)$/, '');
    if (noExt === 'index') return '/control-panel';
    if (noExt === '404') return '/login';
    return `/control-panel/${noExt}`.replace(/\/+/g, '/');
  });
}

function unique(values) {
  return Array.from(new Set(values));
}

function main() {
  const violations = [];

  const allFiles = walk(ROOT);
  for (const file of allFiles) {
    const normalized = `/${path.relative(ROOT, file).replace(/\\/g, '/')}`.toLowerCase();
    if (BANNED_PATH_DIR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      pushViolation(violations, `BANNED_ROUTE_FILESYSTEM: ${normalized}`);
    }
  }

  const routes = unique([
    ...extractReactRouterPaths(APP_FILE).map(normalizeRoute),
    ...extractReactRouterPaths(APP_ROUTES_FILE).map(normalizeRoute),
    ...extractNextAppRoutes(),
    ...extractPagesRoutes(),
  ]);

  for (const route of routes) {
    if (!isAllowed(route)) {
      pushViolation(violations, `NON_ALLOWLIST_ROUTE: ${route}`);
    }
    if (hasBannedSegment(route)) {
      pushViolation(violations, `BANNED_SEGMENT_ROUTE: ${route}`);
    }
  }

  const current = Array.from(new Set(violations)).sort();

  if (WRITE_BASELINE) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify({ violations: current }, null, 2));
    console.log(`Route allowlist baseline updated: ${path.relative(ROOT, BASELINE_PATH)}`);
    return;
  }

  if (STRICT_MODE) {
    if (current.length > 0) {
      console.error('CONTROL PANEL ROUTE ENFORCEMENT FAILED (STRICT MODE).');
      for (const entry of current) {
        console.error(` - ${entry}`);
      }
      process.exit(1);
    }
    console.log(`Route enforcement passed in strict mode. Checked ${routes.length} routes.`);
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify({ violations: current }, null, 2));
    console.warn(`Baseline initialized at ${path.relative(ROOT, BASELINE_PATH)}.`);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const allowed = new Set(Array.isArray(baseline.violations) ? baseline.violations : []);
  const regressions = current.filter((entry) => !allowed.has(entry));

  if (regressions.length > 0) {
    console.error('CONTROL PANEL ROUTE ENFORCEMENT FAILED (REGRESSION).');
    for (const entry of regressions) {
      console.error(` - ${entry}`);
    }
    process.exit(1);
  }

  const debtCount = current.length;
  const debtMessage = debtCount > 0 ? ` Existing baseline violations: ${debtCount}.` : '';
  console.log(`Route enforcement passed with no new regressions. Checked ${routes.length} routes.${debtMessage}`);
}

try {
  main();
} catch (error) {
  console.error('Route allowlist enforcement crashed:', error.message || error);
  process.exit(1);
}