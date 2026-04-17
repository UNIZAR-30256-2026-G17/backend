/**
 * Archivo: alert.controller.js
 * Descripción: lógica de creación, consulta, actualización e interacción con alertas.
 */

const axios = require('axios');

const logger = require('../config/logger');
const Alert = require('../models/Alert');

/**
 * Crea una nueva alerta a partir de una descripción y una dirección.
 * La dirección se geocodifica antes de almacenar la localización en formato GeoJSON.
 */
exports.createAlert = async (req, res) => {
   try {
      const { description, address } = req.body;

      // Validación de datos obligatorios
      if (!description || !address) {
         return res.status(400).json({
            message: 'description y address son obligatorios'
         });
      }

      // Obtención de coordenadas a partir de la dirección recibida
      const coordinates = await geocodeAddress(address);

      if (!coordinates) {
         return res.status(400).json({
            message: 'No se pudo obtener coordenadas para esta dirección'
         });
      }

      // Creación de la alerta con la localización en formato GeoJSON
      const alert = new Alert({
         description,
         address,
         location: {
            type: 'Point',
            coordinates: [coordinates.lon, coordinates.lat]
         },
         createdBy: req.user.id,
         confirmations: [],
         discards: []
      });

      await alert.save();

      logger.info('Alerta creada correctamente', {
         alertId: alert._id,
         userId: req.user?.id
      });

      res.status(201).json({
         message: 'Alerta creada correctamente',
         alert
      });
   } catch (error) {
      logger.error('Error en createAlert', {
         message: error.message,
         stack: error.stack,
         userId: req.user?.id,
         address: req.body?.address
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Devuelve la lista de alertas, con filtros opcionales por estado y fecha.
 * La respuesta incluye además la interacción del usuario autenticado con cada alerta.
 */
exports.getAlerts = async (req, res) => {
   try {
      const { status, from, to } = req.query;
      const userId = req.user?.id;

      const validStatuses = ['pending', 'attended', 'deleted'];

      // Validación del estado solicitado
      if (status && !validStatuses.includes(status)) {
         return res.status(400).json({
            message: 'Status inválido. Valores permitidos: pending, attended, deleted'
         });
      }

      const filter = {};

      // Filtro por estado
      if (status) {
         filter.status = status;
      }

      // Filtro por rango de fechas de creación
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

      // Consulta ordenada por fecha de creación descendente
      const alerts = await Alert.find(filter).sort({ createdAt: -1 });

      // Enriquecimiento de la respuesta con la interacción del usuario autenticado
      const enriched = alerts.map((alert) => {
         const confirmedByMe = alert.confirmations?.some(
            (u) => u.toString() === userId
         );

         const discardedByMe = alert.discards?.some(
            (u) => u.toString() === userId
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
      logger.error('Error en getAlerts', {
         message: error.message,
         stack: error.stack,
         userId: req.user?.id,
         query: req.query
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Actualiza el estado de una alerta existente.
 */
exports.updateAlertStatus = async (req, res) => {
   try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'attended', 'deleted'];

      // Validación del nuevo estado
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

      logger.info('Estado de alerta actualizado', {
         alertId: id,
         newStatus: status,
         userId: req.user?.id
      });

      res.status(200).json({
         message: 'Estado actualizado correctamente',
         alert
      });
   } catch (error) {
      logger.error('Error en updateAlertStatus', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         requestedStatus: req.body?.status,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Registra la confirmación del usuario autenticado sobre una alerta.
 * Si la había descartado previamente, la acción anterior se revierte.
 */
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

      // No se permite confirmar una alerta eliminada
      if (alert.status === 'deleted') {
         return res.status(400).json({
            message: 'No se puede confirmar una alerta eliminada'
         });
      }

      // El usuario no puede confirmar dos veces la misma alerta
      const alreadyConfirmed = alert.confirmations.some(
         (user) => user.toString() === userId
      );

      if (alreadyConfirmed) {
         return res.status(400).json({
            message: 'Ya has confirmado esta alerta'
         });
      }

      // Si la alerta había sido descartada por el usuario, se revierte esa acción
      alert.discards = alert.discards.filter(
         (user) => user.toString() !== userId
      );

      // Registro de la nueva confirmación
      alert.confirmations.push(userId);

      await alert.save();

      logger.info('Alerta confirmada', {
         alertId: id,
         userId: req.user?.id,
         confirmations: alert.confirmations.length,
         discards: alert.discards.length
      });

      res.status(200).json({
         message: 'Alerta confirmada',
         confirmations: alert.confirmations.length,
         discards: alert.discards.length,
         confirmedByUser: true
      });
   } catch (error) {
      logger.error('Error en confirmAlert', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Registra el descarte del usuario autenticado sobre una alerta.
 * Si la había confirmado previamente, la acción anterior se revierte.
 */
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

      // No se permite descartar una alerta eliminada
      if (alert.status === 'deleted') {
         return res.status(400).json({
            message: 'No se puede descartar una alerta eliminada'
         });
      }

      // El usuario no puede descartar dos veces la misma alerta
      const alreadyDiscarded = alert.discards.some(
         (user) => user.toString() === userId
      );

      if (alreadyDiscarded) {
         return res.status(400).json({
            message: 'Ya has descartado esta alerta'
         });
      }

      // Si la alerta había sido confirmada por el usuario, se revierte esa acción
      alert.confirmations = alert.confirmations.filter(
         (user) => user.toString() !== userId
      );

      // Registro del nuevo descarte
      alert.discards.push(userId);

      await alert.save();

      logger.info('Alerta descartada', {
         alertId: id,
         userId: req.user?.id,
         confirmations: alert.confirmations.length,
         discards: alert.discards.length
      });

      res.status(200).json({
         message: 'Alerta descartada',
         confirmations: alert.confirmations.length,
         discards: alert.discards.length,
         discardedByUser: true
      });
   } catch (error) {
      logger.error('Error en discardAlert', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Elimina la confirmación del usuario autenticado sobre una alerta.
 */
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

      // La confirmación debe existir antes de eliminarse
      const wasConfirmed = alert.confirmations.some(
         (user) => user.toString() === userId
      );

      if (!wasConfirmed) {
         return res.status(400).json({
            message: 'No habías confirmado esta alerta'
         });
      }

      // Eliminación de la confirmación existente
      alert.confirmations = alert.confirmations.filter(
         (user) => user.toString() !== userId
      );

      await alert.save();

      logger.info('Confirmación eliminada', {
         alertId: id,
         userId: req.user?.id,
         confirmations: alert.confirmations.length,
         discards: alert.discards.length
      });

      res.status(200).json({
         message: 'Confirmación eliminada',
         confirmations: alert.confirmations.length,
         discards: alert.discards.length,
         confirmedByUser: false
      });
   } catch (error) {
      logger.error('Error en removeConfirmation', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Elimina el descarte del usuario autenticado sobre una alerta.
 */
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

      // El descarte debe existir antes de eliminarse
      const wasDiscarded = alert.discards.some(
         (user) => user.toString() === userId
      );

      if (!wasDiscarded) {
         return res.status(400).json({
            message: 'No habías descartado esta alerta'
         });
      }

      // Eliminación del descarte existente
      alert.discards = alert.discards.filter(
         (user) => user.toString() !== userId
      );

      await alert.save();

      logger.info('Descarte eliminado', {
         alertId: id,
         userId: req.user?.id,
         confirmations: alert.confirmations.length,
         discards: alert.discards.length
      });

      res.status(200).json({
         message: 'Descarte eliminado',
         confirmations: alert.confirmations.length,
         discards: alert.discards.length,
         discardedByUser: false
      });
   } catch (error) {
      logger.error('Error en removeDiscard', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Elimina definitivamente una alerta ya marcada como deleted.
 */
exports.deleteAlert = async (req, res) => {
   try {
      const { id } = req.params;

      const alert = await Alert.findById(id);

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // Solo se permite el borrado definitivo de alertas marcadas como deleted
      if (alert.status !== 'deleted') {
         return res.status(400).json({
            message: 'Solo se pueden eliminar definitivamente alertas ya marcadas como deleted'
         });
      }

      await Alert.findByIdAndDelete(id);

      logger.info('Alerta eliminada definitivamente', {
         alertId: id,
         userId: req.user?.id
      });

      res.status(200).json({
         message: 'Alerta eliminada definitivamente'
      });
   } catch (error) {
      logger.error('Error en deleteAlert', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Devuelve la información detallada de una alerta concreta.
 * Incluye estadísticas de interacción y el estado de la interacción del usuario autenticado.
 */
exports.getAlertById = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user?.id;

      const alert = await Alert.findById(id)
         .populate('confirmations', '_id')
         .populate('discards', '_id');

      if (!alert) {
         return res.status(404).json({
            message: 'Alerta no encontrada'
         });
      }

      // Comprobación de la interacción del usuario autenticado con la alerta
      const confirmedByUser = alert.confirmations.some(
         (user) => user._id.toString() === userId
      );

      const discardedByUser = alert.discards.some(
         (user) => user._id.toString() === userId
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
      logger.error('Error en getAlertById', {
         message: error.message,
         stack: error.stack,
         alertId: req.params?.id,
         userId: req.user?.id
      });

      res.status(500).json({
         message: 'Error en el servidor'
      });
   }
};

/**
 * Obtiene coordenadas geográficas a partir de una dirección.
 * Se prueban varias variantes de búsqueda para aumentar la probabilidad de éxito.
 */
async function geocodeAddress(address) {
   const variations = [
      address.trim()
   ];

   // Estrategia 1: calle + código postal
   const zipMatches = address.match(/\b\d{5}\b/g);
   const zipCode = zipMatches ? zipMatches[zipMatches.length - 1] : null;
   const parts = address.split(',');
   const streetPart = parts[0].trim();

   if (zipCode && streetPart && streetPart !== address.trim()) {
      variations.push(`${streetPart}, ${zipCode}`);
   }

   // Estrategia 2: calle + condado
   if (!address.toLowerCase().includes('montgomery county') && streetPart) {
      variations.push(`${streetPart}, Montgomery County, MD`);
   }

   for (const query of variations) {
      try {
         const response = await axios.get(
            'https://nominatim.openstreetmap.org/search',
            {
               params: {
                  q: query,
                  format: 'json',
                  limit: 1,
                  addressdetails: 1
               },
               headers: {
                  'User-Agent': 'montgomery-app/1.0 (874055@unizar.es)'
               }
            }
         );

         if (response.data && response.data.length > 0) {
            return {
               lat: parseFloat(response.data[0].lat),
               lon: parseFloat(response.data[0].lon)
            };
         }
      } catch (error) {
         logger.error('Error en geocodificación', {
            query,
            message: error.message,
            stack: error.stack
         });
      }
   }

   return null;
}