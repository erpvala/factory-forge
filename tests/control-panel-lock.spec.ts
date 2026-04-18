import { test, expect } from '@playwright/test';

function isLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/control-panel/login';
}

async function expectLockedPathRedirect(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);

  try {
    await page.waitForURL(/\/(login|control-panel\/login)$/, { timeout: 5000 });
  } catch {
    // Keep the final assertion explicit for clearer failure output.
  }

  const finalPath = new URL(page.url()).pathname;
  expect(isLoginPath(finalPath)).toBeTruthy();
}

test.describe('Control Panel Permanent Lock', () => {
  test('only login/control-panel entry flow is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);

    await expectLockedPathRedirect(page, '/random123');
    await expectLockedPathRedirect(page, '/admin');
    await expectLockedPathRedirect(page, '/user/dashboard');

    await page.goto('/control-panel');
    const controlPanelPath = new URL(page.url()).pathname;
    expect(controlPanelPath === '/control-panel' || isLoginPath(controlPanelPath)).toBeTruthy();
  });
});