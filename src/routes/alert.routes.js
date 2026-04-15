/**
 * Archivo: alert.routes.js
 * Descripción: rutas de alertas.
 */

const express = require('express');
const router = express.Router();

const alertController = require('../controllers/alert.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * /alerts:
 *   post:
 *     summary: Crear una alerta
 *     description: Crea una nueva alerta con estado inicial pending.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertInput'
 *     responses:
 *       201:
 *         description: Alerta creada correctamente
 *       400:
 *         description: Datos inválidos o error al geocodificar la dirección
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error en el servidor
 */
router.post('/', alertController.createAlert);

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Obtener todas las alertas
 *     description: Devuelve la lista de alertas del sistema con filtros opcionales.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, attended, deleted]
 *         required: false
 *         description: Filtrar por estado
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha inicial
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha final
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida correctamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error en el servidor
 */
router.get('/', alertController.getAlerts);

/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Obtener una alerta por ID
 *     description: Devuelve la información detallada de una alerta.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Alerta obtenida correctamente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.get('/:id', authMiddleware, alertController.getAlertById);

/**
 * @swagger
 * /alerts/{id}:
 *   patch:
 *     summary: Cambiar el estado de una alerta
 *     description: Actualiza el estado de una alerta existente.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertStatusInput'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.patch('/:id', authMiddleware, roleMiddleware('admin', 'police'), alertController.updateAlertStatus);

/**
 * @swagger
 * /alerts/{id}/confirmations:
 *   post:
 *     summary: Confirmar una alerta
 *     description: Añade una confirmación del usuario autenticado a la alerta.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Alerta confirmada correctamente
 *       400:
 *         description: Ya confirmada o alerta inválida
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.post('/:id/confirmations', authMiddleware, alertController.confirmAlert);

/**
 * @swagger
 * /alerts/{id}/confirmations:
 *   delete:
 *     summary: Eliminar confirmación de una alerta
 *     description: Elimina la confirmación del usuario autenticado.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Confirmación eliminada correctamente
 *       400:
 *         description: El usuario no había confirmado la alerta
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.delete('/:id/confirmations', authMiddleware, alertController.removeConfirmation);

/**
 * @swagger
 * /alerts/{id}/discards:
 *   post:
 *     summary: Descartar una alerta
 *     description: Añade un descarte del usuario autenticado a la alerta.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Alerta descartada correctamente
 *       400:
 *         description: Ya descartada o alerta inválida
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.post('/:id/discards', authMiddleware, alertController.discardAlert);

/**
 * @swagger
 * /alerts/{id}/discards:
 *   delete:
 *     summary: Eliminar descarte de una alerta
 *     description: Elimina el descarte del usuario autenticado.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Descarte eliminado correctamente
 *       400:
 *         description: El usuario no había descartado la alerta
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.delete('/:id/discards', authMiddleware, alertController.removeDiscard);

/**
 * @swagger
 * /alerts/{id}:
 *   delete:
 *     summary: Eliminar una alerta definitivamente
 *     description: Elimina de forma permanente una alerta de la base de datos. Solo permitido si su estado es deleted.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la alerta
 *     responses:
 *       200:
 *         description: Alerta eliminada definitivamente
 *       400:
 *         description: La alerta debe estar en estado deleted
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error en el servidor
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'police'), alertController.deleteAlert);

module.exports = router;