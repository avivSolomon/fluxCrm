// A tiny limit for this file only (each Jest test file loads its own copy of the app).
process.env.API_RATE_LIMIT = '3';

const request = require('supertest');
const app = require('../../src/app');

describe('general API rate limit', () => {
  test('answers 429 with a JSON message after API_RATE_LIMIT requests per minute', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/api/client/list');
      expect(res.status).toBe(401); // counted by the limiter, then rejected (no token)
    }
    const blocked = await request(app).get('/api/client/list');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false });
  });
});
