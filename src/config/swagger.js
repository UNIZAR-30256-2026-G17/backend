/**
 * Archivo: swagger.js
 * Descripción: configuración global de Swagger/OpenAPI.
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
            bearerAuth: {
               type: 'http',
               scheme: 'bearer',
               bearerFormat: 'JWT'
            }
         },
         schemas: {
            LoginInput: {
               type: 'object',
               required: ['email', 'password'],
               properties: {
                  email: {
                     type: 'string',
                     example: 'admin@test.com'
                  },
                  password: {
                     type: 'string',
                     example: '123456'
                  }
               }
            },
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
                     example: 1234
                  }
               }
            },
            AlertInput: {
               type: 'object',
               required: ['description', 'address'],
               properties: {
                  description: {
                     type: 'string',
                     example: 'Robo en la calle Mayor'
                  },
                  address: {
                     type: 'string',
                     example: 'Calle Mayor 10'
                  }
               }
            },
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
         }
      ]
   },
   apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(options);