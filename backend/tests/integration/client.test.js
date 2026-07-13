const request = require('supertest');
const app = require('../../src/app');
const { loginAsAdmin } = require('../helpers');

describe('Client API (CRUD, authenticated)', () => {
  let token;

  beforeEach(async () => {
    token = await loginAsAdmin(app);
  });

  test('creates a client and finds it in the list', async () => {
    const create = await request(app)
      .post('/api/client/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Corp', country: 'IL', email: 'acme@example.com' });

    expect(create.status).toBe(200);
    expect(create.body.success).toBe(true);
    expect(create.body.result.name).toBe('Acme Corp');

    const list = await request(app)
      .get('/api/client/list')
      .set('Authorization', `Bearer ${token}`);

    expect(list.body.success).toBe(true);
    const names = list.body.result.map((c) => c.name);
    expect(names).toContain('Acme Corp');
  });

  test('rejects requests without an auth token', async () => {
    const res = await request(app).get('/api/client/list');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
