/**
 * Archivo: User.js
 * Descripción: modelo de datos de los usuarios almacenados en la colección USERS.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         lowercase: true
      },

      // Contraseña cifrada del usuario
      password: {
         type: String,
         required: true
      },

      // Rol funcional del usuario dentro del sistema
      role: {
         type: String,
         enum: ['police', 'admin']
      },

      // Identificador operativo del usuario cuando su rol es police
      badge_number: {
         type: Number,
         default: null
      },

      // Estado de la cuenta dentro del sistema
      status: {
         type: String,
         enum: ['active', 'blocked'],
         default: 'active'
      }
   },
   {
      timestamps: true,
      collection: 'USERS'
   }
);

module.exports = mongoose.model('User', userSchema);