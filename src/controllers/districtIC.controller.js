/**
 * Archivo: districtIC.controller.js
 * Descripción: lógica de ICs por Distrito.
 */

const DistrictICDay = require('../models/DistrictICDay');
const DistrictICMonth = require('../models/DistrictICMonth');
const DistrictICYear = require('../models/DistrictICYear');
const DistrictICThreeYear = require('../models/DistrictICThreeYear');

exports.getDistrictsICs = async (req, res) => {
   try {
      const { time } = req.query;

      let Model;

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
            Model = DistrictICDay; // fallback
      }

      const districtsICs = await Model.find({});

      res.status(200).json({
         count: districtsICs.length,
         districtsICs
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};
