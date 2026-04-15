/**
 * Archivo: BeatICMonth.js
 * Descripción: Modelo de ICs por Beat del último mes.
 */

const mongoose = require('mongoose');

const beatICMonthSchema = new mongoose.Schema({
    beat: {
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
    collection: 'IC_BEAT_MONTH'
});

module.exports = mongoose.model('BeatICMonth', beatICMonthSchema);