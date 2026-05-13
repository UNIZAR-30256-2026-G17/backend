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
         { returnDocument: 'after' }
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

/**
 * Devuelve los delitos agrupados por crimename1 para un rango de fechas obligatorio.
 * Para cada grupo se calcula el número total de víctimas y su porcentaje sobre el total.
 */
exports.getCrimesByCrimename1 = async (req, res) => {
   try {
      const { from, to } = req.query;

      // El rango de fechas es obligatorio
      if (!from || !to) {
         return res.status(400).json({
            message: 'Los parámetros from y to son obligatorios'
         });
      }

      // Validación estricta del formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(from) || !dateRegex.test(to)) {
         return res.status(400).json({
            message: 'Las fechas deben tener el formato YYYY-MM-DD'
         });
      }

      const fromDate = new Date(`${from}T00:00:00`);
      const toDate = new Date(`${to}T00:00:00`);

      // Validación de fechas reales
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
         return res.status(400).json({
            message: 'Las fechas introducidas no son válidas'
         });
      }

      // La fecha inicial no puede ser posterior a la final
      if (fromDate > toDate) {
         return res.status(400).json({
            message: 'El parámetro from no puede ser posterior a to'
         });
      }

      // No se permiten fechas futuras
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (fromDate > today || toDate > today) {
         return res.status(400).json({
            message: 'No se permiten fechas futuras'
         });
      }

      const start = `${from}T00:00`;
      const end = `${to}T23:59`;

      const groupedCrimes = await Crime.aggregate([
         {
            $match: {
               start_date: {
                  $gte: start,
                  $lte: end
               }
            }
         },
         {
            $group: {
               _id: '$crimename1',
               num_victims: { $sum: '$victims' }
            }
         },
         {
            $sort: {
               num_victims: -1
            }
         }
      ]);

      const totalVictims = groupedCrimes.reduce(
         (sum, item) => sum + item.num_victims,
         0
      );

      // Se devuelven siempre los tres tipos generales de delito,
      // aunque alguno no tenga datos en el rango consultado
      const crimeTypes = [
         'Crime Against Person',
         'Crime Against Society',
         'Crime Against Property'
      ];

      const results = crimeTypes.map((crimeType) => {
         const found = groupedCrimes.find((item) => item._id === crimeType);
         const numVictims = found ? found.num_victims : 0;

         return {
            crimename1: crimeType,
            num_victims: numVictims,
            percentage: totalVictims === 0
               ? 0
               : Number(((numVictims / totalVictims) * 100).toFixed(2))
         };
      });

      logger.info('Consulta de delitos agrupados por crimename1 realizada', {
         from,
         to,
         groups: results.length,
         totalVictims
      });

      return res.status(200).json({
         from,
         to,
         total_victims: totalVictims,
         results
      });
   } catch (error) {
      logger.error('Error en getCrimesByCrimename1', {
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
 * Devuelve el número de delitos ocurridos en un rango de fechas, agrupados por distrito.
 */
exports.getCrimesByDistrict = async (req, res) => {
   try {
      const { from, to } = req.query;

      // El rango de fechas es obligatorio
      if (!from || !to) {
         return res.status(400).json({
            message: 'Los parámetros from y to son obligatorios'
         });
      }

      // Validación estricta del formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(from) || !dateRegex.test(to)) {
         return res.status(400).json({
            message: 'Las fechas deben tener el formato YYYY-MM-DD'
         });
      }

      const fromDate = new Date(`${from}T00:00:00`);
      const toDate = new Date(`${to}T00:00:00`);

      // Validación de fechas reales
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
         return res.status(400).json({
            message: 'Las fechas introducidas no son válidas'
         });
      }

      // La fecha inicial no puede ser posterior a la final
      if (fromDate > toDate) {
         return res.status(400).json({
            message: 'El parámetro from no puede ser posterior a to'
         });
      }

      // No se permiten fechas futuras
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (fromDate > today || toDate > today) {
         return res.status(400).json({
            message: 'No se permiten fechas futuras'
         });
      }

      const start = `${from}T00:00`;
      const end = `${to}T23:59`;

      const groupedCrimes = await Crime.aggregate([
         {
            $match: {
               start_date: {
                  $gte: start,
                  $lte: end
               }
            }
         },
         {
            $group: {
               _id: '$district',
               num_crimes: { $sum: 1 }
            }
         },
         {
            $sort: {
               num_crimes: -1
            }
         }
      ]);

      const totalCrimes = groupedCrimes.reduce(
         (sum, item) => sum + item.num_crimes,
         0
      );

      // Se devuelven siempre los distritos principales,
      // aunque alguno no tenga delitos en el rango consultado
      const districts = [
         'ROCKVILLE',
         'SILVER SPRING',
         'MONTGOMERY VILLAGE',
         'GERMANTOWN',
         'BETHESDA',
         'TAKOMA PARK',
         'WHEATON'
      ];

      const results = districts.map((district) => {
         const found = groupedCrimes.find((item) => item._id === district);

         return {
            district,
            num_crimes: found ? found.num_crimes : 0
         };
      });

      logger.info('Consulta de delitos agrupados por distrito realizada', {
         from,
         to,
         groups: results.length,
         totalCrimes
      });

      return res.status(200).json({
         from,
         to,
         total_crimes: totalCrimes,
         results
      });
   } catch (error) {
      logger.error('Error en getCrimesByDistrict', {
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
 * Devuelve el número de delitos ocurridos ayer agrupados por hora.
 * La respuesta incluye las 24 horas del día, aunque alguna tenga valor 0.
 */
exports.getYesterdayCrimesByHour = async (req, res) => {
   try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');

      const date = `${year}-${month}-${day}`;
      const start = `${date}T00:00`;
      const end = `${date}T23:59`;

      const groupedCrimes = await Crime.aggregate([
         {
            $match: {
               start_date: {
                  $gte: start,
                  $lte: end
               }
            }
         },
         {
            $group: {
               _id: { $substr: ['$start_date', 11, 2] },
               num_crimes: { $sum: 1 }
            }
         },
         {
            $sort: {
               _id: 1
            }
         }
      ]);

      // Construcción de una serie completa de 24 horas
      const results = [];

      for (let hour = 0; hour < 24; hour++) {
         const hourString = String(hour).padStart(2, '0');
         const found = groupedCrimes.find((item) => item._id === hourString);

         results.push({
            hour: `${hourString}:00`,
            num_crimes: found ? found.num_crimes : 0
         });
      }

      const totalCrimes = results.reduce(
         (sum, item) => sum + item.num_crimes,
         0
      );

      logger.info('Consulta de delitos de ayer agrupados por hora realizada', {
         date,
         totalCrimes
      });

      return res.status(200).json({
         date,
         total_crimes: totalCrimes,
         results
      });
   } catch (error) {
      logger.error('Error en getYesterdayCrimesByHour', {
         message: error.message,
         stack: error.stack
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};