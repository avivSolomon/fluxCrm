// Ram's end-to-end flow in a real browser:
// language preference (screen -> PATCH -> MongoDB -> next login -> RTL) and the analytics screen + CSV.
const { test: base, expect, request } = require('@playwright/test');

// A fresh browser per test: headless Edge on Windows does not survive several tests in one browser.
const test = base.extend({
  page: async ({ playwright, baseURL }, use) => {
    const browser = await playwright.chromium.launch({ channel: process.env.CI ? undefined : 'msedge', headless: true });
    const context = await browser.newContext({ baseURL, acceptDownloads: true, viewport: { width: 1280, height: 800 } });
    await use(await context.newPage());
    await browser.close();
  },
});

const API = process.env.API_URL || 'http://localhost:8888/api';
const CREDS = { email: 'admin@admin.com', password: 'admin123' };

async function apiLogin() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/login`, { data: CREDS });
  const body = await res.json();
  return { ctx, token: body.result.token, language: body.result.language };
}

async function setServerLanguage(language) {
  const { ctx, token } = await apiLogin();
  await ctx.patch(`${API}/admin/profile/language`, { data: { language }, headers: { Authorization: `Bearer ${token}` } });
  await ctx.dispose();
}

async function uiLogin(page) {
  await page.goto('/login');
  await page.locator('.login-form-button').click();
  await expect(page.locator('.ant-layout-sider, .mobile-sidebar-btn').first()).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async () => {
  await setServerLanguage('en_us'); // start every test in English
});
test.afterAll(async () => {
  await setServerLanguage('en_us'); // leave the demo in English
});

test('language preference is saved on the server and comes back after login', async ({ page }) => {
  await uiLogin(page);
  await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');

  // 1. screen: choose Hebrew in the header switcher
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByText('עברית').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl', { timeout: 15_000 });

  // 2-4. API + database: the server now returns he_il on login
  const { ctx, language } = await apiLogin();
  await ctx.dispose();
  expect(language).toBe('he_il');

  // 5-6. next login on a "new device" (local preference cleared) comes back in Hebrew
  await page.goto('/logout');
  await page.waitForURL('**/login', { timeout: 15_000 });
  await page.evaluate(() => localStorage.removeItem('fluxcrm_language'));
  await uiLogin(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl', { timeout: 15_000 });
});

test('phone width: menu button and no horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await uiLogin(page);
  await page.goto('/invoice');
  await expect(page.locator('.mobile-sidebar-btn')).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('analytics screen shows totals, charts and requests the CSV export', async ({ page }) => {
  await uiLogin(page);
  await page.goto('/analytics');
  await expect(page.getByText('Revenue by month')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('canvas').first()).toBeVisible();

  // Headless Edge closes when a blob file is actually saved, so record the save the screen asks for
  // (a link to a blob: URL with a file name) instead of letting the browser write the file.
  await page.evaluate(() => {
    window.__saved = [];
    HTMLAnchorElement.prototype.click = function () {
      if (this.href.startsWith('blob:')) window.__saved.push(this.download || 'unnamed');
    };
  });

  // The button calls GET /analytics/export with the JWT; check the response the screen receives.
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/analytics/export')),
    page.getByRole('button', { name: /Export CSV/ }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/csv');
  await expect.poll(() => page.evaluate(() => window.__saved)).toEqual(['fluxcrm-analytics.csv']);
});
