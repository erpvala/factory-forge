# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: marketplace.e2e.spec.ts >> Marketplace Core Flow >> public browse routes and guarded checkout/cart routes
- Location: tests\marketplace.e2e.spec.ts:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Software Marketplace')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Software Marketplace')

```

# Test source

```ts
  1  | // @ts-nocheck
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Marketplace Core Flow', () => {
  5  |   test('public browse routes and guarded checkout/cart routes', async ({ page }) => {
  6  |     await page.goto('/marketplace');
  7  |     await expect(page).toHaveURL(/\/marketplace/);
  8  | 
> 9  |     await expect(page.locator('text=Software Marketplace')).toBeVisible();
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     const productLinks = page.locator('a[href^="/product/"]');
  12 |     const productCount = await productLinks.count();
  13 | 
  14 |     if (productCount > 0) {
  15 |       const href = await productLinks.first().getAttribute('href');
  16 |       if (href) {
  17 |         await page.goto(href);
  18 |         await expect(page).toHaveURL(/\/product\//);
  19 |         await expect(page.getByRole('button', { name: /Continue to Checkout/i })).toBeVisible();
  20 |       }
  21 |     }
  22 | 
  23 |     await page.goto('/cart');
  24 |     await expect(page).toHaveURL(/\/login|\/cart/);
  25 | 
  26 |     await page.goto('/checkout');
  27 |     await expect(page).toHaveURL(/\/login|\/checkout/);
  28 |   });
  29 | 
  30 |   test('catalog action buttons render and are clickable', async ({ page }) => {
  31 |     await page.goto('/marketplace');
  32 |     await expect(page).toHaveURL(/\/marketplace/);
  33 | 
  34 |     const openCart = page.getByRole('button', { name: /Open cart/i });
  35 |     if (await openCart.count()) {
  36 |       await openCart.first().click();
  37 |       await expect(page).toHaveURL(/\/cart|\/login/);
  38 |     }
  39 | 
  40 |     await page.goto('/marketplace');
  41 |     const checkout = page.getByRole('button', { name: /^Checkout$/i });
  42 |     if (await checkout.count()) {
  43 |       await checkout.first().click();
  44 |       await expect(page).toHaveURL(/\/checkout|\/login/);
  45 |     }
  46 |   });
  47 | });
  48 | 
```