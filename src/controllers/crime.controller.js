/**
 * Archivo: crime.controller.js
 * Descripción: lógica de consulta de delitos.
 */

const Crime = require('../models/Crime');

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

      const crimeTypeMap = {
         'Delito contra la sociedad': 'Crime Against Society',
         'Delito contra la propiedad': 'Crime Against Property',
         'Delito contra la persona': 'Crime Against Person'
      };

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

      if (crimename1) {
         if (!validCrimeTypes.includes(crimename1)) {
            return res.status(400).json({
               message: 'crimename1 inválido'
            });
         }

         filter.crimename1 = crimeTypeMap[crimename1];
      }

      if (district) {
         if (!validDistricts.includes(district)) {
            return res.status(400).json({
               message: 'district inválido'
            });
         }

         filter.district = districtMap[district];
      }

      if (beat) {
         if (!validBeats.includes(beat)) {
            return res.status(400).json({
               message: 'beat inválido'
            });
         }

         filter.beat = { $regex: beat, $options: 'i' };
      }

      if (from || to) {
         filter.start_date = {};

         if (from) {
            filter.start_date.$gte = `${from}T00:00`;
         }

         if (to) {
            filter.start_date.$lte = `${to}T23:59`;
         }
      }

      const sortFieldMap = {
         createdAt: 'start_date',
         time: 'start_date',
         victims: 'victims'
      };

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

      const parsedOffset = Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10);
      const parsedLimit = Number.isNaN(parseInt(limit, 10)) ? 200 : parseInt(limit, 10);

      const safeOffset = Math.max(parsedOffset, 0);
      const safeLimit = Math.min(Math.max(parsedLimit, 1), 500);

      const crimes = await Crime.find(filter)
         .sort(sortOption)
         .skip(safeOffset)
         .limit(safeLimit);

      const total = await Crime.countDocuments(filter);

      return res.status(200).json({
         total,
         offset: safeOffset,
         limit: safeLimit,
         count: crimes.length,
         crimes
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

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

      return res.status(200).json({
         message: 'Delito eliminado definitivamente'
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};