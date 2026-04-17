/**
 * Archivo: beatIC.controller.js
 * Descripción: lógica de consulta de índices de criminalidad por beat.
 */

const logger = require('../config/logger');
const BeatICDay = require('../models/BeatICDay');
const BeatICMonth = require('../models/BeatICMonth');
const BeatICYear = require('../models/BeatICYear');
const BeatICThreeYear = require('../models/BeatICThreeYear');

/**
 * Devuelve los índices de criminalidad por beat según la escala temporal solicitada.
 * Si no se indica el parámetro time, se utiliza la escala diaria por defecto.
 */
exports.getBeatsICs = async (req, res) => {
   try {
      const { time } = req.query;

      let Model;

      // Selección del modelo en función de la escala temporal solicitada
      switch (time) {
         case 'day':
            Model = BeatICDay;
            break;
         case 'month':
            Model = BeatICMonth;
            break;
         case 'year':
            Model = BeatICYear;
            break;
         case 'three_year':
            Model = BeatICThreeYear;
            break;
         default:
            Model = BeatICDay;
      }

      // Consulta de todos los documentos del modelo seleccionado
      const beatsICs = await Model.find({});

      logger.info('Consulta de ICs por beat realizada', {
         time: time || 'day',
         count: beatsICs.length
      });

      res.status(200).json({
         count: beatsICs.length,
         beatsICs
      });
   } catch (error) {
      logger.error('Error en getBeatsICs', {
         message: error.message,
         stack: error.stack,
         query: req.query
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};