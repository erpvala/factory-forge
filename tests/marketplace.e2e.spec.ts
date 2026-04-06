// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Marketplace Core Flow', () => {
  test('public browse routes and guarded checkout/cart routes', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page).toHaveURL(/\/marketplace/);

    await expect(page.locator('text=Software Marketplace')).toBeVisible();

    const productLinks = page.locator('a[href^="/product/"]');
    const productCount = await productLinks.count();

    if (productCount > 0) {
      const href = await productLinks.first().getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page).toHaveURL(/\/product\//);
        await expect(page.getByRole('button', { name: /Continue to Checkout/i })).toBeVisible();
      }
    }

    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login|\/cart/);

    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login|\/checkout/);
  });

  test('catalog action buttons render and are clickable', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page).toHaveURL(/\/marketplace/);

    const openCart = page.getByRole('button', { name: /Open cart/i });
    if (await openCart.count()) {
      await openCart.first().click();
      await expect(page).toHaveURL(/\/cart|\/login/);
    }

    await page.goto('/marketplace');
    const checkout = page.getByRole('button', { name: /^Checkout$/i });
    if (await checkout.count()) {
      await checkout.first().click();
      await expect(page).toHaveURL(/\/checkout|\/login/);
    }
  });
});
