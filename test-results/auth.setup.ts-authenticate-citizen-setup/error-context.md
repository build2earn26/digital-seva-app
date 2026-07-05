# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate citizen
- Location: tests\auth.setup.ts:4:6

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/citizen/
Received string:  "http://localhost:3000/signup"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/signup"

```

```yaml
- main:
  - heading "Create Account" [level=2]
  - text: Full Name
  - textbox
  - text: Email
  - textbox
  - text: Password
  - textbox
  - text: Role (Pilot MVP Only)
  - combobox:
    - option "Citizen" [selected]
    - option "Operator"
    - option "Admin"
  - text: email rate limit exceeded
  - button "Sign Up"
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
- alert
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | import { STORAGE_STATE } from '../playwright.config';
  3  | 
  4  | setup('authenticate citizen', async ({ page }) => {
  5  |   const email = 'test_citizen@example.com';
  6  |   const password = 'password123';
  7  | 
  8  |   // Attempt to login first
  9  |   await page.goto('/login');
  10 |   await page.fill('input[name="email"]', email);
  11 |   await page.fill('input[name="password"]', password);
  12 |   await page.click('button[type="submit"]');
  13 | 
  14 |   try {
  15 |     // Check if login succeeded and redirected to dashboard
  16 |     await expect(page).toHaveURL(/.*\/citizen/, { timeout: 3000 });
  17 |   } catch (e) {
  18 |     // If login fails (user likely does not exist yet), fallback to signup
  19 |     console.log("Login failed or user missing. Attempting to sign up test user...");
  20 |     await page.goto('/signup');
  21 |     await page.fill('input[name="fullName"]', 'Test Citizen');
  22 |     await page.fill('input[name="email"]', email);
  23 |     await page.fill('input[name="password"]', password);
  24 |     await page.selectOption('select[name="role"]', 'citizen');
  25 |     await page.click('button[type="submit"]');
  26 |     
  27 |     // Wait for signup to complete
> 28 |     await expect(page).toHaveURL(/.*\/citizen/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  29 |   }
  30 | 
  31 |   // Save the authenticated state
  32 |   await page.context().storageState({ path: STORAGE_STATE });
  33 | });
  34 | 
```