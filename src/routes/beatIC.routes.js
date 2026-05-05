/**
 * Archivo: beatIC.routes.js
 * Descripción: rutas de ICs por Beat.
 */

const express = require('express');
const router = express.Router();

const beatICController = require('../controllers/beatIC.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /ic_beat:
 *   get:
 *     summary: Obtener ICs por beat
 *     description: Devuelve la lista de índices de criminalidad (IC) agregados por beat. Permite seleccionar la escala temporal mediante el parámetro `time`. Si no se proporciona, se usa `day` por defecto. La estructura de respuesta es la misma para cualquier escala temporal.
 *     tags: [ICBeat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: time
 *         required: false
 *         description: Escala temporal de los índices de criminalidad por beat
 *         schema:
 *           type: string
 *           enum: [day, month, year, three_year]
 *           example: day
 *     responses:
 *       200:
 *         description: Lista de ICs por beat obtenida correctamente
 *         content:
 *           application/json:
 *             example:
 *               count: 3
 *               beatsICs:
 *                 - _id: 69f9b2d4a8b7a976971e5ee5
 *                   beat: own
 *                   id: 1.8111048072850113
 *                 - _id: 69f9b2d4a8b7a976971e5ee6
 *                   beat: 2D1
 *                   id: 3.183772539010834
 *                 - _id: 69f9b2d4a8b7a976971e5ee7
 *                   beat: 2D2
 *                   id: 3.3468836834853692
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, beatICController.getBeatsICs);

module.exports = router;