/**
 * Archivo: Crime.js
 * Descripción: modelo flexible para la colección CRIMES.
 */

const mongoose = require('mongoose');

const crimeSchema = new mongoose.Schema({}, {
   strict: false,
   collection: 'CRIMES'
});

module.exports = mongoose.model('Crime', crimeSchema);