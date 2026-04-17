/**
 * Archivo: logger.js
 * Descripción: configuración central del sistema de logging con Winston.
 * Define los formatos y destinos de salida utilizados por el backend.
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Directorio donde se almacenan los archivos de log
const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
   fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Formato legible para la salida por consola en entorno de desarrollo
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
   const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
   return `${timestamp} [${level}] ${stack || message}${extra}`;
});

const logger = winston.createLogger({
   level: process.env.LOG_LEVEL || 'info',

   // Formato por defecto para los archivos de log
   format: combine(
      timestamp(),
      errors({ stack: true }),
      json()
   ),

   defaultMeta: {
      service: 'montgomeryapp-backend'
   },

   transports: [
      // Archivo exclusivo para errores
      new winston.transports.File({
         filename: path.join(logDir, 'error.log'),
         level: 'error'
      }),

      // Archivo general con todos los eventos registrados
      new winston.transports.File({
         filename: path.join(logDir, 'combined.log')
      })
   ]
});

// En desarrollo también se muestra la salida por consola
if (process.env.NODE_ENV !== 'production') {
   logger.add(
      new winston.transports.Console({
         format: combine(
            colorize(),
            timestamp(),
            errors({ stack: true }),
            consoleFormat
         )
      })
   );
}

module.exports = logger;