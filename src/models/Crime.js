/**
 * Archivo: Crime.js
 * Descripción: modelo flexible para la colección CRIMES.
 * Se utiliza un esquema abierto para trabajar con documentos importados
 * desde procesos externos sin imponer una estructura fija en Mongoose.
 */

const mongoose = require('mongoose');

const crimeSchema = new mongoose.Schema(
   {},
   {
      // Permite almacenar y consultar documentos con estructura flexible
      strict: false,
      collection: 'CRIMES'
   }
);

module.exports = mongoose.model('Crime', crimeSchema);