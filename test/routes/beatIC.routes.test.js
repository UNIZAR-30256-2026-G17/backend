const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

const BeatICDay = require('../../src/models/BeatICDay');
const BeatICMonth = require('../../src/models/BeatICMonth');
const BeatICYear = require('../../src/models/BeatICYear');
const BeatICThreeYear = require('../../src/models/BeatICThreeYear');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  process.env.FRONTEND_URL = 'http://localhost:8081';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await BeatICDay.deleteMany({});
  await BeatICMonth.deleteMany({});
  await BeatICYear.deleteMany({});
  await BeatICThreeYear.deleteMany({});
});

const generateToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('BeatIC Endpoints', () => {
  describe('GET /api/ic_beat', () => {
    let token;

    beforeEach(() => {
      token = generateToken(new mongoose.Types.ObjectId());
    });

    it('1. devuelve datos con time=day', async () => {
      await BeatICDay.create({
        id: 1,
        beat: 111,
        ic_crimenes_violentos: 5,
        ic_crimenes_propiedad: 10,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_beat?time=day')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.beatsICs[0].beat).toBe('111');
    });

    it('2. usa day por defecto si no se envía time', async () => {
      await BeatICDay.create({
        id: 2,
        beat: 222,
        ic_crimenes_violentos: 5,
        ic_crimenes_propiedad: 10,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_beat')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.beatsICs[0].beat).toBe('222');
    });

    it('3. devuelve datos con time=month', async () => {
      await BeatICMonth.create({
        id: 3,
        beat: 333,
        ic_crimenes_violentos: 15,
        ic_crimenes_propiedad: 20,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_beat?time=month')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.beatsICs[0].beat).toBe('333');
    });

    it('4. devuelve datos con time=year', async () => {
      await BeatICYear.create({
        id: 4,
        beat: 444,
        ic_crimenes_violentos: 25,
        ic_crimenes_propiedad: 30,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_beat?time=year')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.beatsICs[0].beat).toBe('444');
    });

    it('5. devuelve datos con time=three_year', async () => {
      await BeatICThreeYear.create({
        id: 5,
        beat: 555,
        ic_crimenes_violentos: 35,
        ic_crimenes_propiedad: 40,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_beat?time=three_year')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.beatsICs[0].beat).toBe('555');
    });

    it('6. devuelve 401 sin token', async () => {
      const response = await request(app).get('/api/ic_beat');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No autorizado: token no proporcionado');
    });
  });
});
