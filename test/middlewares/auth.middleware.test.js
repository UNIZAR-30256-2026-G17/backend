const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middlewares/auth.middleware');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', () => {
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No autorizado: token no proporcionado'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should accept valid token in Authorization header (Bearer)', () => {
    const userPayload = { id: 'user-test-id', email: 'test@test.com', role: 'admin' };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET);

    mockReq.headers.authorization = `Bearer ${token}`;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.id).toBe(userPayload.id);
    expect(mockReq.user.email).toBe(userPayload.email);
    expect(mockReq.user.role).toBe(userPayload.role);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should accept valid token in token header', () => {
    const userPayload = { id: 2, email: 'test2@test.com', role: 'admin' };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET);

    mockReq.headers.token = token;

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.id).toBe(userPayload.id);
    expect(mockReq.user.email).toBe(userPayload.email);
    expect(mockReq.user.role).toBe(userPayload.role);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', () => {
    mockReq.headers.authorization = 'Bearer invalid_token_string';

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No autorizado: token inválido o expirado'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
