const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Inicializar cliente de Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Estados de conversación para cada usuario
const userStates = new Map();

// Función para limpiar estados antiguos (cada 30 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [phone, state] of userStates.entries()) {
    if (now - state.timestamp > 30 * 60 * 1000) { // 30 minutos
      userStates.delete(phone);
    }
  }
}, 30 * 60 * 1000);

// Función para obtener o crear estado del usuario
function getUserState(phone) {
  if (!userStates.has(phone)) {
    userStates.set(phone, {
      step: 'welcome',
      data: {},
      timestamp: Date.now()
    });
  }
  return userStates.get(phone);
}

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const messageResponse = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`
    });
    console.log(`Mensaje enviado a ${to}: ${messageResponse.sid}`);
    return messageResponse;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

// Función para procesar mensaje del usuario
function processUserMessage(phone, message) {
  const state = getUserState(phone);
  const lowerMessage = message.toLowerCase().trim();

  switch (state.step) {
    case 'welcome':
      return handleWelcome(phone, lowerMessage, state);
    
    case 'menu':
      return handleMenu(phone, lowerMessage, state);
    
    case 'capture_phone':
      return handlePhoneCapture(phone, message, state);
    
    case 'capture_address':
      return handleAddressCapture(phone, message, state);
    
    case 'capture_quantity':
      return handleQuantityCapture(phone, message, state);
    
    case 'confirm_order':
      return handleOrderConfirmation(phone, lowerMessage, state);
    
    default:
      return handleDefault(phone, state);
  }
}

// Manejar mensaje de bienvenida
function handleWelcome(phone, message, state) {
  if (message.includes('hola') || message.includes('hi') || message.includes('buenos')) {
    state.step = 'menu';
    state.timestamp = Date.now();
    
    const menuMessage = `🚕 *¡Bienvenido al Sistema de Taxis!*

¿En qué puedo ayudarte hoy?

*1* 📞 Hacer un pedido
*2* 📍 Ver mis direcciones
*3* 📋 Ver mis pedidos recientes
*4* ℹ️ Información del servicio

Responde con el número de la opción que prefieras.`;
    
    return sendWhatsAppMessage(phone, menuMessage);
  }
  
  return sendWhatsAppMessage(phone, 'Hola! Para comenzar, escribe "hola" o "buenos días".');
}

// Manejar menú principal
function handleMenu(phone, message, state) {
  switch (message) {
    case '1':
      state.step = 'capture_phone';
      state.timestamp = Date.now();
      return sendWhatsAppMessage(phone, `📞 *Hacer un Pedido*

Por favor, confirma tu número de teléfono:
*${phone.replace('whatsapp:', '')}*

Responde:
- *SÍ* si es correcto
- *NO* si quieres usar otro número`);
    
    case '2':
      return sendWhatsAppMessage(phone, `📍 *Ver Direcciones*

Esta funcionalidad estará disponible próximamente. Por ahora, puedes hacer un pedido con la opción 1.`);
    
    case '3':
      return sendWhatsAppMessage(phone, `📋 *Ver Pedidos Recientes*

Esta funcionalidad estará disponible próximamente. Por ahora, puedes hacer un pedido con la opción 1.`);
    
    case '4':
      return sendWhatsAppMessage(phone, `ℹ️ *Información del Servicio*

🚕 *Sistema de Taxis*
• Servicio 24/7
• Pedidos por WhatsApp
• Seguimiento en tiempo real
• Múltiples direcciones por cliente

Para hacer un pedido, responde *1*`);
    
    default:
      return sendWhatsAppMessage(phone, `Por favor, responde con un número del 1 al 4 para seleccionar una opción.`);
  }
}

// Manejar captura de teléfono
function handlePhoneCapture(phone, message, state) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('sí') || lowerMessage.includes('si') || lowerMessage.includes('yes')) {
    state.data.phone = phone.replace('whatsapp:', '');
    state.step = 'capture_address';
    state.timestamp = Date.now();
    
    return sendWhatsAppMessage(phone, `📍 *Dirección de Recogida*

Por favor, escribe la dirección donde quieres que te recojan:

Ejemplo: *Av. Principal 123, Centro*`);
  }
  
  if (lowerMessage.includes('no')) {
    return sendWhatsAppMessage(phone, `Por favor, escribe el número de teléfono que quieres usar para el pedido:

Ejemplo: *0987654321*`);
  }
  
  // Si es un número de teléfono
  if (/^\d{10}$/.test(message.replace(/\D/g, ''))) {
    state.data.phone = message.replace(/\D/g, '');
    state.step = 'capture_address';
    state.timestamp = Date.now();
    
    return sendWhatsAppMessage(phone, `✅ Teléfono registrado: *${state.data.phone}*

