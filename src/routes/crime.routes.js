/**
 * Archivo: crime.routes.js
 * Descripción: rutas de delitos.
 */

const express = require('express');
const router = express.Router();

const crimeController = require('../controllers/crime.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * /crimes:
 *   get:
 *     summary: Obtener todos los delitos del sistema
 *     description: >
 *       Devuelve la lista de delitos del sistema con filtros opcionales, ordenación y paginación.
 *       El parámetro `crimename1` acepta valores en español, que el backend traduce internamente a los valores reales almacenados en la base de datos.
 *       El parámetro `district` también se normaliza internamente al formato real de MongoDB.
 *     tags: [Crimes]
 *     parameters:
 *       - in: query
 *         name: crimename1
 *         required: false
 *         description: Tipo general de delito
 *         schema:
 *           type: string
 *           enum:
 *             - Delito contra la sociedad
 *             - Delito contra la propiedad
 *             - Delito contra la persona
 *       - in: query
 *         name: district
 *         required: false
 *         description: Distrito policial
 *         schema:
 *           type: string
 *           enum:
 *             - Rockville
 *             - Silver Spring
 *             - Montgomery Village
 *             - Germantown
 *             - Bethesda
 *             - Takoma Park
 *             - Wheaton
 *       - in: query
 *         name: beat
 *         required: false
 *         description: >
 *           Letra identificativa del beat. El backend filtra sobre el campo real `beat`
 *           usando coincidencia parcial.
 *         schema:
 *           type: string
 *           enum: [A, B, D, E, G, H, I, J, K, L, M, N, P, R, T, W]
 *       - in: query
 *         name: from
 *         required: false
 *         description: Fecha inicial del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-01
 *       - in: query
 *         name: to
 *         required: false
 *         description: Fecha final del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-10
 *       - in: query
 *         name: sort
 *         required: false
 *         description: >
 *           Campo de ordenación. Los valores `createdAt` y `time` se interpretan internamente
 *           como ordenación por `start_date`.
 *         schema:
 *           type: string
 *           enum: [createdAt, time, victims]
 *       - in: query
 *         name: order
 *         required: false
 *         description: Dirección de la ordenación
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Número de documentos a omitir
 *         schema:
 *           type: integer
 *           default: 0
 *           example: 0
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Número máximo de documentos a devolver
 *         schema:
 *           type: integer
 *           default: 200
 *           example: 50
 *     responses:
 *       200:
 *         description: Lista de delitos obtenida correctamente
 *       400:
 *         description: Alguno de los parámetros de consulta es inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', crimeController.getCrimes);

/**
 * @swagger
 * /crimes/{id}:
 *   patch:
 *     summary: Cambiar el estado de un delito
 *     description: >
 *       Actualiza el campo `status` de un delito. Solo permitido para usuarios con rol `admin` o `police`.
 *       Los valores permitidos son `available` y `deleted`.
 *     tags: [Crimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único del delito
 *         schema:
 *           type: string
 *           example: 69e1cc34fa02f60011036cb9
 *     requestBody:
 *       required: true
 *       description: Nuevo estado del delito
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrimeStatusInput'
 *           example:
 *             status: deleted
 *     responses:
 *       200:
 *         description: Estado del delito actualizado correctamente
 *       400:
 *         description: Status inválido
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Delito no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id', authMiddleware, roleMiddleware('admin', 'police'), crimeController.updateCrimeStatus);

/**
 * @swagger
 * /crimes/{id}:
 *   delete:
 *     summary: Eliminar un delito definitivamente
 *     description: >
 *       Elimina físicamente un delito de la base de datos. Solo permitido para usuarios con rol `admin` o `police`.
 *     tags: [Crimes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador único del delito
 *         schema:
 *           type: string
 *           example: 69dd280c9edd46d80b4e07ec
 *     responses:
 *       200:
 *         description: Delito eliminado definitivamente
 *       401:
 *         description: Token no proporcionado, inválido o expirado
 *       403:
 *         description: Acceso denegado por rol insuficiente
 *       404:
 *         description: Delito no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'police'), crimeController.deleteCrime);

module.exports = router;