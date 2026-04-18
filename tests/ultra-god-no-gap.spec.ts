import { test, expect, Page } from '@playwright/test';

async function expectRedirectToLogin(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/);
}

test.describe('Ultra God No Gap Lock', () => {
  test('entry and legacy admin routes are locked to login/control-panel flow', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    await expectRedirectToLogin(page, '/admin');
    await expectRedirectToLogin(page, '/super-admin');
    await expectRedirectToLogin(page, '/user/dashboard');
    await expectRedirectToLogin(page, '/random-unlisted-route');
  });

  test('control-panel requires authenticated context', async ({ page }) => {
    await page.goto('/control-panel', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login|\/control-panel/);
  });
});
