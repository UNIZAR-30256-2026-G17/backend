/**
 * Archivo: auth.controller.js
 * Descripción: lógica de autenticación y gestión de sesión de usuarios.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const logger = require('../config/logger');
const User = require('../models/User');

/**
 * Registra un nuevo usuario con rol admin o police.
 */
exports.register = async (req, res) => {
   try {
      const { email, password, role, badge_number } = req.body;

      // Validación de campos obligatorios
      if (!email || !password || !role) {
         return res.status(400).json({
            message: 'Email, password y role son obligatorios'
         });
      }

      // Validación de roles permitidos en el sistema
      if (!['police', 'admin'].includes(role)) {
         return res.status(400).json({
            message: 'Rol inválido'
         });
      }

      // El badge_number es obligatorio para police
      if (role === 'police' && !badge_number) {
         return res.status(400).json({
            message: 'badge_number es obligatorio para policía'
         });
      }

      // Un admin no debe tener badge_number
      if (role === 'admin' && badge_number) {
         return res.status(400).json({
            message: 'admin no debe tener badge_number'
         });
      }

      // El badge_number debe ser único entre usuarios police
      if (role === 'police') {
         const existingBadge = await User.findOne({
            role: 'police',
            badge_number: badge_number
         });

         if (existingBadge) {
            return res.status(400).json({
               message: 'Ya existe un policía con ese badge_number'
            });
         }
      }

      // El email no puede repetirse
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({
            message: 'El usuario ya existe'
         });
      }

      // Cifrado de la contraseña antes de guardar el usuario
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creación del nuevo usuario
      const user = new User({
         email,
         password: hashedPassword,
         role,
         badge_number: role === 'police' ? badge_number : null
      });

      await user.save();

      logger.info('Usuario registrado', {
         userId: user._id,
         email: user.email,
         role: user.role
      });

      res.status(201).json({
         message: 'Usuario creado correctamente',
         user: {
            id: user._id,
            email: user.email,
            role: user.role,
            badge_number: user.badge_number
         }
      });
   } catch (error) {
      logger.error('Error en register', {
         message: error.message,
         stack: error.stack,
         email: req.body?.email,
         role: req.body?.role
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Autentica a un usuario registrado y devuelve un token JWT.
 */
exports.login = async (req, res) => {
   try {
      const { email, password, role } = req.body;

      // Validación de campos obligatorios
      if (!email || !password || !role) {
         return res.status(400).json({
            message: 'Email, contraseña y role son obligatorios'
         });
      }

      // Búsqueda del usuario por email
      const user = await User.findOne({ email });
      if (!user) {
         return res.status(400).json({
            message: 'Credenciales inválidas'
         });
      }

      // Verificación de que el rol enviado coincide con el rol almacenado
      if (role && user.role !== role) {
         return res.status(403).json({
            message: 'No tienes permisos para acceder desde este login'
         });
      }

      // Verificación de la contraseña cifrada
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(400).json({
            message: 'Credenciales inválidas'
         });
      }

      // Generación del token JWT de sesión
      const token = jwt.sign(
         {
            id: user._id,
            email: user.email,
            role: user.role
         },
         process.env.JWT_SECRET,
         { expiresIn: '8h' }
      );

      logger.info('Login correcto', {
         userId: user._id,
         email: user.email,
         role: user.role
      });

      res.status(200).json({
         message: 'Login correcto',
         token
      });
   } catch (error) {
      logger.error('Error en login', {
         message: error.message,
         stack: error.stack,
         email: req.body?.email,
         role: req.body?.role
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Genera un token JWT para acceso anónimo.
 */
exports.anonymousLogin = async (req, res) => {
   try {
      const { deviceId } = req.body;

      // Si no se recibe un identificador externo, se genera uno automáticamente
      const id = deviceId || uuidv4();

      const token = jwt.sign(
         {
            id,
            role: 'anonymous'
         },
         process.env.JWT_SECRET,
         { expiresIn: '30d' }
      );

      logger.info('Login anónimo correcto', {
         anonymousId: id
      });

      res.status(200).json({
         message: 'Login anónimo correcto',
         token,
         user: {
            id,
            role: 'anonymous'
         }
      });
   } catch (error) {
      logger.error('Error en anonymousLogin', {
         message: error.message,
         stack: error.stack
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Devuelve la información del usuario autenticado.
 */
exports.me = async (req, res) => {
   try {
      // El identificador del usuario se obtiene del token validado por el middleware
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
         return res.status(404).json({
            message: 'Usuario no encontrado'
         });
      }

      res.status(200).json({
         user
      });
   } catch (error) {
      logger.error('Error en me', {
         message: error.message,
         stack: error.stack,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Cierra la sesión lógica del usuario autenticado.
 * La eliminación efectiva del token se realiza en el cliente.
 */
exports.logout = async (req, res) => {
   try {
      logger.info('Logout correcto', {
         userId: req.user?.id
      });

      res.status(200).json({
         message: 'Logout correcto'
      });
   } catch (error) {
      logger.error('Error en logout', {
         message: error.message,
         stack: error.stack,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};