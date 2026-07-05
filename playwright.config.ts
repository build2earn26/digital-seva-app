import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/citizen.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'e2e-authenticated',
      testMatch: /.*-auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'e2e-unauthenticated',
      testMatch: /.*-unauth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'e2e-limits',
      testMatch: /.*-limits\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
