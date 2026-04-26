# MontgomeryApp - Backend

Backend de la aplicación desarrollado con **Node.js + Express + MongoDB (Atlas)**.

Incluye:

* Autenticación con JWT
* Gestión de alertas
* Integración con datos externos (KNIME)
* Documentación con Swagger

---

# Instalación

Instala todas las dependencias del proyecto:

```bash
npm install
```

---

# Configuración

Crea un archivo `.env` en la raíz del repositorio con el siguiente contenido:

```env
PORT=3000
MONGODB_URI=uri_de_mongodb
JWT_SECRET=clave_secreta
```

---

# Ejecutar el proyecto

Modo desarrollo (con nodemon):

```bash
npm run dev
```

Servidor disponible (en desarrollo) en:

```text
http://localhost:3000
```

Servidor disponible (en producción) en:

```text
https://backend-9u99.onrender.com
```
---

# Documentación API (Swagger)

Accede a la documentación interactiva (en desarrollo) en:

```text
http://localhost:3000/api-docs
```

Accede a la documentación interactiva (en producción) en:

```text
https://backend-9u99.onrender.com/api-docs
```

Permite:

* Ver todos los endpoints
* Probar peticiones directamente
* Enviar tokens JWT

---

# Endpoints principales

## Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`
* POST `/api/auth/logout`

## Alerts

* POST `/api/alerts`
* GET `/api/alerts`
* GET `/api/alerts/{id}`
* PATCH `/api/alerts/{id}`
* DELETE `/api/alerts/{id}`

### Interacciones

* POST `/api/alerts/{id}/confirmations`
* DELETE `/api/alerts/{id}/confirmations`
* POST `/api/alerts/{id}/discards`
* DELETE `/api/alerts/{id}/discards`

## Crimes

* GET `/api/crimes` *(pendiente)*

---

# Estructura del proyecto

```bash
backend/
├── src/
│   ├── config/        # Configuración (Swagger, DB)
│   ├── controllers/   # Lógica de negocio
│   ├── middlewares/   # Autenticación y roles
│   ├── models/        # Modelos de MongoDB
│   ├── routes/        # Definición de rutas
│   ├── app.js         # Configuración de Express
│   └── server.js      # Entrada del servidor
├── .env
├── package.json
└── README.md
```
