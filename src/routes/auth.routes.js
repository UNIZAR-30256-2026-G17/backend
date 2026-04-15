/**
 * Archivo: auth.routes.js
 * Descripción: define las rutas de autenticación.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar usuario
 *     description: Crea un nuevo usuario con rol admin o police.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos o usuario ya existente
 *       500:
 *         description: Error en el servidor
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica a un usuario y devuelve un token JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login correcto
 *       400:
 *         description: Credenciales inválidas o datos faltantes
 *       500:
 *         description: Error en el servidor
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/login/anonymous:
 *   post:
 *     summary: Iniciar sesión como usuario anónimo
 *     description: Devuelve un token JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginAnonymousInput'
 *     responses:
 *       200:
 *         description: Login anónimo correcto
 *       400:
 *         description: Credenciales inválidas o datos faltantes
 *       500:
 *         description: Error en el servidor
 */
router.post('/login/anonymous', authController.anonymousLogin);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     description: Devuelve la información del usuario autenticado a partir del token JWT.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado obtenido correctamente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Valida el token y devuelve una respuesta de logout correcto. La eliminación del token se realiza en el cliente.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout correcto
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error en el servidor
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;