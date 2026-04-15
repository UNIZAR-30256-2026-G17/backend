/**
 * Archivo: BeatICThreeYear.js
 * Descripción: Modelo de ICs por Beat de los últimos 3 años.
 */

const mongoose = require('mongoose');

const beatICThreeYearSchema = new mongoose.Schema({
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
    collection: 'IC_BEAT_THREE_YEAR'
});

module.exports = mongoose.model('BeatICThreeYear', beatICThreeYearSchema);