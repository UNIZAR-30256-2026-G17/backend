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
 *     description: Crea un nuevo usuario con rol `admin` o `police`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       description: Datos necesarios para registrar un usuario
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           example:
 *             email: police1@test.com
 *             password: "123456"
 *             role: police
 *             badge_number: 1234
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos, email duplicado o badge_number ya existente
 *       500:
 *         description: Error interno del servidor
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica a un usuario registrado y devuelve un token JWT. Actualmente requiere `email`, `password` y `role`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       description: Credenciales de acceso del usuario
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             email: admin_prueba_1@test.com
 *             password: "123456"
 *             role: admin
 *     responses:
 *       200:
 *         description: Login correcto
 *       400:
 *         description: Credenciales inválidas o campos obligatorios ausentes
 *       403:
 *         description: El rol enviado no coincide con el del usuario
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/login/anonymous:
 *   post:
 *     summary: Iniciar sesión como usuario anónimo
 *     description: Genera un token JWT para un usuario anónimo. Si no se envía `deviceId`, el backend genera uno automáticamente.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       description: Identificador opcional del dispositivo o cliente
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginAnonymousInput'
 *           example:
 *             deviceId: dispositivo-demo-001
 *     responses:
 *       200:
 *         description: Login anónimo correcto
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login/anonymous', authController.anonymousLogin);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     description: Devuelve la información del usuario autenticado a partir del token JWT enviado en la cabecera Authorization.
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
 *         description: Error interno del servidor
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Valida el token JWT y devuelve una respuesta de cierre de sesión correcto. La eliminación efectiva del token se realiza en el cliente.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout correcto
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;