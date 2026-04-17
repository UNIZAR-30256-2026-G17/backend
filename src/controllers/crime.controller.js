/**
 * Archivo: crime.controller.js
 * Descripción: lógica de consulta, actualización y eliminación de delitos.
 */

const logger = require('../config/logger');
const Crime = require('../models/Crime');

/**
 * Devuelve la lista de delitos del sistema con filtros opcionales,
 * ordenación y paginación.
 */
exports.getCrimes = async (req, res) => {
   try {
      const {
         crimename1,
         district,
         beat,
         from,
         to,
         sort,
         order,
         offset,
         limit
      } = req.query;

      // Mapeo de valores de entrada en español a los valores reales almacenados en la base de datos
      const crimeTypeMap = {
         'Delito contra la sociedad': 'Crime Against Society',
         'Delito contra la propiedad': 'Crime Against Property',
         'Delito contra la persona': 'Crime Against Person'
      };

      // Normalización de distritos a su formato real en la colección
      const districtMap = {
         'Rockville': 'ROCKVILLE',
         'Silver Spring': 'SILVER SPRING',
         'Montgomery Village': 'MONTGOMERY VILLAGE',
         'Germantown': 'GERMANTOWN',
         'Bethesda': 'BETHESDA',
         'Takoma Park': 'TAKOMA PARK',
         'Wheaton': 'WHEATON'
      };

      const validCrimeTypes = Object.keys(crimeTypeMap);
      const validDistricts = Object.keys(districtMap);
      const validBeats = ['A', 'B', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'T', 'W'];
      const validSorts = ['createdAt', 'time', 'victims'];
      const validOrders = ['asc', 'desc'];

      const filter = {};

      // Filtro por tipo general de delito
      if (crimename1) {
         if (!validCrimeTypes.includes(crimename1)) {
            return res.status(400).json({
               message: 'crimename1 inválido'
            });
         }

         filter.crimename1 = crimeTypeMap[crimename1];
      }

      // Filtro por distrito
      if (district) {
         if (!validDistricts.includes(district)) {
            return res.status(400).json({
               message: 'district inválido'
            });
         }

         filter.district = districtMap[district];
      }

      // Filtro por beat usando coincidencia parcial sobre el código real almacenado
      if (beat) {
         if (!validBeats.includes(beat)) {
            return res.status(400).json({
               message: 'beat inválido'
            });
         }

         filter.beat = { $regex: beat, $options: 'i' };
      }

      // Filtro por rango de fechas sobre el campo start_date
      if (from || to) {
         filter.start_date = {};

         if (from) {
            filter.start_date.$gte = `${from}T00:00`;
         }

         if (to) {
            filter.start_date.$lte = `${to}T23:59`;
         }
      }

      // Mapeo de campos de ordenación de la API a los campos reales de la colección
      const sortFieldMap = {
         createdAt: 'start_date',
         time: 'start_date',
         victims: 'victims'
      };

      // Orden por defecto: delitos más recientes primero
      let sortOption = { start_date: -1 };

      if (sort) {
         if (!validSorts.includes(sort)) {
            return res.status(400).json({
               message: 'sort inválido'
            });
         }

         if (order && !validOrders.includes(order)) {
            return res.status(400).json({
               message: 'order inválido'
            });
         }

         const direction = order === 'asc' ? 1 : -1;

         sortOption = {
            [sortFieldMap[sort]]: direction
         };
      }

      // Validación y normalización de parámetros de paginación
      const parsedOffset = Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10);
      const parsedLimit = Number.isNaN(parseInt(limit, 10)) ? 200 : parseInt(limit, 10);

      const safeOffset = Math.max(parsedOffset, 0);
      const safeLimit = Math.min(Math.max(parsedLimit, 1), 500);

      // Consulta paginada de delitos
      const crimes = await Crime.find(filter)
         .sort(sortOption)
         .skip(safeOffset)
         .limit(safeLimit);

      // Número total de documentos que cumplen el filtro
      const total = await Crime.countDocuments(filter);

      logger.info('Consulta de delitos realizada', {
         count: crimes.length,
         total,
         offset: safeOffset,
         limit: safeLimit
      });

      return res.status(200).json({
         total,
         offset: safeOffset,
         limit: safeLimit,
         count: crimes.length,
         crimes
      });
   } catch (error) {
      logger.error('Error en getCrimes', {
         message: error.message,
         stack: error.stack,
         query: req.query
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Actualiza el estado de un delito existente.
 */
exports.updateCrimeStatus = async (req, res) => {
   try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'deleted'];

      // Validación del nuevo estado
      if (!status || !validStatuses.includes(status)) {
         return res.status(400).json({
            message: 'Status inválido. Valores permitidos: available, deleted'
         });
      }

      const crime = await Crime.findByIdAndUpdate(
         id,
         { $set: { status } },
         { new: true }
      );

      if (!crime) {
         return res.status(404).json({
            message: 'Delito no encontrado'
         });
      }

      logger.info('Estado del delito actualizado', {
         crimeId: id,
         newStatus: status,
         userId: req.user?.id
      });

      return res.status(200).json({
         message: 'Estado del delito actualizado correctamente',
         crime
      });
   } catch (error) {
      logger.error('Error en updateCrimeStatus', {
         message: error.message,
         stack: error.stack,
         crimeId: req.params?.id,
         requestedStatus: req.body?.status,
         userId: req.user?.id
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Elimina definitivamente un delito de la base de datos.
 */
exports.deleteCrime = async (req, res) => {
   try {
      const { id } = req.params;

      const crime = await Crime.findById(id);

      if (!crime) {
         return res.status(404).json({
            message: 'Delito no encontrado'
         });
      }

      await Crime.findByIdAndDelete(id);

      logger.info('Delito eliminado definitivamente', {
         crimeId: id,
         userId: req.user?.id
      });

      return res.status(200).json({
         message: 'Delito eliminado definitivamente'
      });
   } catch (error) {
      logger.error('Error en deleteCrime', {
         message: error.message,
         stack: error.stack,
         crimeId: req.params?.id,
         userId: req.user?.id
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};