import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'e2e/html-report' }],    
    ['junit', { outputFile: 'e2e/test-results/junit.xml' }], 
    ['list'],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://easy-drive-test.vercel.app',
    serviceWorkers: 'block',
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
