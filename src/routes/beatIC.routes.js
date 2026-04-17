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
 *     description: Devuelve la lista de índices de criminalidad (IC) agregados por beat. Permite seleccionar la escala temporal mediante el parámetro `time`. Si no se proporciona, se usa `day` por defecto.
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
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, beatICController.getBeatsICs);

module.exports = router;