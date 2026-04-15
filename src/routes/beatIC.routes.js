/**
 * Archivo: beatIC.routes.js
 * Descripción: Rutas de ICs por Beat.
 */

const express = require('express');
const router = express.Router();

const beatICController = require('../controllers/beatIC.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /ic_beat:
 *   get:
 *     summary: Obtener todas los ICs por Beat
 *     description: Devuelve la lista de ICs por Beat del sistema con filtros opcionales.
 *     tags: [ICBeat]
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
 *         description: Lista de ICs por Beat obtenida correctamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error en el servidor
 */
router.get('/', authMiddleware, beatICController.getBeatsICs);

module.exports = router;