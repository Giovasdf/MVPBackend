import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import { parsePedido } from './ia-parser.js';
import { getPocketBase, authAsAdmin } from './pocketbase.js';
import dotenv from 'dotenv';

// Configura variables de entorno
dotenv.config();

// Configuración Twilio desde variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const app = express();
const PORT = process.env.PORT || 3000;

// Estados de conversación
const estadosConversacion = new Map();  // chatId => estado
const pedidosPendientes = new Map();    // chatId => pedido

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Función para normalizar respuestas
function normalizarRespuesta(respuesta) {
  if (!respuesta) return '';
  
  return respuesta.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, '');
}

// Función para validar respuesta afirmativa
function esAfirmativo(respuesta) {
  const normalizada = normalizarRespuesta(respuesta);
  return ['si', 'sí', 's', '1', 'yes', 'y', 'ok', 'acepto', 'afirmativo'].includes(normalizada);
}

// Función para validar respuesta negativa
function esNegativo(respuesta) {
  const normalizada = normalizarRespuesta(respuesta);
  return ['no', 'n', '2', 'not', 'nope', 'negativo', 'cancelar'].includes(normalizada);
}

// Función para validar "listo"
function esListo(respuesta) {
  const normalizada = normalizarRespuesta(respuesta);
  return ['listo', 'terminar', 'finalizar', 'ready', 'fin', 'done'].includes(normalizada);
}

async function savePedido(nombre, productos, telefono) {
  try {
    const pbAdmin = await authAsAdmin();
    const SUCURSAL_ID = process.env.SUCURSAL_ID || '81w8ac71eg86236';

    // 1. Crear el pedido principal
    const resumen = productos.map(p => {
      const cantidad = p.cantidad || 1;
      const dosis = p.dosis ? ` (${p.dosis})` : '';
      const receta = p.requiereReceta ? ' (Requiere receta)' : '';
      return `${cantidad}x ${p.producto}${dosis}${receta}`;
    }).join('\n');

    const dataPedido = {
      nombre_cliente: nombre,
      telefono_cliente: telefono,
      resumen: resumen,
      resultado_json: JSON.stringify(productos),
      estado: 'pendiente',
      sucursal_id: SUCURSAL_ID
    };

    console.log('📝 Creando pedido principal...');
    const pedido = await pbAdmin.collection('pedidos').create(dataPedido);
    console.log('✅ Pedido principal creado:', pedido.id);

    // 2. Guardar cada producto individualmente
    console.log('📦 Guardando productos del pedido...');
    for (const producto of productos) {
      const dataProducto = {
        pedido_id: pedido.id,
        nombre_producto: producto.producto,
        dosis: producto.dosis || '',
        cantidad: producto.cantidad || 1,
        observaciones: producto.requiereReceta ? 'Requiere receta médica' : ''
      };

      try {
        const productoGuardado = await pbAdmin.collection('productos_pedido').create(dataProducto);
        console.log(`   ✔ Producto guardado: ${producto.producto} (ID: ${productoGuardado.id})`);
      } catch (err) {
        console.error(`   ❌ Error al guardar producto ${producto.producto}:`, err.message);
      }
    }

    return pedido;
  } catch (err) {
    console.error('❌ Error en el proceso completo:', {
      message: err.message,
      response: err.response?.data,
      stack: err.stack
    });
    throw err;
  }
}

