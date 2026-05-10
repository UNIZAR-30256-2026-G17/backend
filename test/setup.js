const logger = require('../src/config/logger');

// Silenciar logs de Winston en tests
logger.transports.forEach((t) => (t.silent = true));
