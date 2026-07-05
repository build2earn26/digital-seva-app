import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

setup('authenticate citizen', async ({ page }) => {
  const email = 'test_citizen@example.com';
  const password = 'password123';

  // Attempt to login first
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  try {
    // Check if login succeeded and redirected to dashboard
    await expect(page).toHaveURL(/.*\/citizen/, { timeout: 3000 });
  } catch (e) {
    // If login fails (user likely does not exist yet), fallback to signup
    console.log("Login failed or user missing. Attempting to sign up test user...");
    await page.goto('/signup');
    await page.fill('input[name="fullName"]', 'Test Citizen');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'citizen');
    await page.click('button[type="submit"]');
    
    // Wait for signup to complete
    await expect(page).toHaveURL(/.*\/citizen/);
  }

  // Save the authenticated state
  await page.context().storageState({ path: STORAGE_STATE });
});
