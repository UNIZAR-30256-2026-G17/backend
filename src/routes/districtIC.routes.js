/**
 * Archivo: districtIC.routes.js
 * Descripción: Rutas de ICs por Distrito.
 */

const express = require('express');
const router = express.Router();

const districtICController = require('../controllers/districtIC.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /ic_district:
 *   get:
 *     summary: Obtener todas los ICs por Distrito
 *     description: Devuelve la lista de ICs por Distrito del sistema con filtros opcionales.
 *     tags: [ICDistrict]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           enum: [day, month, year, three_year]
 *         required: false
 *         description: Filtrar por tiempo
 *     responses:
 *       200:
 *         description: Lista de ICs por Distrito obtenida correctamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error en el servidor
 */
router.get('/', authMiddleware, districtICController.getDistrictsICs);

module.exports = router;