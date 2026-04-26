const request = require('supertest');
const app = require('../src/app');

describe('App Basic Tests', () => {
  it('should return 200 and API funcionando for GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('API funcionando');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');
    expect(response.status).toBe(404);
  });
});
