const request = require('supertest');
const app = require('../../src/app');
const { loginAsAdmin } = require('../helpers');

// Hardening checks: NoSQL operator injection on /filter and the CORS allow-list.
describe('security hardening', () => {
  let token;
  beforeEach(async () => {
    token = await loginAsAdmin(app);
  });

  test('/filter rejects an operator object instead of running it', async () => {
    const res = await request(app)
      .get('/api/client/filter?filter=name&equal[$ne]=x')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('/filter still works with a plain value', async () => {
    const res = await request(app)
      .get('/api/client/filter?filter=name&equal=Nobody')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('CORS allows the FluxCRM frontend origin', async () => {
    const res = await request(app).get('/api/client/list').set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('CORS does not allow a foreign origin', async () => {
    const res = await request(app).get('/api/client/list').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
