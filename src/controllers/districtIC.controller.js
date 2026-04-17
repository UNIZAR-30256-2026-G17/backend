/**
 * Archivo: districtIC.controller.js
 * Descripción: lógica de consulta de índices de criminalidad por distrito.
 */

const logger = require('../config/logger');
const DistrictICDay = require('../models/DistrictICDay');
const DistrictICMonth = require('../models/DistrictICMonth');
const DistrictICYear = require('../models/DistrictICYear');
const DistrictICThreeYear = require('../models/DistrictICThreeYear');

/**
 * Devuelve los índices de criminalidad por distrito según la escala temporal solicitada.
 * Si no se indica el parámetro time, se utiliza la escala diaria por defecto.
 */
exports.getDistrictsICs = async (req, res) => {
   try {
      const { time } = req.query;

      let Model;

      // Selección del modelo en función de la escala temporal solicitada
      switch (time) {
         case 'day':
            Model = DistrictICDay;
            break;
         case 'month':
            Model = DistrictICMonth;
            break;
         case 'year':
            Model = DistrictICYear;
            break;
         case 'three_year':
            Model = DistrictICThreeYear;
            break;
         default:
            Model = DistrictICDay;
      }

      // Consulta de todos los documentos del modelo seleccionado
      const districtsICs = await Model.find({});

      logger.info('Consulta de ICs por distrito realizada', {
         time: time || 'day',
         count: districtsICs.length
      });

      res.status(200).json({
         count: districtsICs.length,
         districtsICs
      });
   } catch (error) {
      logger.error('Error en getDistrictsICs', {
         message: error.message,
         stack: error.stack,
         query: req.query
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};