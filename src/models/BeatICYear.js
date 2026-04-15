/**
 * Archivo: BeatICYear.js
 * Descripción: Modelo de ICs por Beat del último año.
 */

const mongoose = require('mongoose');

const beatICYearSchema = new mongoose.Schema({
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
    collection: 'IC_BEAT_YEAR'
});

module.exports = mongoose.model('BeatICYear', beatICYearSchema);