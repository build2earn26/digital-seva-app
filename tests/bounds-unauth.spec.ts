import { test, expect } from '@playwright/test';

test.describe('Authentication Bounds (Unauthenticated)', () => {
  test('redirects from /citizen to /login', async ({ page }) => {
    await page.goto('/citizen');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('redirects from /operator to /login', async ({ page }) => {
    await page.goto('/operator');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('redirects from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
