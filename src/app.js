/**
 * Archivo: app.js
 * Descripción: configuración principal de Express y rutas.
 */

const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const alertRoutes = require('./routes/alert.routes');
const authRoutes = require('./routes/auth.routes');
const crimeRoutes = require('./routes/crime.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
   res.send('API funcionando');
});

app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crimes', crimeRoutes);
app.use('/api/users', userRoutes);

module.exports = app;