const request = require('supertest');
const app = require('../../src/app');
const { seedAdmin } = require('../helpers');

describe('POST /api/login', () => {
  beforeEach(async () => {
    await seedAdmin();
  });

  test('valid credentials return a JWT token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toHaveProperty('token');
    expect(res.body.result.email).toBe('admin@admin.com');
  });

  test('wrong password is rejected', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@admin.com', password: 'wrong-password' });

    expect(res.body.success).toBe(false);
  });

  test('unknown email is rejected', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@nowhere.com', password: 'admin123' });

    expect(res.body.success).toBe(false);
  });
});
