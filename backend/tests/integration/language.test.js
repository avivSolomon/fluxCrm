const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { loginAsAdmin } = require('../helpers');

// Ram's end-to-end flow (backend part): saved language preference.
describe('PATCH /api/admin/profile/language', () => {
  let token;

  beforeEach(async () => {
    token = await loginAsAdmin(app);
  });

  const patch = (body, auth = token) => {
    const r = request(app).patch('/api/admin/profile/language').send(body);
    return auth ? r.set('Authorization', `Bearer ${auth}`) : r;
  };

  test('saves a supported language and returns it', async () => {
    const res = await patch({ language: 'he_il' });
    expect(res.status).toBe(200);
    expect(res.body.result.language).toBe('he_il');

    const admin = await mongoose.model('Admin').findOne({ email: 'admin@admin.com' });
    expect(admin.language).toBe('he_il');
  });

  test('the saved language comes back on the next login', async () => {
    await patch({ language: 'he_il' });
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });
    expect(res.body.result.language).toBe('he_il');
  });

  test('rejects an unsupported language with 400 and does not change it', async () => {
    const res = await patch({ language: 'fr_fr' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const admin = await mongoose.model('Admin').findOne({ email: 'admin@admin.com' });
    expect(admin.language).toBe('en_us');
  });

  test('rejects a missing language', async () => {
    const res = await patch({});
    expect(res.status).toBe(400);
  });

  test('requires authentication', async () => {
    const res = await patch({ language: 'he_il' }, null);
    expect(res.status).toBe(401);
  });
});
