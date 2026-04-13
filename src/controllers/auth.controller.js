/**
 * Archivo: auth.controller.js
 * Descripción: define las funciones del controlador de autenticación.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
   try {
      const { email, password, role, badge_number } = req.body;

      // Validación básica
      if (!email || !password || !role) {
         return res.status(400).json({
            message: 'Email, password y role son obligatorios'
         });
      }

      // Validación de rol
      if (!['police', 'admin'].includes(role)) {
         return res.status(400).json({
            message: 'Rol inválido'
         });
      }

      // VALIDACIONES CLAVE
      if (role === 'police' && !badge_number) {
         return res.status(400).json({
            message: 'badge_number es obligatorio para policía'
         });
      }

      if (role === 'admin' && badge_number) {
         return res.status(400).json({
            message: 'admin no debe tener badge_number'
         });
      }

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

      // Verificar usuario existente
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({
            message: 'El usuario ya existe'
         });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = new User({
         email,
         password: hashedPassword,
         role,
         badge_number: role === 'police' ? badge_number : null
      });

      await user.save();

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
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.login = async (req, res) => {
   try {
      const { email, password } = req.body;

      // Validación básica
      if (!email || !password) {
         return res.status(400).json({
            message: 'Email y contraseña son obligatorios'
         });
      }

      // Buscar usuario
      const user = await User.findOne({ email });

      if (!user) {
         return res.status(400).json({
            message: 'Credenciales inválidas'
         });
      }

      // Comparar contraseña
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
         return res.status(400).json({
            message: 'Credenciales inválidas'
         });
      }

      // Generar token
      const token = jwt.sign(
         {
            id: user._id,
            email: user.email,
            role: user.role
         },
         process.env.JWT_SECRET,
         { expiresIn: '8h' }
      );

      res.status(200).json({
         message: 'Login correcto',
         token
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.me = async (req, res) => {
   try {
      // req.user viene del token
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
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.logout = async (req, res) => {
   try {
      res.status(200).json({
         message: 'Logout correcto'
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};