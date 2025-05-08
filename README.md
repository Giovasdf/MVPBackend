# MediBot - Backend (Node.js)

Este es el repositorio del backend para el proyecto **MediBot**, un sistema SaaS para la gestión automatizada de pedidos en farmacias a través de WhatsApp e inteligencia artificial.

## 🚀 Descripción del Proyecto
El backend de MediBot está desarrollado en Node.js con el framework Express.js. Su principal función es gestionar las conversaciones y la interacción con la inteligencia artificial, proporcionando las APIs necesarias para la URL de health y webhook.

Este repositorio contiene el servidor backend y la lógica para interactuar con Pocketbase.

## 🛠️ Tecnologías Utilizadas
- **Node.js**
- **Express.js**
- **Twilio** (para la integración con WhatsApp)
- **PocketBase** (base de datos para el almacenamiento de usuarios y pedidos)
- **Mistral 7B** (AI para recomendaciones inteligentes)
- **Vitest** (para pruebas unitarias)

## 🔧 Instalación
Para poder correr este proyecto en tu máquina local, sigue estos pasos:
1. Clona este repositorio:
```bash
git clone https://github.com/Giovasdf/MVPProyectoTitulo.git
```
2. Entra en el directorio del proyecto:
```bash
cd MVPProyectoTitulo/backend
```
3. Instala las dependencias:
```bash
npm install
```
4. Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables de entorno:
```bash
TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
POCKETBASE_URL=tu_pocketbase_url
POCKETBASE_API_KEY=tu_pocketbase_api_key
```
5. Corre el servidor:
```bash
npm start
```
Esto iniciará el servidor en `http://localhost:3000` (por defecto).

## 🛠️ Funcionalidades
- Gestión de pedidos (creación).
- Integración con WhatsApp a través de **Twilio** para la comunicación automática con los usuarios.
- Recomendaciones inteligentes de productos basadas en inteligencia artificial, utilizando el modelo **Mistral 7B**.
- Pruebas unitarias con **Vitest** para validar el correcto funcionamiento de las funciones y módulos.


## 📦 API Endpoints
Los endpoints principales de la API son:
- `GET /api/health`: Endpoint para verificar el estado de la API (salud del servidor).
- `POST /api/webhook`: Endpoint para recibir actualizaciones desde Twilio y procesarlas (para la integración con WhatsApp).


## 🌍 Enlace a la Presentación del Proyecto
Para ver la presentación del MVP, accede a este enlace:
🔗 [Ver MVP](https://mvpproyectotitulo-production.up.railway.app/login)

## 👨‍🎓 Información del Proyecto
- **Estudiante:** Giovanni Molina
- **Docente:** Mauricio Hidalgo Barrientos
- **Institución:** IPLACEX
- **Fecha:** 20-Mayo-2025

## ⚖️ Licencia
Este proyecto está bajo la licencia MIT.
