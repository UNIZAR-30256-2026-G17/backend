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
 *         content:
 *           application/json:
 *             example:
 *               total: 127778
 *               offset: 0
 *               limit: 50
 *               count: 2
 *               crimes:
 *                 - _id: 69c57ccd1c531b4015661dad
 *                   incident_id: 201566183
 *                   case_number: 260010033
 *                   start_date: 2026-03-06T16:37
 *                   nibrs_code: 23C
 *                   victims: 1
 *                   crimename1: Crime Against Property
 *                   crimename2: Shoplifting
 *                   district: WHEATON
 *                   city: SILVER SPRING
 *                   zip_code: 20902
 *                   agency: MCPD
 *                   beat: 4L2
 *                   address_number: 11100
 *                   address_street: VEIRS MILL
 *                   street_type: RD
 *                   latitude: 39.03756
 *                   longitude: -77.0519
 *                   status: available
 *                 - _id: 69c57ccd1c531b4015661dc7
 *                   incident_id: 201566071
 *                   case_number: 260009897
 *                   start_date: 2026-03-05T20:22
 *                   nibrs_code: 90Z
 *                   victims: 1
 *                   crimename1: Crime Against Society
 *                   crimename2: All Other Offenses
 *                   district: ROCKVILLE
 *                   city: ROCKVILLE
 *                   zip_code: 20850
 *                   agency: RCPD
 *                   beat: 1A1
 *                   address_number: 1
 *                   address_street: MARCUS
 *                   street_type: CT
 *                   latitude: 39.07476
 *                   longitude: -77.1628
 *                   status: available
 *       400:
 *         description: Alguno de los parámetros de consulta es inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', crimeController.getCrimes);

/**
 * @swagger
 * /crimes/byCrimename1:
 *   get:
 *     summary: Obtener delitos agrupados por tipo general
 *     description: >
 *       Devuelve los delitos agrupados por `crimename1`, indicando el número total de víctimas
 *       y el porcentaje que representa cada grupo respecto al total del rango consultado.
 *       Los parámetros `from` y `to` son obligatorios, deben cumplir el formato `YYYY-MM-DD`,
 *       `from` no puede ser posterior a `to` y no se permiten fechas futuras. 
 *       La respuesta incluye siempre los tres tipos generales de delito, aunque alguno no tenga 
 *       víctimas en el rango consultado, en cuyo caso se devuelve con valor 0.
 *     tags: [Crimes]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         description: Fecha inicial del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-04-22
 *       - in: query
 *         name: to
 *         required: true
 *         description: Fecha final del rango de búsqueda
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-04-22
 *     responses:
 *       200:
 *         description: Delitos agrupados por tipo obtenidos correctamente
 *         content:
 *           application/json:
 *             example:
 *               from: 2026-04-20
 *               to: 2026-04-22
 *               total_victims: 187
 *               results:
 *                 - crimename1: Crime Against Person
 *                   num_victims: 170
 *                   percentage: 90.91
 *                 - crimename1: Crime Against Society
 *                   num_victims: 0
 *                   percentage: 0
 *                 - crimename1: Crime Against Property
 *                   num_victims: 17
 *                   percentage: 9.09
 *       400:
 *         description: Parámetros de fecha ausentes, inválidos o incoherentes
 *       500:
 *         description: Error interno del servidor
 */
router.get('/byCrimename1', crimeController.getCrimesByCrimename1);

/**
 * @swagger
 * /crimes/yesterday/byDistrict:
 *   get:
 *     summary: Obtener delitos de ayer agrupados por distrito
 *     description: >
 *       Devuelve el número de delitos ocurridos ayer agrupados por distrito.
 *       Solo se devuelve información agregada, no el detalle individual de cada delito.
 *       La respuesta incluye siempre los distritos esperados, aunque alguno no tenga delitos 
 *       en la fecha consultada, en cuyo caso se devuelve con valor 0.
 *     tags: [Crimes]
 *     responses:
 *       200:
 *         description: Delitos agrupados por distrito obtenidos correctamente
 *         content:
 *           application/json:
 *             example:
 *               date: 2026-04-22
 *               total_crimes: 18
 *               results:
 *                 - district: ROCKVILLE
 *                   num_crimes: 0
 *                 - district: SILVER SPRING
 *                   num_crimes: 4
 *                 - district: MONTGOMERY VILLAGE
 *                   num_crimes: 5
 *                 - district: GERMANTOWN
 *                   num_crimes: 0
 *                 - district: BETHESDA
 *                   num_crimes: 6
 *                 - district: TAKOMA PARK
 *                   num_crimes: 0
 *                 - district: WHEATON
 *                   num_crimes: 3
 *       500:
 *         description: Error interno del servidor
 */
router.get('/yesterday/byDistrict', crimeController.getYesterdayCrimesByDistrict);

/**
 * @swagger
 * /crimes/yesterday/byHour:
 *   get:
 *     summary: Obtener delitos de ayer agrupados por hora
 *     description: >
 *       Devuelve el número de delitos ocurridos ayer agrupados por hora.
 *       La respuesta incluye las 24 franjas horarias del día, aunque alguna tenga valor 0.
 *       Solo se devuelve información agregada, no el detalle individual de cada delito.
 *     tags: [Crimes]
 *     responses:
 *       200:
 *         description: Delitos agrupados por hora obtenidos correctamente
 *         content:
 *           application/json:
 *             example:
 *               date: 2026-04-22
 *               total_crimes: 41
 *               results:
 *                 - hour: "00:00"
 *                   num_crimes: 13
 *                 - hour: "01:00"
 *                   num_crimes: 5
 *                 - hour: "02:00"
 *                   num_crimes: 0
 *                 - hour: "03:00"
 *                   num_crimes: 2
 *                 - hour: "23:00"
 *                   num_crimes: 23
 *       500:
 *         description: Error interno del servidor
 */
router.get('/yesterday/byHour', crimeController.getYesterdayCrimesByHour);

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
 *         content:
 *           application/json:
 *             example:
 *               message: Estado del delito actualizado correctamente
 *               crime:
 *                 _id: 69e1cc34fa02f60011036cb9
 *                 incident_id: 999999002
 *                 case_number: 999999002
 *                 start_date: 2026-04-14T10:30
 *                 nibrs_code: TEST
 *                 victims: 0
 *                 crimename1: Crime Against Society
 *                 crimename2: Test Crime Patch
 *                 district: ROCKVILLE
 *                 city: ROCKVILLE
 *                 zip_code: 20850
 *                 agency: TEST
 *                 beat: 1A1
 *                 address_number: 2
 *                 address_street: PATCH TEST STREET
 *                 street_type: RD
 *                 latitude: 39.0845
 *                 longitude: -77.153
 *                 status: deleted
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
 *         content:
 *           application/json:
 *             example:
 *               message: Delito eliminado definitivamente
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