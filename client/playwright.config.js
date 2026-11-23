import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const url = 'http://127.0.0.1:5193';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: url, trace: 'retain-on-failure', channel: process.env.PLAYWRIGHT_CHANNEL },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5193 --strictPort',
    url,
    env: { VITE_API_URL: '' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
});
