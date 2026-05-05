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
 *     description: Devuelve la lista de índices de criminalidad (IC) agregados por distrito. Permite seleccionar la escala temporal mediante el parámetro `time`. Si no se proporciona, el backend usa `day` por defecto. La estructura de respuesta es la misma para cualquier escala temporal.
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
 *         content:
 *           application/json:
 *             example:
 *               count: 3
 *               districtsICs:
 *                 - _id: 69f9b2d4a8b7a976971e5edc
 *                   district: null
 *                   id: 1.8111048072850113
 *                 - _id: 69f9b2d4a8b7a976971e5edd
 *                   district: BETHESDA
 *                   id: 26.471030408164545
 *                 - _id: 69f9b2d4a8b7a976971e5ede
 *                   district: GERMANTOWN
 *                   id: 14.4223143016121
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, districtICController.getDistrictsICs);

module.exports = router;