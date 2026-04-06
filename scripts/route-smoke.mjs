import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4175';
const tests = [
  '/',
  '/login',
  '/apply/developer',
  '/apply/influencer',
  '/apply/reseller',
  '/apply/franchise',
  '/apply/job',
  '/dashboard/pending',
  '/developer/dashboard',
  '/influencer/dashboard',
  '/reseller/dashboard',
  '/franchise/dashboard',
  '/boss/applications',
  '/404',
  '/definitely-not-real-route',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const out = [];

for (const path of tests) {
  const errs = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 160));
  });

  try {
    const res = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(900);
    const body = ((await page.locator('body').textContent()) || '').trim();
    const ok = !!body && errs.length === 0;
    out.push(`${ok ? 'PASS' : 'CHECK'} ${path} status=${res ? res.status() : 'n/a'} url=${page.url().replace(base, '')} bodyLen=${body.length}${errs[0] ? ` err=${errs[0]}` : ''}`);
  } catch (e) {
    out.push(`FAIL ${path} ${String(e?.message || e).slice(0, 160)}`);
  }
}

console.log(out.join('\n'));
await browser.close();
