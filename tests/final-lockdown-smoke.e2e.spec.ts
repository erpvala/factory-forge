import { test, expect } from '@playwright/test';

const DEEP_LINKS = [
  '/control-panel',
  '/dashboard',
  '/app',
  '/marketplace',
  '/reseller/dashboard',
  '/developer/dashboard',
];

const LEGACY_REDIRECTS = ['/super-admin', '/admin', '/old-control'];

const LEGACY_TOKENS = [
  'super-admin-system',
  'role-switch?role=',
  'super-admin-wireframe',
  '/wireframe/',
  'roleswitchdashboard',
  'continentsuperadminview',
  'bossownerdashboard',
  'legacy rolesidebar',
  'old-ui',
  'old_ui',
];

async function gotoWithRetry(page: import('@playwright/test').Page, route: string) {
  try {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.waitForTimeout(750);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
  }
}

async function assertNoLegacyTokens(page: import('@playwright/test').Page) {
  const snapshot = await page.evaluate(() => {
    const bodyText = (document.body?.innerText || '').toLowerCase();
    const attrBlob = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .slice(0, 4000)
      .map((el) => [
        el.id || '',
        el.className || '',
        el.getAttribute('data-testid') || '',
      ].join(' '))
      .join(' ')
      .toLowerCase();

    return `${bodyText}\n${attrBlob}`;
  });

  for (const token of LEGACY_TOKENS) {
    expect(snapshot, `Legacy token should not appear in DOM/text: ${token}`).not.toContain(token);
  }
}

test.describe('Final Lockdown Smoke', () => {
  test('hard refresh cycle on key routes has no legacy UI traces', async ({ page }) => {
    for (const route of DEEP_LINKS) {
      await gotoWithRetry(page, route);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await assertNoLegacyTokens(page);
    }
  });

  test('deep links resolve to modern routes only', async ({ page }) => {
    for (const route of DEEP_LINKS) {
      await gotoWithRetry(page, route);
      await expect(page).toHaveURL(/\/control-panel|\/dashboard|\/app|\/marketplace|\/reseller\/dashboard|\/developer\/dashboard|\/login|\/404/);
      await assertNoLegacyTokens(page);
    }
  });

  test('legacy admin URLs redirect into unified control panel', async ({ page }) => {
    for (const route of LEGACY_REDIRECTS) {
      await gotoWithRetry(page, route);
      await expect(page).toHaveURL(/\/control-panel|\/login|\/404/);
      await assertNoLegacyTokens(page);
    }
  });

  test('wrong URL redirects to 404 and not legacy UI', async ({ page }) => {
    await gotoWithRetry(page, '/__final-lock-test-not-found__');
    await expect(page).toHaveURL(/\/404/);
    await assertNoLegacyTokens(page);
  });

  test('deploy version endpoint is available', async ({ page }) => {
    const res = await page.request.get('/deploy-id.json', {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });

    expect(res.ok()).toBeTruthy();
    const bodyText = await res.text();
    expect(bodyText.trim().startsWith('{')).toBeTruthy();
    const body = JSON.parse(bodyText);
    const id = body?.deploymentId || body?.deployId;
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(8);
  });

  test('session resume baseline: protected route remains consistent after refresh', async ({ page }) => {
    await gotoWithRetry(page, '/control-panel');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/control-panel|\/login|\/404/);
    await assertNoLegacyTokens(page);
  });
});
