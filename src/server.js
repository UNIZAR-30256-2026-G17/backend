/**
 * Archivo: server.js
 * Descripción: arranque del servidor y conexión a MongoDB.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
   .connect(MONGODB_URI)
   .then(() => {
      console.log('Conectado a MongoDB');
      app.listen(PORT, () => {
         console.log(`Servidor en http://localhost:${PORT}`);
      });
   })
   .catch((error) => {
      console.error('Error conectando a MongoDB:', error.message);
   });