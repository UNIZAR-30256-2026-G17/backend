/**
 * Archivo: districtIC.routes.js
 * Descripción: rutas de ICs por distrito.
 */

const express = require('express');
const router = express.Router();

const districtICController = require('../controllers/districtIC.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /ic_district:
 *   get:
 *     summary: Obtener ICs por distrito
 *     description: Devuelve la lista de índices de criminalidad (IC) agregados por distrito. Permite seleccionar la escala temporal mediante el parámetro `time`. Si no se proporciona, el backend usa `day` por defecto.
 *     tags: [ICDistrict]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: time
 *         required: false
 *         description: Escala temporal de los índices de criminalidad por distrito
 *         schema:
 *           type: string
 *           enum: [day, month, year, three_year]
 *           example: day
 *     responses:
 *       200:
 *         description: Lista de ICs por distrito obtenida correctamente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, districtICController.getDistrictsICs);

module.exports = router;