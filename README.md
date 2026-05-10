# MontgomeryApp - Backend

Backend de la aplicación desarrollado con **Node.js + Express + MongoDB (Atlas)**.

Incluye:

* Autenticación con JWT
* Control de acceso por roles
* Gestión de usuarios
* Gestión de alertas
* Gestión de delitos
* Consultas agregadas de índices de criminalidad
* Logging con Winston
* Configuración de CORS
* Documentación interactiva con Swagger
* Tests automáticos con cobertura

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
FRONTEND_URL=http://localhost:8081
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

Swagger permite:

* Ver todos los endpoints disponibles.
* Consultar parámetros, cuerpos de petición y respuestas.
* Probar peticiones directamente desde el navegador.
* Enviar tokens JWT mediante el botón `Authorize`.

---

# Tests y cobertura

El backend incluye una suite de tests automáticos implementada con **Jest**, **Supertest** y **mongodb-memory-server**.

Los tests cubren:

* Rutas
* Controladores
* Middlewares
* Modelos
* Flujos de autenticación
* Gestión de usuarios
* Gestión de delitos
* Gestión de alertas
* Consultas de ICs por beat
* Consultas de ICs por distrito

Durante los tests no se utiliza MongoDB Atlas. La base de datos se levanta en memoria mediante `mongodb-memory-server`.

Además, las llamadas externas necesarias, como la geocodificación de alertas mediante `axios`, se mockean para evitar dependencias externas durante la ejecución de los tests.

## Ejecutar tests

```bash
npm test
```

## Ejecutar tests con cobertura

```bash
npm run test:coverage
```

## Umbral mínimo de cobertura

El proyecto tiene configurado un umbral mínimo global del **75%** para:

* Statements
* Branches
* Functions
* Lines

Si la cobertura baja de ese umbral, el comando de cobertura fallará.

## Resultado actual de cobertura

Último resultado obtenido:

```text
Test Suites: 11 passed, 11 total
Tests: 121 passed, 121 total

Statements: 90.32%
Branches: 88.68%
Functions: 94.33%
Lines: 90.26%
```

---

# Estructura del proyecto

```bash
backend/
├── src/
│   ├── config/        # Configuración global, Swagger y logger
│   ├── controllers/   # Lógica de negocio
│   ├── middlewares/   # Autenticación, roles y logging de peticiones
│   ├── models/        # Modelos de MongoDB
│   ├── routes/        # Definición de rutas
│   ├── app.js         # Configuración de Express
│   └── server.js      # Entrada del servidor y conexión a MongoDB
├── test/
│   ├── middlewares/   # Tests de middlewares
│   ├── mocks/         # Mocks usados durante los tests
│   ├── routes/        # Tests de endpoints
│   ├── app.test.js
│   ├── db-connection.test.js
│   └── setup.js       # Configuración global de Jest
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```
