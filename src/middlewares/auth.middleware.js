/**
 * Archivo: auth.middleware.js
 * Descripción: middleware para verificar el token JWT de autenticación.
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
   try {
      let token = null;

      // Formato estándar: Authorization: Bearer <token>
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
         token = authHeader.split(' ')[1];
      }

      // Compatibilidad con la especificación actual de la issue: header "token"
      if (!token && req.headers.token) {
         token = req.headers.token;
      }

      if (!token) {
         return res.status(401).json({
            message: 'No autorizado: token no proporcionado'
         });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
         id: decoded.id,
         email: decoded.email,
         role: decoded.role
      };

      next();
   } catch (error) {
      return res.status(401).json({
         message: 'No autorizado: token inválido o expirado'
      });
   }
};

module.exports = authMiddleware;