📍 *Dirección de Recogida*

Por favor, escribe la dirección donde quieres que te recojan:

Ejemplo: *Av. Principal 123, Centro*`);
  }
  
  return sendWhatsAppMessage(phone, `Por favor, responde *SÍ* si el número es correcto, *NO* si quieres cambiarlo, o escribe un número de teléfono válido.`);
}

// Manejar captura de dirección
function handleAddressCapture(phone, message, state) {
  if (message.length < 10) {
    return sendWhatsAppMessage(phone, `Por favor, escribe una dirección más detallada (mínimo 10 caracteres).`);
  }
  
  state.data.address = message;
  state.step = 'capture_quantity';
  state.timestamp = Date.now();
  
  return sendWhatsAppMessage(phone, `✅ Dirección registrada: *${state.data.address}*

🚗 *Cantidad de Pasajeros*

¿Cuántas personas van a viajar?

Responde con un número del 1 al 8.`);
}

// Manejar captura de cantidad
function handleQuantityCapture(phone, message, state) {
  const quantity = parseInt(message);
  
  if (isNaN(quantity) || quantity < 1 || quantity > 8) {
    return sendWhatsAppMessage(phone, `Por favor, responde con un número del 1 al 8 para la cantidad de pasajeros.`);
  }
  
  state.data.quantity = quantity;
  state.step = 'confirm_order';
  state.timestamp = Date.now();
  
  const confirmMessage = `📋 *Confirmar Pedido*

*Teléfono:* ${state.data.phone}
*Dirección:* ${state.data.address}
*Pasajeros:* ${state.data.quantity}

¿Confirmas este pedido?

Responde:
- *SÍ* para confirmar
- *NO* para cancelar
- *EDITAR* para modificar algún dato`;
  
  return sendWhatsAppMessage(phone, confirmMessage);
}

// Manejar confirmación de pedido
function handleOrderConfirmation(phone, message, state) {
  if (message.includes('sí') || message.includes('si') || message.includes('yes')) {
    // Aquí se integraría con el sistema de pedidos existente
    const orderData = {
      cliente: state.data.phone,
      domicilio: state.data.address,
      cantidad: state.data.quantity,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toISOString(),
      origen: 'whatsapp'
    };
    
    // TODO: Integrar con Firebase para crear el pedido
    console.log('Pedido creado desde WhatsApp:', orderData);
    
    // Limpiar estado del usuario
    userStates.delete(phone);
    
    return sendWhatsAppMessage(phone, `✅ *¡Pedido Confirmado!*

Tu pedido ha sido registrado exitosamente.

*Detalles:*
• Teléfono: ${state.data.phone}
• Dirección: ${state.data.address}
• Pasajeros: ${state.data.quantity}
• Hora: ${orderData.hora}

Un operador se pondrá en contacto contigo pronto para asignar una unidad.

¡Gracias por usar nuestro servicio! 🚕`);
  }
  
  if (message.includes('no')) {
    userStates.delete(phone);
    return sendWhatsAppMessage(phone, `❌ Pedido cancelado.

Si cambias de opinión, puedes hacer un nuevo pedido escribiendo *hola*.`);
  }
  
  if (message.includes('editar')) {
    state.step = 'capture_phone';
    state.timestamp = Date.now();
    return sendWhatsAppMessage(phone, `✏️ *Editar Pedido*

Vamos a empezar de nuevo. Por favor, confirma tu número de teléfono:
*${state.data.phone}*

Responde:
- *SÍ* si es correcto
- *NO* si quieres usar otro número`);
  }
  
  return sendWhatsAppMessage(phone, `Por favor, responde *SÍ* para confirmar, *NO* para cancelar, o *EDITAR* para modificar.`);
}

// Manejar mensaje por defecto
function handleDefault(phone, state) {
  state.step = 'welcome';
  state.timestamp = Date.now();
  return sendWhatsAppMessage(phone, `Hola! Para comenzar, escribe "hola" o "buenos días".`);
}

// Endpoint para recibir mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;
    
    if (!From || !Body) {
      return res.status(400).send('Datos incompletos');
    }
    
    console.log(`Mensaje recibido de ${From}: ${Body}`);
    
    // Procesar mensaje del usuario
    await processUserMessage(From, Body);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    res.status(500).send('Error interno');
  }
});

// Endpoint para enviar mensajes (para testing)
app.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Faltan parámetros: to, message' });
    }
    
    const result = await sendWhatsAppMessage(to, message);
    res.json({ success: true, messageId: result.sid });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeUsers: userStates.size
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 WhatsApp Bot servidor iniciado en puerto ${port}`);
  console.log(`📱 Webhook URL: http://localhost:${port}/webhook`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

module.exports = app;
