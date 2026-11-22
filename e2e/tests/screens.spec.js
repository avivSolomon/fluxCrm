// Every main screen in a real browser: it opens, shows its data and has no errors.
// Plus one write action through the UI (a new customer) and the period-comparison card.
const { test: base, expect, request } = require('@playwright/test');

const API = process.env.API_URL || 'http://localhost:8888/api';

// A fresh browser per test: headless Edge on Windows does not survive several tests in one browser.
const test = base.extend({
  page: async ({ playwright, baseURL }, use) => {
    const browser = await playwright.chromium.launch({ channel: process.env.CI ? undefined : 'msedge', headless: true });
    const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    await use(page);
    await browser.close();
  },
});

async function uiLogin(page) {
  await page.goto('/login');
  await page.locator('.login-form-button').click();
  await expect(page.locator('.ant-layout-sider, .mobile-sidebar-btn').first()).toBeVisible({ timeout: 20_000 });
}

// The demo data (ensureDemo / seed) has customers, invoices and payments.
const LIST_SCREENS = [
  { name: 'customers', path: '/customer' },
  { name: 'invoices', path: '/invoice' },
  { name: 'payments', path: '/payment' },
];

test('list screens open with data, and a row opens its details', async ({ page }) => {
  await uiLogin(page);
  for (const s of LIST_SCREENS) {
    await page.goto(s.path);
    const rows = page.locator('.ant-table-tbody tr.ant-table-row');
    await expect(rows.first(), `${s.name} list has rows`).toBeVisible({ timeout: 20_000 });
  }

  // invoice details: open the first invoice from the list
  await page.goto('/invoice');
  await page.locator('.ant-table-tbody tr.ant-table-row').first().locator('.ant-dropdown-trigger, .anticon-ellipsis').first().click();
  await page.getByRole('menuitem', { name: /Show/i }).click();
  await expect(page).toHaveURL(/\/invoice\/read\//, { timeout: 15_000 });
  await expect(page.getByText(/Sub Total/i).first()).toBeVisible({ timeout: 15_000 });

  expect(page.errors, 'no JavaScript errors on the page').toEqual([]);
});

test('dashboard, settings and profile screens open', async ({ page }) => {
  await uiLogin(page);
  for (const path of ['/', '/settings', '/profile']) {
    await page.goto(path);
    await expect(page.locator('.whiteBox, .ant-card, .ant-tabs').first()).toBeVisible({ timeout: 20_000 });
  }
  expect(page.errors).toEqual([]);
});

test('a new customer added through the form appears in the list', async ({ page }) => {
  const name = `E2E Customer ${Date.now()}`;
  await uiLogin(page);
  await page.goto('/customer');
  await page.getByRole('button', { name: /Add New Client/i }).click();
  // the page keeps a hidden edit form too, so act on the visible (create) form only
  const form = page.locator('form:visible').filter({ has: page.locator('#name') }).first();
  await form.locator('#name').fill(name);
  await form.locator('#email').fill(`e2e${Date.now()}@example.com`);
  await form.getByRole('button', { name: /Submit/i }).click();
  await expect(page.locator('.ant-table-tbody').getByText(name)).toBeVisible({ timeout: 15_000 });
  expect(page.errors).toEqual([]);

  // clean up through the API, so the demo data stays as it was
  const ctx = await request.newContext();
  const login = await (await ctx.post(`${API}/login`, { data: { email: 'admin@admin.com', password: 'admin123' } })).json();
  const headers = { Authorization: `Bearer ${login.result.token}` };
  const found = await (await ctx.get(`${API}/client/search?q=${encodeURIComponent(name)}&fields=name`, { headers })).json();
  for (const c of found.result || []) await ctx.delete(`${API}/client/delete/${c._id}`, { headers });
  await ctx.dispose();
});

test('analytics shows the comparison with the previous period', async ({ page }) => {
  await uiLogin(page);
  await page.goto('/analytics');
  await expect(page.getByText('Previous period', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('change')).toBeVisible(); // percent, or 'no earlier data'
  expect(page.errors).toEqual([]);
});
