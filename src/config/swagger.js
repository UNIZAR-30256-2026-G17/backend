/**
 * Archivo: swagger.js
 * Descripción: configuración global de Swagger/OpenAPI para la documentación
 * interactiva del backend.
 */

const swaggerJsDoc = require('swagger-jsdoc');

const options = {
   definition: {
      openapi: '3.0.0',

      info: {
         title: 'API Proyecto STW Grupo 17',
         version: '1.0.0',
         description: 'Documentación del backend del proyecto de Sistemas y Tecnologías Web'
      },

      servers: [
         {
            url: 'http://localhost:3000/api',
            description: 'Servidor local'
         }
      ],

      components: {
         securitySchemes: {
            // Autenticación mediante token JWT enviado en la cabecera Authorization
            bearerAuth: {
               type: 'http',
               scheme: 'bearer',
               bearerFormat: 'JWT',
               description: 'Introduce el token JWT con el formato: Bearer <token>'
            }
         },

         schemas: {
            // Credenciales de acceso de usuarios registrados
            LoginInput: {
               type: 'object',
               required: ['email', 'password', 'role'],
               properties: {
                  email: {
                     type: 'string',
                     example: 'admin_prueba_1@test.com'
                  },
                  password: {
                     type: 'string',
                     example: '123456'
                  },
                  role: {
                     type: 'string',
                     enum: ['admin', 'police'],
                     example: 'admin'
                  }
               }
            },

            // Entrada opcional para acceso anónimo
            LoginAnonymousInput: {
               type: 'object',
               properties: {
                  deviceId: {
                     type: 'string',
                     example: 'dispositivo-demo-001'
                  }
               }
            },

            // Datos de registro de un nuevo usuario
            RegisterInput: {
               type: 'object',
               required: ['email', 'password', 'role'],
               properties: {
                  email: {
                     type: 'string',
                     example: 'admin@test.com'
                  },
                  password: {
                     type: 'string',
                     example: '123456'
                  },
                  role: {
                     type: 'string',
                     enum: ['admin', 'police'],
                     example: 'admin'
                  },
                  badge_number: {
                     type: 'integer',
                     nullable: true,
                     description: 'Obligatorio si el rol es police. Debe ser null si el rol es admin.',
                     example: 1234
                  }
               }
            },

            // Datos necesarios para crear una alerta
            AlertInput: {
               type: 'object',
               required: ['description', 'address'],
               properties: {
                  description: {
                     type: 'string',
                     example: 'Robo en la carretera'
                  },
                  address: {
                     type: 'string',
                     example: '9801 Centerway Rd, Montgomery Village, MD 20886, Estados Unidos'
                  }
               }
            },

            // Estado permitido para una alerta
            AlertStatusInput: {
               type: 'object',
               required: ['status'],
               properties: {
                  status: {
                     type: 'string',
                     enum: ['pending', 'attended', 'deleted'],
                     example: 'attended'
                  }
               }
            },

            // Estado permitido para un delito
            CrimeStatusInput: {
               type: 'object',
               required: ['status'],
               properties: {
                  status: {
                     type: 'string',
                     enum: ['available', 'deleted'],
                     example: 'deleted'
                  }
               }
            }
         }
      },

      tags: [
         {
            name: 'Auth',
            description: 'Endpoints de autenticación'
         },
         {
            name: 'Alerts',
            description: 'Endpoints de alertas'
         },
         {
            name: 'Crimes',
            description: 'Endpoints de delitos'
         },
         {
            name: 'ICBeat',
            description: 'Endpoints de índices de criminalidad por beat'
         },
         {
            name: 'ICDistrict',
            description: 'Endpoints de índices de criminalidad por distrito'
         },
         {
            name: 'Users',
            description: 'Endpoints de gestión de usuarios'
         }
      ]
   },

   // Archivos donde Swagger buscará anotaciones @swagger
   apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(options);