// Ruta webhook para recibir mensajes
app.post('/webhook', async (req, res) => {
  try {
    const from = req.body.From.replace('whatsapp:', '');
    const body = req.body.Body;

    console.log('📥 Mensaje recibido de', from, ':', body);

    if (!estadosConversacion.has(from)) {
      estadosConversacion.set(from, 'aceptar_terminos');
      
      const terminosURL = process.env.TERMINOS_URL || 'https://tudominio.com/terminos-y-condiciones';
      const twiml = new twilio.twiml.MessagingResponse();
      
      twiml.message(
        `📜 *Términos y Condiciones*\n\n` +
        `Por favor lee nuestros términos en:\n${terminosURL}\n\n` +
        `Responde *Sí* para aceptar o *No* para cancelar`
      );
      
      return res.type('text/xml').send(twiml.toString());
    }

    const estadoActual = estadosConversacion.get(from);
    const twiml = new twilio.twiml.MessagingResponse();

    switch (estadoActual) {
      case 'aceptar_terminos':
        if (esAfirmativo(body)) {
          estadosConversacion.set(from, 'inicio');
          twiml.message('¡Bienvenido/a! 👋 ¿Cómo podemos ayudarte hoy?\n\n1️⃣ *Hacer un pedido*\n2️⃣ *Hablar con un asistente*');
        } else if (esNegativo(body)) {
          twiml.message('❌ No podemos continuar sin aceptar los términos.');
          estadosConversacion.delete(from);
        } else {
          twiml.message('❌ Opción no válida. Responde con *Sí* o *No*.');
        }
        break;

      case 'inicio':
        if (esAfirmativo(body) || body.includes('1') || normalizarRespuesta(body).includes('pedido')) {
          estadosConversacion.set(from, 'esperando_nombre');
          twiml.message('¿Cuál es el *nombre completo* de quien retirará el pedido?');
        } else if (esNegativo(body) || body.includes('2') || normalizarRespuesta(body).includes('asistente')) {
          twiml.message('👌 Un asistente se comunicará contigo pronto.');
          estadosConversacion.delete(from);
        } else {
          twiml.message('❌ Opción no válida. Escribe *1* para pedido o *2* para hablar con un asistente.');
        }
        break;

      case 'esperando_nombre':
        pedidosPendientes.set(from, {
          nombre: req.body.Body.trim(),
          productos: [],
          sucursal_id: 'default'
        });
        estadosConversacion.set(from, 'esperando_productos');
        twiml.message(`Perfecto. Escribe los productos que necesitas, *uno por línea*. Escribe *"listo"* cuando termines.`);
        break;

      case 'esperando_productos':
        if (esListo(body)) {
          const pedido = pedidosPendientes.get(from);
          if (!pedido.productos.length) {
            twiml.message('⚠️ No has agregado ningún producto. Escribe productos o *"cancelar"* para terminar.');
          } else {
            estadosConversacion.set(from, 'confirmando_pedido');
            twiml.message('¿Deseas agregar más productos?\n1️⃣ *Sí*  2️⃣ *No*');
          }
        } else if (esNegativo(body) || normalizarRespuesta(body).includes('cancelar')) {
          pedidosPendientes.delete(from);
          estadosConversacion.delete(from);
          twiml.message('❌ Pedido cancelado.');
        } else {
          try {
            const { productos } = await parsePedido(pedidosPendientes.get(from).nombre, req.body.Body);
            pedidosPendientes.get(from).productos.push(...productos);
            twiml.message(`✅ Productos agregados. Puedes seguir escribiendo o escribe *"listo"* para continuar.`);
          } catch (err) {
            console.error('Error parseando productos:', err.message);
            twiml.message('❌ No entendí los productos. Intenta nuevamente, uno por línea.');
          }
        }
        break;

      case 'confirmando_pedido':
        if (esAfirmativo(body) || body.includes('1')) {
          estadosConversacion.set(from, 'esperando_productos');
          twiml.message('Escribe los productos adicionales, uno por línea:');
        } else if (esNegativo(body) || body.includes('2')) {
          const pedido = pedidosPendientes.get(from);
          if (!pedido) {
            twiml.message('❌ Error: no hay pedido en progreso.');
            break;
          }

          let resumen = `🧾 *Resumen del pedido para:* ${pedido.nombre}\n\n`;
          let total = 0;

          for (const item of pedido.productos) {
            const cantidad = item.cantidad || 1;
            const dosis = item.dosis ? ` (${item.dosis})` : '';
            resumen += `• ${cantidad}x ${item.producto}${dosis}\n`;
            total += cantidad;
          }

          resumen += `\n🛍️ *Total productos:* ${total}`;
          resumen += '\n🕐 Un asistente confirmará disponibilidad.';
          resumen += '\n📄 Si un producto requiere receta, preséntala al retirar.';
          resumen += '\n\n¡Gracias por tu pedido! 💖';

          await savePedido(pedido.nombre, pedido.productos, from, pedido.sucursal_id);

          twiml.message(resumen);
          estadosConversacion.delete(from);
          pedidosPendientes.delete(from);
        } else {
          twiml.message('❌ Opción no válida. Escribe:\n1️⃣ *Sí*  2️⃣ *No*');
        }
        break;

      default:
        estadosConversacion.delete(from);
        pedidosPendientes.delete(from);
        twiml.message('😅 Algo salió mal. Escribe *"hola"* para comenzar de nuevo.');
        break;
    }

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('🔥 Error crítico en webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('⚠️ Ocurrió un error inesperado. Por favor intenta nuevamente.');
    res.status(500).type('text/xml').send(twiml.toString());
  }
});

// Ruta de salud para monitoreo
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📞 Twilio SID: ${accountSid ? 'Configurado' : 'NO configurado'}`);
});