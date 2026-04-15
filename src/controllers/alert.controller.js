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
      const { status, from, to, userId } = req.query;
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

      const enriched = alerts.map(alert => ({
         ...alert.toObject(),
         confirmedByMe: alert.confirmations.includes(userId),
         discardedByMe: alert.discards.includes(userId),
      }));

      res.status(200).json({
         count: alerts.length,
         enriched
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
      const { userId } = req.body;

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

      // No permitir si el usuario ya la había confirmado
      if (alert.confirmations.includes(userId)) {
         return res.status(200).json({
            message: 'Ya confirmada',
            confirmations: alert.confirmations.length,
            discards: alert.discards.length,
         });
      }

      // Si la había descartado, lo borramos
      alert.discards = alert.discards.filter(id => id !== userId);

      // Añadimos la confirmation
      alert.confirmations.push(userId);

      await alert.save();

      res.status(200).json({
         message: 'Alerta confirmada',
         confirmations: alert.confirmations.length,
         discards: alert.discards.length,
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
      const { userId } = req.body;

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

      // No permitir si el usuario ya la había descartado
      if (alert.discards.includes(userId)) {
         return res.status(200).json({
            message: 'Ya descartada',
            discards: alert.discards.length,
            confirmations: alert.confirmations.length
         });
      }

      // Si la había confirmado, lo borramos
      alert.confirmations = alert.confirmations.filter(id => id !== userId);

      // Añadir la discard
      alert.discards.push(userId);

      await alert.save();

      res.status(200).json({
         message: 'Alerta descartada',
         discards: alert.discards.length,
         confirmations: alert.confirmations.length,
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

      const alert = await Alert.findById(id)
         .populate('confirmations', '_id')
         .populate('discards', '_id');

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      res.status(200).json({
         alert,
         stats: {
            confirmations: alert.confirmations.length,
            discards: alert.discards.length,
         },
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
}