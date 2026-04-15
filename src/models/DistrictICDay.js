/**
 * Archivo: DistrictICDay.js
 * Descripción: Modelo de ICs por Distrito del último día.
 */

const mongoose = require('mongoose');

const districtICDaySchema = new mongoose.Schema({
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
    collection: 'IC_DISTRICT_DAY'
});

module.exports = mongoose.model('DistrictICDay', districtICDaySchema);