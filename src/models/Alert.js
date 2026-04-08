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
   status: {
      type: String,
      enum: ['pending', 'attended', 'deleted'],
      default: 'pending'
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   confirmations: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      }
   ],
   discards: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      }
   ]
}, {
   timestamps: true,
   collection: 'ALERTS'
});

module.exports = mongoose.model('Alert', alertSchema);