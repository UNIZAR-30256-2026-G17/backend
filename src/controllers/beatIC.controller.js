/**
 * Archivo: beatIC.controller.js
 * Descripción: lógica de ICs por Beat.
 */

const BeatICDay = require('../models/BeatICDay');
const BeatICMonth = require('../models/BeatICMonth');
const BeatICYear = require('../models/BeatICYear');
const BeatICThreeYear = require('../models/BeatICThreeYear');

exports.getBeatsICs = async (req, res) => {
   try {
      const { time } = req.query;

      let Model;

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
            Model = BeatICDay; // fallback
      }

      const beatsICs = await Model.find({});

      res.status(200).json({
         count: beatsICs.length,
         beatsICs
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};
