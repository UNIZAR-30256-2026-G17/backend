/**
 * Archivo: DistrictICYear.js
 * Descripción: Modelo de ICs por Distrito del último año.
 */

const mongoose = require('mongoose');

const districtICYearSchema = new mongoose.Schema({
    district: {
        type: String,
        required: true,
        trim: true
    },
    id: {
        type: Number,
        required: true,
    },
}, {
    timestamps: false,
    collection: 'IC_DISTRICT_YEAR'
});

module.exports = mongoose.model('DistrictICYear', districtICYearSchema);