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
 *     description: Crea una nueva alerta con estado inicial `pending`, asociada al usuario autenticado.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Datos necesarios para crear una alerta
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertInput'
 *           example:
 *             description: Robo en la calle Mayor
 *             address: Calle Mayor 10, Madrid
 *     responses:
 *       201:
 *         description: Alerta creada correctamente
 *       400:
 *         description: Datos inválidos o dirección no geocodificable
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authMiddleware, alertController.createAlert);

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Obtener todas las alertas
 *     description: Devuelve la lista de alertas del sistema con filtros opcionales por estado y rango de fechas.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filtrar alertas por estado
 *         schema:
 *           type: string
 *           enum: [pending, attended, deleted]
 *       - in: query
 *         name: from
 *         required: false
 *         description: Fecha inicial del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-04-01
 *       - in: query
 *         name: to
 *         required: false
 *         description: Fecha final del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-04-10
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida correctamente
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, alertController.getAlerts);

/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Obtener una alerta por ID
 *     description: Devuelve la información detallada de una alerta concreta, incluyendo estadísticas e interacción del usuario autenticado.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     responses:
 *       200:
 *         description: Alerta obtenida correctamente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authMiddleware, alertController.getAlertById);

/**
 * @swagger
 * /alerts/{id}:
 *   patch:
 *     summary: Cambiar el estado de una alerta
 *     description: Actualiza el estado de una alerta existente. Solo permitido para usuarios con rol `admin` o `police`.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     requestBody:
 *       required: true
 *       description: Nuevo estado de la alerta
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertStatusInput'
 *           example:
 *             status: attended
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authMiddleware, roleMiddleware('admin', 'police'), alertController.updateAlertStatus);

/**
 * @swagger
 * /alerts/{id}/confirmations:
 *   post:
 *     summary: Confirmar una alerta
 *     description: Añade la confirmación del usuario autenticado a una alerta. Si el usuario la había descartado previamente, se actualiza su interacción.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     responses:
 *       200:
 *         description: Alerta confirmada correctamente
 *       400:
 *         description: La alerta no se puede confirmar o el usuario ya la había confirmado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/confirmations', authMiddleware, alertController.confirmAlert);

/**
 * @swagger
 * /alerts/{id}/confirmations:
 *   delete:
 *     summary: Eliminar confirmación de una alerta
 *     description: Elimina la confirmación realizada por el usuario autenticado sobre una alerta.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
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
 *         description: Error interno del servidor
 */
router.delete('/:id/confirmations', authMiddleware, alertController.removeConfirmation);

/**
 * @swagger
 * /alerts/{id}/discards:
 *   post:
 *     summary: Descartar una alerta
 *     description: Añade el descarte del usuario autenticado a una alerta. Si el usuario la había confirmado previamente, se actualiza su interacción.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     responses:
 *       200:
 *         description: Alerta descartada correctamente
 *       400:
 *         description: La alerta no se puede descartar o el usuario ya la había descartado
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/discards', authMiddleware, alertController.discardAlert);

/**
 * @swagger
 * /alerts/{id}/discards:
 *   delete:
 *     summary: Eliminar descarte de una alerta
 *     description: Elimina el descarte realizado por el usuario autenticado sobre una alerta.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
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
 *         description: Error interno del servidor
 */
router.delete('/:id/discards', authMiddleware, alertController.removeDiscard);

/**
 * @swagger
 * /alerts/{id}:
 *   delete:
 *     summary: Eliminar una alerta definitivamente
 *     description: Elimina físicamente una alerta de la base de datos. Solo se permite si previamente su estado es `deleted` y el usuario tiene rol `admin` o `police`.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único de la alerta
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     responses:
 *       200:
 *         description: Alerta eliminada definitivamente
 *       400:
 *         description: La alerta debe estar previamente en estado deleted
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Alerta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'police'), alertController.deleteAlert);

module.exports = router;