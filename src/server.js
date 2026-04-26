/**
 * Archivo: server.js
 * Descripción: punto de entrada del backend. Carga la configuración,
 * conecta con MongoDB y arranca el servidor HTTP.
 */

const dotenv = require('dotenv');
dotenv.config();  // Carga de variables de entorno

const mongoose = require('mongoose');

const app = require('./app');
const logger = require('./config/logger');

// Configuración básica del servidor
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Inicia la conexión con MongoDB y, si se establece correctamente,
 * arranca el servidor HTTP.
 */
const startServer = async () => {
   try {
      await mongoose.connect(MONGODB_URI);
      logger.info('Conectado a MongoDB');

      app.listen(PORT, () => {
         logger.info(`Servidor corriendo en ${process.env.BASE_URL}`);
      });
   } catch (error) {
      logger.error('Error conectando a MongoDB', {
         message: error.message,
         stack: error.stack
      });
   }
};

// Registro de errores no controlados del proceso
process.on('uncaughtException', (error) => {
   logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
   });
});

process.on('unhandledRejection', (reason) => {
   logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
   });
});

// Arranque del servidor
startServer();