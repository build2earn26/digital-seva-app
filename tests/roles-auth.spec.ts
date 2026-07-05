import { test, expect } from '@playwright/test';

test.describe('Role Bounds (Authenticated as Citizen)', () => {
  test('citizen cannot access operator or admin routes', async ({ page }) => {
    // Browser is authenticated as a citizen via auth.setup.ts
    
    // Try to access operator queue
    await page.goto('/operator');
    await expect(page).not.toHaveURL(/.*\/operator/);
    await expect(page).toHaveURL(/.*\/citizen/);

    // Try to access admin panel
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/.*\/admin/);
    await expect(page).toHaveURL(/.*\/citizen/);
  });
});
