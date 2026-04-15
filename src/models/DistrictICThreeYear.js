/**
 * Archivo: DistrictICThreeYear.js
 * Descripción: Modelo de ICs por Distrito de los últimos 3 años.
 */

const mongoose = require('mongoose');

const districtICThreeYearSchema = new mongoose.Schema({
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
    collection: 'IC_DISTRICT_THREE_YEAR'
});

module.exports = mongoose.model('DistrictICThreeYear', districtICThreeYearSchema);