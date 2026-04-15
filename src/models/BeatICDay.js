/**
 * Archivo: BeatICDay.js
 * Descripción: Modelo de ICs por Beat del último día.
 */

const mongoose = require('mongoose');

const beatICDaySchema = new mongoose.Schema({
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
    collection: 'IC_BEAT_DAY'
});

module.exports = mongoose.model('BeatICDay', beatICDaySchema);