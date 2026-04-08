/**
 * Archivo: role.middleware.js
 * Descripción: middleware para controlar acceso por roles.
 */

const roleMiddleware = (...allowedRoles) => {
   return (req, res, next) => {
      try {
         const user = req.user;

         if (!user || !user.role) {
            return res.status(401).json({
               message: 'No autorizado: usuario no autenticado'
            });
         }

         if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
               message: 'Acceso denegado: permisos insuficientes'
            });
         }

         next();

      } catch (error) {
         return res.status(500).json({
            message: 'Error en la autorización'
         });
      }
   };
};

module.exports = roleMiddleware;