/**
 * Archivo: app.js
 * Descripción: configuración principal de Express y rutas.
 */

const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const alertRoutes = require('./routes/alert.routes');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
   res.send('API funcionando');
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
   res.status(200).json({
      ok: true,
      message: 'Backend funcionando correctamente'
   });
});

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);

module.exports = app;