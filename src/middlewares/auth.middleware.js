/**
 * Archivo: auth.middleware.js
 * Descripción: valida el token JWT enviado en la petición y carga
 * la información básica del usuario autenticado en req.user.
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
   try {
      let token = null;
      const authHeader = req.headers.authorization;

      // Formato estándar: Authorization: Bearer <token>
      if (authHeader && authHeader.startsWith('Bearer ')) {
         token = authHeader.split(' ')[1];
      }

      // Compatibilidad con clientes que envían el token en la cabecera "token"
      if (!token && req.headers.token) {
         token = req.headers.token;
      }

      // La petición debe incluir un token válido
      if (!token) {
         return res.status(401).json({
            message: 'No autorizado: token no proporcionado'
         });
      }

      // Verificación del token y extracción de los datos del usuario
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