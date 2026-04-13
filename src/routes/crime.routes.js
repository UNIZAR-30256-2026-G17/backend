/**
 * Archivo: crime.routes.js
 * Descripción: rutas de delitos.
 */

const express = require('express');
const router = express.Router();

const crimeController = require('../controllers/crime.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * GET /crimes
 * Obtener todos los delitos del sistema.
 */
router.get('/', crimeController.getCrimes);

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'police'), crimeController.deleteCrime);

module.exports = router;