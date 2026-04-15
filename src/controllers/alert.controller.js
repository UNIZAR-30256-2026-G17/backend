/**
 * Archivo: alert.controller.js
 * Descripción: lógica de alertas.
 */

const Alert = require('../models/Alert');
const axios = require('axios');

exports.createAlert = async (req, res) => {
   try {
      const { description, address } = req.body;

      // Validación
      if (!description || !address) {
         return res.status(400).json({
            message: 'description y address son obligatorios'
         });
      }

      // Geocodificar la dirección
      const coordinates = await geocodeAddress(address);

      if (!coordinates) {
         return res.status(400).json({
            message: 'No se pudo obtener coordenadas para esta dirección'
         });
      }

      const alert = new Alert({
         description,
         address,
         location: {
            type: 'Point',
            coordinates: [coordinates.lon, coordinates.lat] // GeoJSON: [lng, lat]
         },
         createdBy: req.user.id,
         confirmations: [],
         discards: [],
      });

      await alert.save();

      res.status(201).json({
         message: 'Alerta creada correctamente',
         alert
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.getAlerts = async (req, res) => {
   try {
      const { status, from, to } = req.query;
      const userId = req.user?.id;

      const validStatuses = ['pending', 'attended', 'deleted'];

      // Validación de status
      if (status && !validStatuses.includes(status)) {
         return res.status(400).json({
            message: 'Status inválido. Valores permitidos: pending, attended, deleted'
         });
      }

      let filter = {};

      // Filtro por status
      if (status) {
         filter.status = status;
      }

      // Filtro por fechas
      if (from || to) {
         filter.createdAt = {};

         if (from) {
            filter.createdAt.$gte = new Date(from);
         }

         if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
         }
      }

      const alerts = await Alert.find(filter)
         .sort({ createdAt: -1 });

      // Enriquecer la respuesta para saber si el usuario ya la ya confirmado o descartado
      const enriched = alerts.map(alert => {
         const confirmedByMe = alert.confirmations?.some(
            u => u.toString() === userId
         );

         const discardedByMe = alert.discards?.some(
            u => u.toString() === userId
         );

         return {
            ...alert.toObject(),
            confirmedByMe,
            discardedByMe
         };
      });

      res.status(200).json({
         count: alerts.length,
         alerts: enriched
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.updateAlertStatus = async (req, res) => {
   try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'attended', 'deleted'];

      // Validación
      if (!status || !validStatuses.includes(status)) {
         return res.status(400).json({
            message: 'Status inválido. Valores permitidos: pending, attended, deleted'
         });
      }

      const alert = await Alert.findByIdAndUpdate(
         id,
         { status },
         { new: true, runValidators: true }
      );

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      alert.status = status;
      await alert.save();

      res.status(200).json({
         message: 'Estado actualizado correctamente',
         alert
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.confirmAlert = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // No permitir si está eliminada
      if (alert.status === 'deleted') {
         return res.status(400).json({
            message: 'No se puede confirmar una alerta eliminada'
         });
      }

      // Comprobar si ya confirmó
      const alreadyConfirmed = alert.confirmations.some(
         user => user.toString() === userId
      );

      if (alreadyConfirmed) {
         return res.status(400).json({
            message: 'Ya has confirmado esta alerta'
         });
      }

      // Quitar de discards si estaba
      alert.discards = alert.discards.filter(
         user => user.toString() !== userId
      );

      // Añadir a confirmations
      alert.confirmations.push(userId);

      await alert.save();

      res.status(200).json({
         message: 'Alerta confirmada',
         confirmations: alert.confirmations.length,
         confirmedByUser: true
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.discardAlert = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // No permitir si está eliminada
      if (alert.status === 'deleted') {
         return res.status(400).json({
            message: 'No se puede descartar una alerta eliminada'
         });
      }

      // Comprobar si ya descartó
      const alreadyDiscarded = alert.discards.some(
         user => user.toString() === userId
      );

      if (alreadyDiscarded) {
         return res.status(400).json({
            message: 'Ya has descartado esta alerta'
         });
      }

      // Quitar de confirmations si estaba
      alert.confirmations = alert.confirmations.filter(
         user => user.toString() !== userId
      );

      // Añadir a discards
      alert.discards.push(userId);

      await alert.save();

      res.status(200).json({
         message: 'Alerta descartada',
         discards: alert.discards.length,
         discardedByUser: true
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.removeConfirmation = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // Comprobar si había confirmado
      const wasConfirmed = alert.confirmations.some(
         user => user.toString() === userId
      );

      if (!wasConfirmed) {
         return res.status(400).json({
            message: 'No habías confirmado esta alerta'
         });
      }

      // Eliminar confirmación
      alert.confirmations = alert.confirmations.filter(
         user => user.toString() !== userId
      );

      await alert.save();

      res.status(200).json({
         message: 'Confirmación eliminada',
         confirmations: alert.confirmations.length,
         confirmedByUser: false
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.removeDiscard = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // Comprobar si había descartado
      const wasDiscarded = alert.discards.some(
         user => user.toString() === userId
      );

      if (!wasDiscarded) {
         return res.status(400).json({
            message: 'No habías descartado esta alerta'
         });
      }

      // Eliminar descarte
      alert.discards = alert.discards.filter(
         user => user.toString() !== userId
      );

      await alert.save();

      res.status(200).json({
         message: 'Descarte eliminado',
         discards: alert.discards.length,
         discardedByUser: false
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.deleteAlert = async (req, res) => {
   try {
      const { id } = req.params;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      if (alert.status !== 'deleted') {
         return res.status(400).json({
            message: 'Solo se pueden eliminar definitivamente alertas ya marcadas como deleted'
         });
      }

      await Alert.findByIdAndDelete(id);

      res.status(200).json({
         message: 'Alerta eliminada definitivamente'
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

exports.getAlertById = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user?.id; // opcional si no hay auth

      const alert = await Alert.findById(id)
         .populate('confirmations', '_id')
         .populate('discards', '_id');

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // Comprobar estado del usuario actual
      const confirmedByUser = alert.confirmations.some(
         user => user._id.toString() === userId
      );

      const discardedByUser = alert.discards.some(
         user => user._id.toString() === userId
      );

      res.status(200).json({
         alert,
         stats: {
            confirmations: alert.confirmations.length,
            discards: alert.discards.length
         },
         userInteraction: {
            confirmedByUser,
            discardedByUser
         }
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

// Auxiliary function to obtain coordinates (lat, lon) given an adress
async function geocodeAddress(address) {
   try {
      const response = await axios.get(
         'https://nominatim.openstreetmap.org/search',
         {
            params: {
               q: address,
               format: 'json',
               limit: 1,
            },
            headers: {
               'User-Agent': 'alert-system-app/1.0',
            }
         }
      );

      if (!response.data || response.data.length === 0) {
         return null;
      }

      return {
         lat: parseFloat(response.data[0].lat),
         lon: parseFloat(response.data[0].lon),
      };

   } catch (error) {
      console.error('Geocoding error:', error.message);
      return null;
   }
};