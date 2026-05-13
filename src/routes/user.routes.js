/**
 * Archivo: user.routes.js
 * Descripción: rutas de usuarios.
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios del sistema
 *     description: >
 *       Devuelve la lista completa de usuarios almacenados en la colección `USERS`.
 *       La respuesta excluye el campo `password` para no exponer información sensible.
 *       Solo puede ser utilizado por usuarios autenticados con rol `admin`.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida correctamente
 *         content:
 *           application/json:
 *             example:
 *               count: 2
 *               users:
 *                 - _id: 69d53f19f6b80f9859d5c096
 *                   email: admin_prueba_1@test.com
 *                   role: admin
 *                   badge_number: null
 *                   status: active
 *                   createdAt: 2026-04-07T17:30:01.835Z
 *                   updatedAt: 2026-04-07T17:30:01.835Z
 *                 - _id: 69d53fc2f6b80f9859d5c099
 *                   email: police_prueba_1@test.com
 *                   role: police
 *                   badge_number: 1234
 *                   status: active
 *                   createdAt: 2026-04-07T17:32:50.306Z
 *                   updatedAt: 2026-04-07T17:32:50.306Z
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, roleMiddleware('admin'), userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario definitivamente
 *     description: >
 *       Elimina físicamente un usuario de la base de datos. Solo permitido para usuarios con rol `admin`.
 *       El sistema impide que un administrador elimine su propia cuenta.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único del usuario
 *         schema:
 *           type: string
 *           example: 69d53f19f6b80f9859d5c096
 *     responses:
 *       200:
 *         description: Usuario eliminado definitivamente
 *         content:
 *           application/json:
 *             example:
 *               message: Usuario eliminado definitivamente
 *       400:
 *         description: No se permite eliminar la propia cuenta
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), userController.deleteUser);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Cambiar el estado de una usuario
 *     description: Actualiza el estado de una usuario existente. Solo permitido para usuarios con rol `admin`.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único del usuario
 *         schema:
 *           type: string
 *           example: 69d5a5dd3853aa44f430c5b3
 *     requestBody:
 *       required: true
 *       description: Nuevo estado del usuario
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserStatusInput'
 *           example:
 *             status: blocked
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *         content:
 *           application/json:
 *             example:
 *               message: Estado actualizado correctamente
 *               user:
 *                 _id: 69d53f19f6b80f9859d5c096
 *                 email: admin_prueba_1@test.com
 *                 password: $2b$10$Ao.0VTBBzuS1vbvf9CFWb.pfXpOzGZtlwiLqkYFuCqZdq4WOtdsQi
 *                 role: police
 *                 badge_number: 2
 *                 status: blocked
 *                 createdAt: 2026-04-07T17:30:01.835Z
 *                 updatedAt: 2026-04-07T17:30:01.835Z
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), userController.updateUserStatus);

module.exports = router;