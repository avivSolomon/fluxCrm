const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { loginAsAdmin } = require('../helpers');

// Invoice creation stores the complete document in one write, and only then
// advances the invoice counter.
describe('POST /api/invoice/create', () => {
  let auth;
  let clientId;

  beforeEach(async () => {
    const token = await loginAsAdmin(app);
    auth = { Authorization: `Bearer ${token}` };
    await new (mongoose.model('Setting'))({
      settingCategory: 'finance_settings',
      settingKey: 'last_invoice_number',
      settingValue: 7,
    }).save();
    const client = await request(app)
      .post('/api/client/create')
      .set(auth)
      .send({ name: 'Atomic Co', email: 'atomic@example.com' });
    clientId = client.body.result._id;
  });

  const body = (extra = {}) => ({
    client: clientId,
    number: 8,
    year: 2026,
    status: 'draft',
    date: '2026-05-01',
    expiredDate: '2026-05-31',
    taxRate: 0,
    items: [{ itemName: 'Service', quantity: 1, price: 100, total: 0 }],
    ...extra,
  });

  const counter = async () =>
    (await mongoose.model('Setting').findOne({ settingKey: 'last_invoice_number' })).settingValue;

  test('saves the invoice with its PDF name in one write and advances the counter', async () => {
    const res = await request(app).post('/api/invoice/create').set(auth).send(body());
    expect(res.status).toBe(200);
    const { _id, pdf, total, client } = res.body.result;
    expect(pdf).toBe(`invoice-${_id}.pdf`);
    expect(total).toBe(100);
    expect(client.name).toBe('Atomic Co'); // response is still populated
    expect(await counter()).toBe(8);
  });

  test('a rejected invoice is not stored and does not consume a number', async () => {
    const res = await request(app)
      .post('/api/invoice/create')
      .set(auth)
      .send(body({ status: undefined })); // a required field is missing
    expect(res.status).toBe(400);
    expect(await mongoose.model('Invoice').countDocuments()).toBe(0);
    expect(await counter()).toBe(7);
  });
});
