const requestLogger = require('../../src/middlewares/request-logger.middleware');
const logger = require('../../src/config/logger');

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Request Logger Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let finishCallback;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {
        origin: 'http://localhost:8081',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type'
      }
    };
    mockRes = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      })
    };
    mockNext = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should call next()', () => {
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should register request when response finishes', () => {
    requestLogger(mockReq, mockRes, mockNext);

    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Simulate some time passing
    jest.advanceTimersByTime(100);

    // Trigger the finish event
    finishCallback();

    expect(logger.info).toHaveBeenCalledWith('HTTP request', {
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      durationMs: 100,
      origin: mockReq.headers.origin,
      accessControlRequestMethod: 'GET',
      accessControlRequestHeaders: 'content-type'
    });
  });
});
