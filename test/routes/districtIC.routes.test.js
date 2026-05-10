const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

const DistrictICDay = require('../../src/models/DistrictICDay');
const DistrictICMonth = require('../../src/models/DistrictICMonth');
const DistrictICYear = require('../../src/models/DistrictICYear');
const DistrictICThreeYear = require('../../src/models/DistrictICThreeYear');

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
  await DistrictICDay.deleteMany({});
  await DistrictICMonth.deleteMany({});
  await DistrictICYear.deleteMany({});
  await DistrictICThreeYear.deleteMany({});
});

const generateToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('DistrictIC Endpoints', () => {
  describe('GET /api/ic_district', () => {
    let token;

    beforeEach(() => {
      token = generateToken(new mongoose.Types.ObjectId());
    });

    it('1. devuelve datos con time=day', async () => {
      await DistrictICDay.create({
        id: 1,
        district: 'D1',
        ic_crimenes_violentos: 5,
        ic_crimenes_propiedad: 10,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_district?time=day')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.districtsICs[0].district).toBe('D1');
    });

    it('2. usa day por defecto si no se envía time', async () => {
      await DistrictICDay.create({
        id: 2,
        district: 'D2',
        ic_crimenes_violentos: 5,
        ic_crimenes_propiedad: 10,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_district')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.districtsICs[0].district).toBe('D2');
    });

    it('3. devuelve datos con time=month', async () => {
      await DistrictICMonth.create({
        id: 3,
        district: 'D3',
        ic_crimenes_violentos: 15,
        ic_crimenes_propiedad: 20,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_district?time=month')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.districtsICs[0].district).toBe('D3');
    });

    it('4. devuelve datos con time=year', async () => {
      await DistrictICYear.create({
        id: 4,
        district: 'D4',
        ic_crimenes_violentos: 25,
        ic_crimenes_propiedad: 30,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_district?time=year')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.districtsICs[0].district).toBe('D4');
    });

    it('5. devuelve datos con time=three_year', async () => {
      await DistrictICThreeYear.create({
        id: 5,
        district: 'D5',
        ic_crimenes_violentos: 35,
        ic_crimenes_propiedad: 40,
        fecha: new Date()
      });

      const response = await request(app)
        .get('/api/ic_district?time=three_year')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.districtsICs[0].district).toBe('D5');
    });

    it('6. devuelve 401 sin token', async () => {
      const response = await request(app).get('/api/ic_district');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No autorizado: token no proporcionado');
    });
  });
});
