import { createLovableConfig } from "lovable-agent-playwright-config/config";

export default createLovableConfig({
  testDir: './tests',
  timeout: 90000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
