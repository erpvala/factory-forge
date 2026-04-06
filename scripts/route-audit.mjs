import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const APP_FILE = path.resolve('src/App.tsx');
const APP_ROUTES_FILE = path.resolve('src/routes/appRoutes.tsx');
const APP_PAGES_ROOT = path.resolve('src/app');
const BASE_URL = process.env.ROUTE_AUDIT_BASE_URL || 'http://localhost:8080';
const BROWSER_CANDIDATES = [
  process.env.ROUTE_AUDIT_BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const APP_ROLE_BY_SECTION = {
  developer: 'role:developer,super_admin',
  reseller: 'role:reseller,super_admin',
  'reseller-manager': 'role:reseller_manager,super_admin',
};

function extractRoutes(fileText, options = {}) {
  const { source = 'src/App.tsx', pathPrefix = '' } = options;
  const lines = fileText.split(/\r?\n/);
  const routes = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/<Route\s+path="([^"]+)"\s+element=\{(.+)\}\s*\/?\s*>?/);
    if (!match) {
      continue;
    }

    const routePath = `${pathPrefix}${match[1]}`;
    const elementExpr = match[2];

    let access = 'public';
    if (elementExpr.includes('RequireRole')) {
      const roleMatch = elementExpr.match(/allowed=\{\[([^\]]+)\]\}/);
      access = roleMatch ? `role:${roleMatch[1].replace(/\s+/g, '')}` : 'role:restricted';
    } else if (elementExpr.includes('RequireAuth')) {
      access = 'auth';
    }

    const moduleName = routePath === '/' ? 'home' : routePath.replace(/^\//, '').split('/')[0] || 'misc';

    routes.push({
      path: routePath,
      line: i + 1,
      module: moduleName,
      access,
      source,
    });
  }

  return routes;
}

function extractAppIndexRoute() {
  if (!fs.existsSync(APP_ROUTES_FILE)) {
    return [];
  }

  return [
    {
      path: '/app',
      line: 1,
      module: 'app',
      access: 'auth',
      source: 'src/routes/appRoutes.tsx',
    },
  ];
}

function extractAppPageRoutes() {
  if (!fs.existsSync(APP_PAGES_ROOT)) {
    return [];
  }

  const routes = [];
  const sections = fs.readdirSync(APP_PAGES_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const section of sections) {
    const sectionPath = path.join(APP_PAGES_ROOT, section.name);
    const stack = [sectionPath];

    while (stack.length > 0) {
      const current = stack.pop();
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(current, entry.name);

        if (entry.isDirectory()) {
          stack.push(entryPath);
          continue;
        }

        if (entry.name !== 'page.tsx') {
          continue;
        }

        const relativeDir = path.relative(APP_PAGES_ROOT, path.dirname(entryPath)).replace(/\\/g, '/');
        const routePath = `/${relativeDir}`;
        const moduleName = routePath.replace(/^\//, '').split('/')[0] || 'misc';

        routes.push({
          path: routePath,
          line: 1,
          module: moduleName,
          access: APP_ROLE_BY_SECTION[moduleName] || 'auth',
          source: path.relative(process.cwd(), entryPath).replace(/\\/g, '/'),
        });
      }
    }
  }

  return routes;
}

function dedupeRoutes(routes) {
  const seen = new Set();

  return routes.filter((route) => {
    const key = `${route.path}::${route.source}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (defaultError) {
    for (const executablePath of BROWSER_CANDIDATES) {
      if (!fs.existsSync(executablePath)) {
        continue;
      }

      try {
        return await chromium.launch({ headless: true, executablePath });
      } catch {
        // Try the next installed browser path.
      }
    }

    throw defaultError;
  }
}

function isConcretePath(routePath) {
  return !routePath.includes(':') && !routePath.includes('*');
}

function classifyVisit(routePath, finalUrl, pageText) {
  const finalPath = new URL(finalUrl).pathname;
  const text = (pageText || '').toLowerCase();

  if (finalPath === '/404' || text.includes('page not found') || text.includes('404')) {
    return 'dead';
  }

  if (finalPath === '/login' || finalPath === '/access-denied' || finalPath === '/session-expired') {
    return 'guarded';
  }

  return 'valid';
}

async function run() {
  const appText = fs.readFileSync(APP_FILE, 'utf8');
  const appRoutesText = fs.existsSync(APP_ROUTES_FILE) ? fs.readFileSync(APP_ROUTES_FILE, 'utf8') : '';
  const allRoutes = dedupeRoutes([
    ...extractRoutes(appText, { source: 'src/App.tsx' }),
    ...extractRoutes(appRoutesText, { source: 'src/routes/appRoutes.tsx', pathPrefix: '/app/' }),
    ...extractAppIndexRoute(),
    ...extractAppPageRoutes(),
  ]);

  const concrete = allRoutes.filter((r) => isConcretePath(r.path));
  const dynamicOrWildcard = allRoutes.filter((r) => !isConcretePath(r.path));

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const route of concrete) {
    const url = `${BASE_URL}${route.path}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(300);
      const text = await page.textContent('body').catch(() => '');
      const finalUrl = page.url();
      const state = classifyVisit(route.path, finalUrl, text || '');
      results.push({ ...route, state, finalUrl });
    } catch (error) {
      results.push({ ...route, state: 'dead', finalUrl: String(error) });
    }
  }

  await context.close();
  await browser.close();

  const dead = results.filter((r) => r.state === 'dead');
  const guarded = results.filter((r) => r.state === 'guarded');
  const valid = results.filter((r) => r.state === 'valid');

  const out = {
    baseUrl: BASE_URL,
    totals: {
      extracted: allRoutes.length,
      concrete: concrete.length,
      dynamicOrWildcard: dynamicOrWildcard.length,
      valid: valid.length,
      guarded: guarded.length,
      dead: dead.length,
    },
    dead,
    guarded,
    valid,
    skipped: dynamicOrWildcard,
  };

  fs.writeFileSync(path.resolve('ROUTE_AUDIT_RESULTS.json'), JSON.stringify(out, null, 2));

  console.log(`Extracted: ${allRoutes.length}`);
  console.log(`Concrete tested: ${concrete.length}`);
  console.log(`Valid: ${valid.length}`);
  console.log(`Guarded: ${guarded.length}`);
  console.log(`Dead: ${dead.length}`);
  console.log('Report: ROUTE_AUDIT_RESULTS.json');
}

run().catch((error) => {
  console.error('Route audit failed:', error);
  process.exit(1);
});
