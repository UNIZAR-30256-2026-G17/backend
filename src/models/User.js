/**
 * Archivo: User.js
 * Descripción: modelo de usuario para MongoDB.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
   },
   password: {
      type: String,
      required: true
   },
   role: {
      type: String,
      enum: ['citizen', 'police', 'admin'],
      default: 'citizen'
   },
   badge_number: {
      type: Number,
      default: null
   },
   status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
   }
}, {
   timestamps: true,
   collection: 'USERS'
});

module.exports = mongoose.model('User', userSchema);