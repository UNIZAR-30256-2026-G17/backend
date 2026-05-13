const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const Crime = require('../../src/models/Crime');

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
  await Crime.deleteMany({});
});

const generateToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const createDummyCrime = (overrides = {}) => {
  return {
    incident_id: '12345',
    case_number: 'CASE1',
    start_date: '2023-10-01T12:00:00',
    nibrs_code: '09A',
    victims: 1,
    crimename1: 'Crime Against Person',
    crimename2: 'Murder',
    district: 'ROCKVILLE',
    city: 'ROCKVILLE',
    zip_code: '20850',
    agency: 'MCPD',
    beat: '1A',
    address_number: '100',
    address_street: 'MAIN ST',
    street_type: 'AVE',
    latitude: 39.084,
    longitude: -77.152,
    status: 'available',
    ...overrides
  };
};

describe('Crime Endpoints', () => {
  describe('GET /api/crimes', () => {
    it('1. Devuelve delitos con paginación por defecto', async () => {
      await Crime.create(createDummyCrime());

      const response = await request(app).get('/api/crimes');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });

    it('2. Devuelve total, offset, limit, count y crimes', async () => {
      await Crime.create(createDummyCrime());

      const response = await request(app).get('/api/crimes');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('crimes');
    });

    it('3. Filtra por crimename1 válido', async () => {
      await Crime.create(createDummyCrime({ crimename1: 'Crime Against Property' }));
      await Crime.create(createDummyCrime({ crimename1: 'Crime Against Person' }));

      const response = await request(app).get('/api/crimes?crimename1=Delito contra la propiedad');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.crimes[0].crimename1).toBe('Crime Against Property');
    });

    it('4. Rechaza crimename1 inválido', async () => {
      const response = await request(app).get('/api/crimes?crimename1=FakeType');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('crimename1 inválido');
    });

    it('5. Filtra por district válido', async () => {
      await Crime.create(createDummyCrime({ district: 'BETHESDA' }));
      await Crime.create(createDummyCrime({ district: 'ROCKVILLE' }));

      const response = await request(app).get('/api/crimes?district=Bethesda');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.crimes[0].district).toBe('BETHESDA');
    });

    it('6. Rechaza district inválido', async () => {
      const response = await request(app).get('/api/crimes?district=FakeDistrict');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('district inválido');
    });

    it('7. Filtra por beat válido', async () => {
      await Crime.create(createDummyCrime({ beat: '1A' }));
      await Crime.create(createDummyCrime({ beat: '2B' }));

      const response = await request(app).get('/api/crimes?beat=A');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.crimes[0].beat).toBe('1A');
    });

    it('8. Rechaza beat inválido', async () => {
      const response = await request(app).get('/api/crimes?beat=Z');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('beat inválido');
    });

    it('9. Filtra por from y to', async () => {
      await Crime.create(createDummyCrime({ start_date: '2023-10-01T12:00:00' }));
      await Crime.create(createDummyCrime({ start_date: '2023-11-01T12:00:00' }));

      const response = await request(app).get('/api/crimes?from=2023-10-01&to=2023-10-31');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.crimes[0].start_date).toBe('2023-10-01T12:00:00');
    });

    it('10. Ordena por victims asc y desc', async () => {
      await Crime.create(createDummyCrime({ victims: 1 }));
      await Crime.create(createDummyCrime({ victims: 5 }));

      const responseAsc = await request(app).get('/api/crimes?sort=victims&order=asc');
      expect(responseAsc.body.crimes[0].victims).toBe(1);

      const responseDesc = await request(app).get('/api/crimes?sort=victims&order=desc');
      expect(responseDesc.body.crimes[0].victims).toBe(5);
    });

    it('11. Rechaza sort inválido', async () => {
      const response = await request(app).get('/api/crimes?sort=fakeSort');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('sort inválido');
    });

    it('12. Rechaza order inválido', async () => {
      const response = await request(app).get('/api/crimes?sort=victims&order=fakeOrder');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('order inválido');
    });
  });

  describe('GET /api/crimes/byCrimename1', () => {
    it('1. Devuelve agrupación por crimename1 con num_victims y percentage', async () => {
      await Crime.create(createDummyCrime({ crimename1: 'Crime Against Person', victims: 1, start_date: '2023-10-15T12:00' }));
      await Crime.create(createDummyCrime({ crimename1: 'Crime Against Property', victims: 3, start_date: '2023-10-15T12:00' }));

      const response = await request(app).get('/api/crimes/byCrimename1?from=2023-10-01&to=2023-10-31');
      expect(response.status).toBe(200);

      const property = response.body.results.find(r => r.crimename1 === 'Crime Against Property');
      expect(property.num_victims).toBe(3);
      expect(property.percentage).toBe(75); // 3 of 4 total
    });

    it('2. Devuelve siempre los tres tipos generales, aunque alguno tenga num_victims 0', async () => {
      const response = await request(app).get('/api/crimes/byCrimename1?from=2023-10-01&to=2023-10-31');
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(3);

      const types = response.body.results.map(r => r.crimename1);
      expect(types).toContain('Crime Against Person');
      expect(types).toContain('Crime Against Society');
      expect(types).toContain('Crime Against Property');

      response.body.results.forEach((item) => {
        expect(item.num_victims).toBe(0);
        expect(item.percentage).toBe(0);
      });
    });

    it('3. Rechaza si falta from o to', async () => {
      const response = await request(app).get('/api/crimes/byCrimename1?from=2023-10-01');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Los parámetros from y to son obligatorios');
    });

    it('4. Rechaza formato de fecha inválido', async () => {
      const response = await request(app).get('/api/crimes/byCrimename1?from=2023/10/01&to=2023-10-31');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Las fechas deben tener el formato YYYY-MM-DD');
    });

    it('5. Rechaza si from es posterior a to', async () => {
      const response = await request(app).get('/api/crimes/byCrimename1?from=2023-10-31&to=2023-10-01');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('El parámetro from no puede ser posterior a to');
    });

    it('6. Rechaza fechas futuras', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const year = futureDate.getFullYear();

      const response = await request(app).get(`/api/crimes/byCrimename1?from=2023-10-01&to=${year}-10-01`);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se permiten fechas futuras');
    });
  });

  describe('GET /api/crimes/byDistrict', () => {
    it('1. Devuelve agrupación por district', async () => {
      const today = new Date().toISOString().split('T')[0];
      await Crime.create(createDummyCrime({ district: 'BETHESDA', start_date: `${today}T12:00` }));

      const response = await request(app).get(`/api/crimes/byDistrict?from=${today}&to=${today}`);
      expect(response.status).toBe(200);

      const bethesda = response.body.results.find(r => r.district === 'BETHESDA');
      expect(bethesda.num_crimes).toBe(1);
    });

    it('2. Devuelve siempre los distritos esperados, aunque alguno tenga num_crimes 0', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app).get(`/api/crimes/byDistrict?from=${today}&to=${today}`);
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(7);

      const districts = response.body.results.map(r => r.district);
      expect(districts).toContain('BETHESDA');
      expect(districts).toContain('ROCKVILLE');
    });

    it('3. Devuelve from, to, total_crimes y results', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app).get(`/api/crimes/byDistrict?from=${today}&to=${today}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('from');
      expect(response.body).toHaveProperty('to');
      expect(response.body).toHaveProperty('total_crimes');
      expect(response.body).toHaveProperty('results');
    });

    it('4. Rechaza si falta from o to', async () => {
      const response = await request(app).get('/api/crimes/byDistrict?from=2023-10-01');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Los parámetros from y to son obligatorios');
    });
  });

  describe('GET /api/crimes/byHour', () => {
    it('1. Devuelve agrupación por hora', async () => {
      const today = new Date().toISOString().split('T')[0];
      const start_date = `${today}T14:30:00`;
      await Crime.create(createDummyCrime({ start_date }));

      const response = await request(app).get(`/api/crimes/byHour?from=${today}&to=${today}`);
      expect(response.status).toBe(200);

      const hour14 = response.body.results.find(r => r.hour === '14:00');
      expect(hour14.num_crimes).toBe(1);
    });

    it('2. Devuelve siempre las 24 horas', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app).get(`/api/crimes/byHour?from=${today}&to=${today}`);
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(24);
    });

    it('3. Devuelve 0 en horas sin delitos', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app).get(`/api/crimes/byHour?from=${today}&to=${today}`);
      const hour00 = response.body.results.find(r => r.hour === '00:00');
      expect(hour00.num_crimes).toBe(0);
    });

    it('4. Devuelve from, to, total_crimes y results', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app).get(`/api/crimes/byHour?from=${today}&to=${today}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('from');
      expect(response.body).toHaveProperty('to');
      expect(response.body).toHaveProperty('total_crimes');
      expect(response.body).toHaveProperty('results');
    });

    it('5. Rechaza si falta from o to', async () => {
      const response = await request(app).get('/api/crimes/byHour?from=2023-10-01');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Los parámetros from y to son obligatorios');
    });
  });

  describe('PATCH /api/crimes/:id', () => {
    it('1. Actualiza status con token admin', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .patch(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'deleted' });

      expect(response.status).toBe(200);
      expect(response.body.crime.status).toBe('deleted');
    });

    it('2. Actualiza status con token police', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'police');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .patch(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'deleted' });

      expect(response.status).toBe(200);
      expect(response.body.crime.status).toBe('deleted');
    });

    it('3. Rechaza status inválido', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .patch(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'fake_status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Status inválido. Valores permitidos: available, deleted');
    });

    it('4. Devuelve 404 si el delito no existe', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/crimes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'deleted' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Delito no encontrado');
    });

    it('5. Devuelve 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/crimes/${fakeId}`)
        .send({ status: 'deleted' });

      expect(response.status).toBe(401);
    });

    it('6. Devuelve 403 con token sin rol permitido', async () => {
      // Token con rol autenticado pero no autorizado para esta operación
      const token = generateToken(new mongoose.Types.ObjectId(), 'anonymous');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .patch(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'deleted' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/crimes/:id', () => {
    it('1. Elimina un delito con token admin', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .delete(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Delito eliminado definitivamente');

      const crimeInDb = await Crime.findById(crime._id);
      expect(crimeInDb).toBeNull();
    });

    it('2. Elimina un delito con token police', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'police');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .delete(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const crimeInDb = await Crime.findById(crime._id);
      expect(crimeInDb).toBeNull();
    });

    it('3. Devuelve 404 si el delito no existe', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/crimes/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('4. Devuelve 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/crimes/${fakeId}`);

      expect(response.status).toBe(401);
    });

    it('5. Devuelve 403 con token sin rol permitido', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'anonymous');
      const crime = await Crime.create(createDummyCrime());

      const response = await request(app)
        .delete(`/api/crimes/${crime._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
