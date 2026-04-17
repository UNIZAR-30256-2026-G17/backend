/**
 * Archivo: role.middleware.js
 * Descripción: comprueba que el usuario autenticado tenga uno de los
 * roles permitidos para acceder a una ruta.
 */

const roleMiddleware = (...allowedRoles) => {
   return (req, res, next) => {
      try {
         const user = req.user;

         // La validación de rol requiere un usuario autenticado previamente
         if (!user || !user.role) {
            return res.status(401).json({
               message: 'No autorizado: usuario no autenticado'
            });
         }

         // El rol del usuario debe estar incluido en los roles permitidos
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