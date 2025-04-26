// index.mjs
import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';

// Configura tus credenciales
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = twilio(accountSid, authToken);

const app = express();
const PORT = 3000;

// Middleware para leer datos POST
app.use(bodyParser.urlencoded({ extended: false }));

// Ruta para recibir mensajes de WhatsApp
app.post('/webhook', (req, res) => {
    const from = req.body.From;
    const body = req.body.Body;

    console.log('📥 Mensaje recibido:');
    console.log('De:', from);
    console.log('Mensaje:', body);

    // Puedes responder automáticamente si quieres
    res.send('<Response></Response>');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
