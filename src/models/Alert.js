/**
 * Archivo: Alert.js
 * Descripción: modelo de alertas.
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
   description: {
      type: String,
      required: true,
      trim: true
   },
   address: {
      type: String,
      required: true,
      trim: true
   },
   location: {
      type: {
         type: String,
         enum: ['Point'],
         default: 'Point'
      },
      coordinates: {
         type: [Number], // [lng, lat]
         required: false
      }
   },
   status: {
      type: String,
      enum: ['pending', 'attended', 'deleted'],
      default: 'pending'
   },
   createdBy: {
      type: mongoose.Schema.Types.String,
      required: true
   },
   confirmations: [
      {
         type: mongoose.Schema.Types.String,
      }
   ],
   discards: [
      {
         type: mongoose.Schema.Types.String,
      }
   ]
}, {
   timestamps: true,
   collection: 'ALERTS'
});

module.exports = mongoose.model('Alert', alertSchema);