/**
 * Archivo: request-logger.middleware.js
 * Descripción: registra cada petición HTTP completada, incluyendo
 * método, URL, código de estado y tiempo de respuesta.
 */

const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
   const start = Date.now();

   // El log se registra cuando la respuesta ya ha finalizado
   res.on('finish', () => {
      const durationMs = Date.now() - start;

      logger.info('HTTP request', {
         method: req.method,
         url: req.originalUrl,
         statusCode: res.statusCode,
         durationMs
      });
   });

   next();
};

module.exports = requestLogger;