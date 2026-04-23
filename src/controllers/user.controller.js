/**
 * Archivo: user.controller.js
 * Descripción: lógica de gestión de usuarios.
 */

const logger = require('../config/logger');
const User = require('../models/User');

/**
 * Devuelve la lista de usuarios del sistema sin incluir la contraseña.
 */
exports.getUsers = async (req, res) => {
   try {
      // Consulta de usuarios excluyendo campos sensibles o internos
      const users = await User.find({})
         .select('-password -__v')
         .sort({ createdAt: -1 });

      logger.info('Consulta de usuarios realizada', {
         count: users.length,
         requestedBy: req.user?.id
      });

      return res.status(200).json({
         count: users.length,
         users
      });
   } catch (error) {
      logger.error('Error en getUsers', {
         message: error.message,
         stack: error.stack,
         requestedBy: req.user?.id
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Elimina definitivamente un usuario de la base de datos.
 * Un administrador no puede eliminar su propia cuenta.
 */
exports.deleteUser = async (req, res) => {
   try {
      const { id } = req.params;

      // Comprobación de existencia del usuario
      const user = await User.findById(id);

      if (!user) {
         return res.status(404).json({
            message: 'Usuario no encontrado'
         });
      }

      // Un administrador no puede eliminar su propia cuenta
      if (req.user.id === id) {
         return res.status(400).json({
            message: 'No puedes eliminar tu propio usuario'
         });
      }

      // Eliminación definitiva del usuario
      await User.findByIdAndDelete(id);

      logger.info('Usuario eliminado definitivamente', {
         deletedUserId: id,
         performedBy: req.user?.id
      });

      return res.status(200).json({
         message: 'Usuario eliminado definitivamente'
      });
   } catch (error) {
      logger.error('Error en deleteUser', {
         message: error.message,
         stack: error.stack,
         deletedUserId: req.params?.id,
         performedBy: req.user?.id
      });

      return res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};