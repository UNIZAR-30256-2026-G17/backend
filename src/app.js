/**
 * Archivo: app.js
 * Descripción: configuración principal de la aplicación Express,
 * middlewares globales y registro de rutas.
 */

const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const requestLogger = require('./middlewares/request-logger.middleware');

const alertRoutes = require('./routes/alert.routes');
const authRoutes = require('./routes/auth.routes');
const beatICRoutes = require('./routes/beatIC.routes');
const crimeRoutes = require('./routes/crime.routes');
const districtICRoutes = require('./routes/districtIC.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';

// Middlewares globales
app.use(requestLogger);

// Solo se permiten peticiones desde el origen del frontend
app.use(cors({
   origin: frontendUrl,
   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['authorization', 'content-type', 'token']
}));

app.use(express.json());

// Documentación interactiva de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta raíz de comprobación
app.get('/', (req, res) => {
   res.send('API funcionando');
});

// Rutas de la API
app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crimes', crimeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ic_beat', beatICRoutes);
app.use('/api/ic_district', districtICRoutes);

module.exports = app;