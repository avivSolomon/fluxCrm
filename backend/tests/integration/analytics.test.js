const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { loginAsAdmin } = require('../helpers');

describe('GET /api/invoice/analytics (original feature)', () => {
  let token;

  beforeEach(async () => {
    token = await loginAsAdmin(app);

    const admin = await mongoose.model('Admin').findOne({ email: 'admin@admin.com' });
    const client = await new (mongoose.model('Client'))({
      name: 'Chart Co',
      createdBy: admin._id,
    }).save();

    await new (mongoose.model('Invoice'))({
      createdBy: admin._id,
      number: 1,
      year: 2026,
      date: new Date(),
      expiredDate: new Date(),
      client: client._id,
      items: [{ itemName: 'Consulting', quantity: 1, price: 100, total: 100 }],
      subTotal: 100,
      total: 100,
      currency: 'USD',
      status: 'sent',
      paymentStatus: 'paid',
    }).save();
  });

  test('returns a 12-month revenue series and aggregated breakdowns', async () => {
    const res = await request(app)
      .get('/api/invoice/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { monthlyRevenue, statusBreakdown, topClients } = res.body.result;

    // always exactly 12 months, even when most are empty
    expect(monthlyRevenue).toHaveLength(12);

    // the invoice we seeded is counted
    expect(statusBreakdown.some((s) => s.status === 'sent' && s.count === 1)).toBe(true);
    expect(topClients[0].name).toBe('Chart Co');
    expect(topClients[0].total).toBe(100);
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/invoice/analytics');
    expect(res.status).toBe(401);
  });
});

// Menahem's end-to-end flow (backend part): date-range filter, validation, CSV export.
describe('analytics range filter and CSV export', () => {
  let token;
  beforeEach(async () => {
    token = await loginAsAdmin(app);
    const admin = await mongoose.model('Admin').findOne({ email: 'admin@admin.com' });
    const client = await new (mongoose.model('Client'))({ name: 'Range Co', createdBy: admin._id }).save();
    const mk = (n, date, total) =>
      new (mongoose.model('Invoice'))({
        createdBy: admin._id, number: n, year: 2026, date, expiredDate: date,
        client: client._id, items: [{ itemName: 'x', quantity: 1, price: total, total }],
        subTotal: total, total, currency: 'USD', status: 'sent', paymentStatus: 'unpaid',
      }).save();
    await mk(1, new Date('2026-01-15'), 100);
    await mk(2, new Date('2026-03-10'), 300);
  });
  const get = (url) => request(app).get(url).set('Authorization', `Bearer ${token}`);

  test('from/to limits the series to that window', async () => {
    const res = await get('/api/invoice/analytics?from=2026-01-01&to=2026-03-31');
    expect(res.status).toBe(200);
    const { monthlyRevenue, topClients } = res.body.result;
    expect(monthlyRevenue).toHaveLength(3);
    expect(monthlyRevenue.map((m) => m.total)).toEqual([100, 0, 300]);
    expect(monthlyRevenue.map((m) => m.period)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(topClients[0].total).toBe(400);
  });

  test('a narrower window excludes invoices outside it', async () => {
    const res = await get('/api/invoice/analytics?from=2026-03-01&to=2026-03-31');
    expect(res.body.result.monthlyRevenue).toHaveLength(1);
    expect(res.body.result.topClients[0].total).toBe(300);
  });

  test.each([
    ['not-a-date', '?from=banana'],
    ['to before from', '?from=2026-05-01&to=2026-01-01'],
    ['range over 36 months', '?from=2020-01-01&to=2026-01-01'],
    ['unknown parameter', '?foo=1'],
  ])('rejects invalid input: %s', async (_name, qs) => {
    const res = await get('/api/invoice/analytics' + qs);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('CSV export returns a downloadable file with the data', async () => {
    const res = await get('/api/invoice/analytics/export?from=2026-01-01&to=2026-03-31');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.text).toContain('"monthly_revenue","Jan 2026","100","1"');
    expect(res.text).toContain('"top_client","Range Co","400","2"');
  });

  test('CSV export requires authentication and validates input', async () => {
    expect((await request(app).get('/api/invoice/analytics/export')).status).toBe(401);
    expect((await get('/api/invoice/analytics/export?from=banana')).status).toBe(400);
  });
});
