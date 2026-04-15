/**
 * Archivo: DistrictICMonth.js
 * Descripción: Modelo de ICs por Distrito del último mes.
 */

const mongoose = require('mongoose');

const districtICMonthSchema = new mongoose.Schema({
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
    collection: 'IC_DISTRICT_MONTH'
});

module.exports = mongoose.model('DistrictICMonth', districtICMonthSchema);