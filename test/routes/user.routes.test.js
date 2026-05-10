const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

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
  await User.deleteMany({});
});

// Función de ayuda para generar tokens
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('User Endpoints', () => {
  describe('GET /api/users', () => {
    it('1. devuelve usuarios sin password con token de admin', async () => {
      // Crear un usuario de prueba
      const user = await User.create({
        email: 'test@test.com',
        password: 'hashedpassword',
        role: 'police'
      });
      const token = generateToken(user._id, 'admin');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.users[0]).toHaveProperty('_id');
      expect(response.body.users[0].email).toBe('test@test.com');
      expect(response.body.users[0]).not.toHaveProperty('password');
    });

    it('2. devuelve 401 sin token', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No autorizado: token no proporcionado');
    });

    it('3. devuelve 403 con token de police', async () => {
      const token = generateToken(new mongoose.Types.ObjectId(), 'police');

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Acceso denegado: permisos insuficientes');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('4. elimina un usuario con token de admin', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const token = generateToken(adminId, 'admin');

      const userToDelete = await User.create({
        email: 'delete_me@test.com',
        password: 'pass',
        role: 'police'
      });

      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuario eliminado definitivamente');

      const userInDb = await User.findById(userToDelete._id);
      expect(userInDb).toBeNull();
    });

    it('5. devuelve 404 si el usuario no existe', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const token = generateToken(adminId, 'admin');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Usuario no encontrado');
    });

    it('6. impide que un admin se elimine a sí mismo', async () => {
      const adminUser = await User.create({
        email: 'admin@test.com',
        password: 'pass',
        role: 'admin'
      });
      const token = generateToken(adminUser._id, 'admin');

      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No puedes eliminar tu propio usuario');
    });

    it('7. devuelve 403 con token de police', async () => {
      const policeId = new mongoose.Types.ObjectId();
      const token = generateToken(policeId, 'police');
      const targetId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${targetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Acceso denegado: permisos insuficientes');
    });
  });
});
