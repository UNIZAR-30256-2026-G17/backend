/**
 * Archivo: Alert.js
 * Descripción: modelo de datos de las alertas almacenadas en la colección ALERTS.
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
   {
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

      // Localización en formato GeoJSON
      location: {
         type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
         },
         coordinates: {
            type: [Number], // [longitud, latitud]
            required: false
         }
      },

      // Estado funcional de la alerta dentro del sistema
      status: {
         type: String,
         enum: ['pending', 'attended', 'deleted'],
         default: 'pending'
      },

      // Identificador del usuario que creó la alerta
      createdBy: {
         type: mongoose.Schema.Types.String,
         required: true
      },

      // Identificadores de usuarios que han confirmado la alerta
      confirmations: [
         {
            type: mongoose.Schema.Types.String
         }
      ],

      // Identificadores de usuarios que han descartado la alerta
      discards: [
         {
            type: mongoose.Schema.Types.String
         }
      ]
   },
   {
      timestamps: true,
      collection: 'ALERTS'
   }
);

module.exports = mongoose.model('Alert', alertSchema);