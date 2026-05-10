const roleMiddleware = require('../../src/middlewares/role.middleware');

describe('Role Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if req.user does not exist', () => {
    const middleware = roleMiddleware('admin', 'user');
    
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No autorizado: usuario no autenticado'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if role is not allowed', () => {
    mockReq.user = { role: 'guest' };
    const middleware = roleMiddleware('admin', 'user');
    
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Acceso denegado: permisos insuficientes'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if role is allowed', () => {
    mockReq.user = { role: 'admin' };
    const middleware = roleMiddleware('admin', 'user');
    
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 500 if an error occurs', () => {
    mockReq.user = { role: 'admin' };
    const middleware = roleMiddleware('admin', 'user');
    
    // Simulate an error by making includes throw (e.g. allowedRoles not an array or similar, although not possible with rest params)
    // To trigger the catch block in the middleware, we can make req.user a getter that throws
    Object.defineProperty(mockReq, 'user', {
      get() { throw new Error('Simulated error'); }
    });
    
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Error en la autorización'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
