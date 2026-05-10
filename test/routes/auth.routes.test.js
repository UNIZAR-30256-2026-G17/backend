const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');

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
  // Limpia la base de datos entre tests
  await User.deleteMany({});
});

describe('Auth Endpoints', () => {
  const adminData = {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  };

  const policeData = {
    email: 'police@test.com',
    password: 'password123',
    role: 'police',
    badge_number: 12345
  };

  describe('POST /api/auth/register', () => {
    it('1. crea un usuario admin correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario creado correctamente');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(adminData.email);
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.badge_number).toBeNull();
    });

    it('2. crea un usuario police con badge_number correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(policeData);

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(policeData.email);
      expect(response.body.user.role).toBe('police');
      expect(response.body.user.badge_number).toBe(policeData.badge_number);
    });

    it('3. rechaza campos obligatorios ausentes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' }); // Falta password y role

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email, password y role son obligatorios');
    });

    it('4. rechaza role inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...adminData, role: 'hacker' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Rol inválido');
    });

    it('5. rechaza police sin badge_number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'police2@test.com', password: 'pass', role: 'police' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('badge_number es obligatorio para policía');
    });

    it('6. rechaza admin con badge_number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...adminData, badge_number: '123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('admin no debe tener badge_number');
    });

    it('7. rechaza email duplicado', async () => {
      await request(app).post('/api/auth/register').send(adminData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('El usuario ya existe');
    });

    it('8. rechaza badge_number duplicado para police', async () => {
      await request(app).post('/api/auth/register').send(policeData);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...policeData, email: 'other@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Ya existe un policía con ese badge_number');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(adminData);
    });

    it('9. devuelve token con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(adminData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login correcto');
      expect(response.body).toHaveProperty('token');
    });

    it('10. rechaza usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'fake@test.com', password: 'password123', role: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('11. rechaza password incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: adminData.email, password: 'wrongpassword', role: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('12. rechaza role incorrecto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: adminData.email, password: adminData.password, role: 'police' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('No tienes permisos para acceder desde este login');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(adminData);
      const loginRes = await request(app).post('/api/auth/login').send(adminData);
      token = loginRes.body.token;
    });

    it('13. devuelve el usuario autenticado sin password', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(adminData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('14. devuelve 401 sin token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No autorizado: token no proporcionado');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(adminData);
      const loginRes = await request(app).post('/api/auth/login').send(adminData);
      token = loginRes.body.token;
    });

    it('15. devuelve logout correcto con token válido', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout correcto');
    });
  });

  describe('POST /api/auth/login/anonymous', () => {
    it('16. devuelve token y usuario anonymous', async () => {
      const response = await request(app)
        .post('/api/auth/login/anonymous')
        .send({ deviceId: 'test-device' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login anónimo correcto');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.id).toBe('test-device');
      expect(response.body.user.role).toBe('anonymous');
    });
  });
});
