import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.ROUTE_AUDIT_BASE_URL || 'http://127.0.0.1:4174';
const REPORT_PATH = path.resolve('DASHBOARD_ROUTE_VERIFICATION.json');

const DASHBOARD_ROUTES = [
  '/boss-panel',
  '/ai-ceo',
  '/developer/dashboard',
  '/influencer/dashboard',
  '/reseller/dashboard',
  '/franchise/dashboard',
  '/reseller-manager/dashboard',
  '/influencer-manager',
  '/lead-manager',
  '/marketing-manager',
  '/seo-manager',
  '/sales-support-manager',
  '/finance',
  '/legal',
  '/hr',
  '/task-manager',
  '/product-manager',
  '/demo-manager',
  '/server-manager',
  '/api-ai-manager',
  '/continent-super-admin',
  '/country-dashboard',
  '/security-command',
  '/marketplace-manager/dashboard',
  '/prime',
  '/support',
  '/sales-support',
  '/client-success',
  '/performance',
  '/rnd',
  '/safe-assist',
  '/assist-manager',
  '/promise-tracker',
  '/promise-management',
  '/system-flow',
  '/user/dashboard',
];

function classifyState(finalPath, bodyText) {
  const text = bodyText.toLowerCase();

  if (finalPath === '/404' || text.includes('page not found') || text.includes('404')) {
    return 'dead';
  }

  if (finalPath === '/login' || finalPath === '/access-denied' || finalPath === '/session-expired') {
    return 'guarded';
  }

  return 'valid';
}

async function clickFlowProbe(page) {
  const clickIssues = [];
  const clickable = page.locator('a:visible, button:visible, [role="button"]:visible');
  const count = Math.min(await clickable.count(), 8);

  for (let i = 0; i < count; i++) {
    const target = clickable.nth(i);

    try {
      const currentUrl = page.url();
      await target.click({ timeout: 1200 });
      await page.waitForTimeout(250);

      const nextUrl = page.url();
      const nextPath = new URL(nextUrl).pathname;
      const body = ((await page.textContent('body').catch(() => '')) || '').toLowerCase();

      if (nextPath === '/404' || body.includes('page not found') || body.includes('404')) {
        clickIssues.push({ type: 'click-to-dead-route', from: currentUrl, to: nextUrl });
      }

      if (nextUrl !== currentUrl) {
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(150);
      }
    } catch {
      // Ignore control-level click failures here; route-level failures are tracked separately.
    }
  }

  return clickIssues;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = [];

  for (const route of DASHBOARD_ROUTES) {
    const page = await context.newPage();
    const targetUrl = `${BASE_URL}${route}`;

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(400);

      const finalUrl = page.url();
      const finalPath = new URL(finalUrl).pathname;
      const bodyText = (await page.textContent('body').catch(() => '')) || '';
      const state = classifyState(finalPath, bodyText);

      let clickIssues = [];
      if (state === 'valid') {
        clickIssues = await clickFlowProbe(page);
      }

      results.push({
        route,
        targetUrl,
        finalUrl,
        finalPath,
        state,
        bodyLength: bodyText.trim().length,
        clickIssues,
      });
    } catch (error) {
      results.push({
        route,
        targetUrl,
        state: 'dead',
        finalUrl: String(error?.message || error),
        finalPath: 'error',
        bodyLength: 0,
        clickIssues: [],
      });
    }

    await page.close();
  }

  await context.close();
  await browser.close();

  const dead = results.filter((r) => r.state === 'dead');
  const guarded = results.filter((r) => r.state === 'guarded');
  const valid = results.filter((r) => r.state === 'valid');
  const clickFailures = results.flatMap((r) => r.clickIssues.map((issue) => ({ route: r.route, ...issue })));

  const report = {
    baseUrl: BASE_URL,
    totals: {
      tested: results.length,
      valid: valid.length,
      guarded: guarded.length,
      dead: dead.length,
      clickFailures: clickFailures.length,
    },
    dead,
    guarded,
    valid,
    clickFailures,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`Tested: ${report.totals.tested}`);
  console.log(`Valid: ${report.totals.valid}`);
  console.log(`Guarded: ${report.totals.guarded}`);
  console.log(`Dead: ${report.totals.dead}`);
  console.log(`Click failures: ${report.totals.clickFailures}`);
  console.log(`Report: ${path.basename(REPORT_PATH)}`);
}

run().catch((error) => {
  console.error('Dashboard route verification failed:', error);
  process.exit(1);
});
