// Browser E2E for FluxCRM. Expects the demo to be running (frontend 3000, backend 8888).
// Locally it uses the installed Microsoft Edge; in CI it uses Playwright's Chromium.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    channel: process.env.CI ? undefined : 'msedge',
    headless: true,
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  },
});
