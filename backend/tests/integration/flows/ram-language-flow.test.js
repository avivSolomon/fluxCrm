const request = require('supertest');
const app = require('../../../src/app');
const { seedAdmin } = require('../../helpers');

// Ram - end-to-end scenario (API level, real MongoDB test DB):
// login (default English) -> choose Hebrew -> log out -> log in again ->
// the saved Hebrew preference comes back; invalid choices are rejected.
describe('E2E flow: language preference (Ram)', () => {
  const login = () =>
    request(app).post('/api/login').send({ email: 'admin@admin.com', password: 'admin123' });

  test('preference survives logout and login; bad values are rejected', async () => {
    await seedAdmin();

    const first = await login();
    expect(first.body.result.language).toBe('en_us'); // default
    const token = first.body.result.token;
    const auth = { Authorization: `Bearer ${token}` };

    const save = await request(app)
      .patch('/api/admin/profile/language')
      .set(auth)
      .send({ language: 'he_il' });
    expect(save.status).toBe(200);

    const logout = await request(app).post('/api/logout').set(auth);
    expect(logout.status).toBe(200);

    // the old token no longer works after logout
    const stale = await request(app)
      .patch('/api/admin/profile/language')
      .set(auth)
      .send({ language: 'en_us' });
    expect(stale.status).toBe(401);

    const second = await login();
    expect(second.body.result.language).toBe('he_il');

    const bad = await request(app)
      .patch('/api/admin/profile/language')
      .set({ Authorization: `Bearer ${second.body.result.token}` })
      .send({ language: 'xx' });
    expect(bad.status).toBe(400);
  });
});
