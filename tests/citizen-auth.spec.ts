import { test, expect } from '@playwright/test';

test.describe('Citizen Flow (Authenticated)', () => {
  test('can view dashboard and browse services', async ({ page }) => {
    // The browser context is already authenticated via auth.setup.ts
    await page.goto('/citizen');
    await expect(page.locator('h1')).toContainText('Welcome,');

    // Navigate to services list
    await page.click('text=Apply for a Service');
    await expect(page).toHaveURL(/.*\/citizen\/services/);
    
    // Verify services header
    await expect(page.locator('h1')).toContainText('Available Services');
  });
});
