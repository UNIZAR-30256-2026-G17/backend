/**
 * Archivo: user.controller.js
 * Descripción: lógica de gestión de usuarios.
 */

const User = require('../models/User');

exports.deleteUser = async (req, res) => {
   try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
         return res.status(404).json({
            message: 'Usuario no encontrado'
         });
      }

      // No permitir que un usuario elimine su propia cuenta
      if (req.user.id === id) {
         return res.status(400).json({
            message: 'No puedes eliminar tu propio usuario'
         });
      }

      await User.findByIdAndDelete(id);

      return res.status(200).json({
         message: 'Usuario eliminado definitivamente'
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};