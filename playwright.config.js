import { defineConfig, devices } from '@playwright/test';

const isSmoke = process.env.SMOKE === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  timeout: 30000,
  // In smoke mode, only run files tagged with @smoke in filename
  grep: isSmoke ? /@smoke/ : undefined,
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 5000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm run preview --port 4173' : 'pnpm run dev',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
