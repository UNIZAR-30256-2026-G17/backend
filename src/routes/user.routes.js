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
 * DELETE /users/:id
 * Elimina definitivamente un usuario.
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), userController.deleteUser);

module.exports = router;