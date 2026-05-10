const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const Alert = require('../../src/models/Alert');
const axios = require('axios');

// Mockear axios para evitar llamadas reales a Nominatim
jest.mock('axios');

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
  const User = require('../../src/models/User');
  await Alert.deleteMany({});
  await User.deleteMany({});
  jest.clearAllMocks();
});

const generateToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Alert Endpoints', () => {
  describe('POST /api/alerts', () => {
    it('1. Crea una alerta autenticada correctamente', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      axios.get.mockResolvedValue({
        data: [{ lat: '39.084', lon: '-77.152' }]
      });

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Robo', address: '123 Main St' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Alerta creada correctamente');
      expect(response.body.alert.location.coordinates).toEqual([-77.152, 39.084]);
    });

    it('2. Rechaza body sin description', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ address: '123 Main St' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('description y address son obligatorios');
    });

    it('3. Rechaza body sin address', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Robo' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('description y address son obligatorios');
    });

    it('4. Devuelve 400 si la geocodificación no devuelve coordenadas', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      // Simular respuesta vacía de Nominatim
      axios.get.mockResolvedValue({ data: [] });

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Robo', address: 'Nowhere St' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se pudo obtener coordenadas para esta dirección');
    });

    it('5. Devuelve 401 sin token', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({ description: 'Robo', address: '123 Main St' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/alerts', () => {
    it('1. Devuelve lista de alertas autenticado', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      await Alert.create({
        description: 'Alerta 1',
        address: 'Addr 1',
        createdBy: new mongoose.Types.ObjectId(),
        location: { type: 'Point', coordinates: [0, 0] }
      });

      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });

    it('2. Filtra por status', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      await Alert.create({
        description: 'Alerta 1', address: 'Addr 1', createdBy: new mongoose.Types.ObjectId(), status: 'pending', location: { type: 'Point', coordinates: [0, 0] }
      });
      await Alert.create({
        description: 'Alerta 2', address: 'Addr 2', createdBy: new mongoose.Types.ObjectId(), status: 'attended', location: { type: 'Point', coordinates: [0, 0] }
      });

      const response = await request(app)
        .get('/api/alerts?status=attended')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.alerts[0].status).toBe('attended');
    });

    it('3. Rechaza status inválido', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      const response = await request(app)
        .get('/api/alerts?status=fakeStatus')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Status inválido. Valores permitidos: pending, attended, deleted');
    });

    it('4. Filtra por from y to', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());

      const a1 = await Alert.create({ description: 'A1', address: 'Addr', createdBy: new mongoose.Types.ObjectId().toString(), location: { type: 'Point', coordinates: [0, 0] } });
      const a2 = await Alert.create({ description: 'A2', address: 'Addr', createdBy: new mongoose.Types.ObjectId().toString(), location: { type: 'Point', coordinates: [0, 0] } });

      // Force change createdAt manually via MongoDB driver
      await Alert.collection.updateOne({ _id: a1._id }, { $set: { createdAt: new Date('2023-10-10') } });
      await Alert.collection.updateOne({ _id: a2._id }, { $set: { createdAt: new Date('2023-11-10') } });

      const response = await request(app)
        .get('/api/alerts?from=2023-10-01&to=2023-10-31')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.alerts[0].description).toBe('A1');
    });

    it('5. Añade confirmedByMe y discardedByMe en la respuesta', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);

      await Alert.create({
        description: 'A1', address: 'Addr', createdBy: new mongoose.Types.ObjectId(), location: { type: 'Point', coordinates: [0, 0] },
        confirmations: [userId]
      });

      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.alerts[0].confirmedByMe).toBe(true);
      expect(response.body.alerts[0].discardedByMe).toBe(false);
    });

    it('6. Devuelve 401 sin token', async () => {
      const response = await request(app).get('/api/alerts');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('1. Devuelve una alerta existente con stats y userInteraction', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = generateToken(userId);

      const alert = await Alert.create({
        description: 'A1',
        address: 'Addr',
        createdBy: new mongoose.Types.ObjectId().toString(),
        location: { type: 'Point', coordinates: [0, 0] },
        discards: [userId]
      });

      const response = await request(app)
        .get(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.alert._id).toBe(alert._id.toString());
      expect(response.body.stats.confirmations).toBe(0);
      expect(response.body.stats.discards).toBe(1);
      expect(response.body.userInteraction.confirmedByUser).toBe(false);
      expect(response.body.userInteraction.discardedByUser).toBe(true);
    });

    it('2. Devuelve 404 si la alerta no existe', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('3. Devuelve 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/alerts/${fakeId}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/alerts/:id', () => {
    it('1. Actualiza status con token admin', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .patch(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });

      expect(response.status).toBe(200);
      expect(response.body.alert.status).toBe('attended');
    });

    it('2. Actualiza status con token police', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'police');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .patch(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });

      expect(response.status).toBe(200);
      expect(response.body.alert.status).toBe('attended');
    });

    it('3. Rechaza status inválido', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .patch(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('4. Devuelve 404 si la alerta no existe', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });

      expect(response.status).toBe(404);
    });

    it('5. Devuelve 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).patch(`/api/alerts/${fakeId}`).send({ status: 'attended' });
      expect(response.status).toBe(401);
    });

    it('6. Devuelve 403 con token anonymous', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'anonymous');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .patch(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'attended' });

      expect(response.status).toBe(403);
    });
  });

  describe('Confirmaciones', () => {
    it('1. POST /api/alerts/:id/confirmations confirma una alerta', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.confirmations).toBe(1);
    });

    it('2. No permite confirmar una alerta deleted', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), status: 'deleted' });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('3. No permite confirmar dos veces', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), confirmations: [userId] });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Ya has confirmado esta alerta');
    });

    it('4. Si estaba descartada, elimina el descarte al confirmar', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), discards: [userId] });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.confirmations).toBe(1);
      expect(response.body.discards).toBe(0);
    });

    it('5. DELETE /api/alerts/:id/confirmations elimina la confirmación', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), confirmations: [userId] });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.confirmations).toBe(0);
    });

    it('6. DELETE /api/alerts/:id/confirmations devuelve 400 si no había confirmado', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}/confirmations`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Descartes', () => {
    it('1. POST /api/alerts/:id/discards descarta una alerta', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.discards).toBe(1);
    });

    it('2. No permite descartar una alerta deleted', async () => {
      const token = generateToken(new mongoose.Types.ObjectId());
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), status: 'deleted' });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('3. No permite descartar dos veces', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), discards: [userId] });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('4. Si estaba confirmada, elimina la confirmación al descartar', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), confirmations: [userId] });

      const response = await request(app)
        .post(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.discards).toBe(1);
      expect(response.body.confirmations).toBe(0);
    });

    it('5. DELETE /api/alerts/:id/discards elimina el descarte', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), discards: [userId] });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.discards).toBe(0);
    });

    it('6. DELETE /api/alerts/:id/discards devuelve 400 si no había descartado', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = generateToken(userId);
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}/discards`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('1. Elimina definitivamente una alerta con status deleted y token admin', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), status: 'deleted' });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const inDb = await Alert.findById(alert._id);
      expect(inDb).toBeNull();
    });

    it('2. Devuelve 400 si la alerta no está en status deleted', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), status: 'pending' });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('3. Devuelve 404 si la alerta no existe', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'admin');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('4. Devuelve 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/alerts/${fakeId}`);
      expect(response.status).toBe(401);
    });

    it('5. Devuelve 403 con token anonymous', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'anonymous');
      const alert = await Alert.create({ description: 'A', address: 'A', createdBy: new mongoose.Types.ObjectId(), status: 'deleted' });

      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
