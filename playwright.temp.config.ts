import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4174',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
