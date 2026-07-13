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
