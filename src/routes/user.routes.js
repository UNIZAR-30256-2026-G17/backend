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

module.exports = router;