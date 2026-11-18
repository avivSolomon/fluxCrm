const request = require('supertest');
const app = require('../../../src/app');
const { loginAsAdmin } = require('../../helpers');

// Menahem - end-to-end scenario (API level, real MongoDB test DB):
// login -> create a client -> create invoices through the API -> the analytics
// endpoint reflects them -> range filter narrows them -> CSV export contains them.
describe('E2E flow: analytics & reports (Menahem)', () => {
  test('invoices created through the API show up in analytics, filter and CSV', async () => {
    const token = await loginAsAdmin(app);
    const auth = { Authorization: `Bearer ${token}` };

    // 1) create a client
    const clientRes = await request(app)
      .post('/api/client/create')
      .set(auth)
      .send({ name: 'Flow Client', email: 'flow@example.com' });
    expect(clientRes.status).toBe(200);
    const clientId = clientRes.body.result._id;

    // 2) create two invoices (Jan and Mar) - totals are computed by the server
    const mk = (number, date, price) =>
      request(app)
        .post('/api/invoice/create')
        .set(auth)
        .send({
          client: clientId,
          number,
          year: 2026,
          status: 'sent',
          date,
          expiredDate: date,
          taxRate: 0,
          items: [{ itemName: 'Service', quantity: 2, price, total: 0 }],
        });
    expect((await mk(1, '2026-01-10', 50)).status).toBe(200); // total 100
    expect((await mk(2, '2026-03-10', 150)).status).toBe(200); // total 300

    // 3) analytics over the whole window
    const all = await request(app)
      .get('/api/invoice/analytics?from=2026-01-01&to=2026-03-31')
      .set(auth);
    expect(all.status).toBe(200);
    expect(all.body.result.monthlyRevenue.map((m) => m.total)).toEqual([100, 0, 300]);
    expect(all.body.result.topClients[0]).toMatchObject({ name: 'Flow Client', total: 400 });

    // 4) narrowing the range excludes the January invoice
    const march = await request(app)
      .get('/api/invoice/analytics?from=2026-03-01&to=2026-03-31')
      .set(auth);
    expect(march.body.result.topClients[0].total).toBe(300);

    // 5) CSV export carries the same numbers
    const csv = await request(app)
      .get('/api/invoice/analytics/export?from=2026-01-01&to=2026-03-31')
      .set(auth);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('"top_client","Flow Client","400","2"');

    // 6) invalid input is rejected, not silently accepted
    const bad = await request(app).get('/api/invoice/analytics?from=banana').set(auth);
    expect(bad.status).toBe(400);
  });
});
