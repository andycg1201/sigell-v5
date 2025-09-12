const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Inicializar cliente de WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

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
    // Limpiar número de teléfono
    const cleanNumber = to.replace(/\D/g, '');
    const chatId = `${cleanNumber}@c.us`;
    
    await client.sendMessage(chatId, message);
    console.log(`Mensaje enviado a ${to}: ${message.substring(0, 50)}...`);
    return { success: true };
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
*${phone.replace('@c.us', '')}*

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
    state.data.phone = phone.replace('@c.us', '');
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

// Eventos del cliente de WhatsApp
client.on('qr', async (qr) => {
  console.log('\n📱 ===== CÓDIGO QR PARA WHATSAPP =====');
  console.log('📱 Escanea este QR con WhatsApp:');
  console.log('📱 ======================================');
  
  // Generar QR en terminal
  try {
    qrcode.generate(qr, { 
      small: false,
      width: 2
    });
  } catch (error) {
    console.log('❌ Error generando QR visual');
    console.log('📱 Código QR (texto):', qr);
  }
  
  // Crear archivo HTML con QR
  try {
    const qrDataURL = await QRCode.toDataURL(qr, { 
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot QR Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            margin: 0 auto;
        }
        h1 {
            color: #25D366;
            margin-bottom: 20px;
        }
        .qr-code {
            margin: 20px 0;
        }
        .instructions {
            text-align: left;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .step {
            margin: 8px 0;
            padding: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 WhatsApp Bot QR Code</h1>
        <p>Escanea este código QR con WhatsApp para conectar el bot</p>
        
        <div class="qr-code">
            <img src="${qrDataURL}" alt="WhatsApp QR Code" />
        </div>
        
        <div class="instructions">
            <h3>📱 Instrucciones:</h3>
            <div class="step">1. Abre WhatsApp en tu teléfono</div>
            <div class="step">2. Ve a Configuración > Dispositivos vinculados</div>
            <div class="step">3. Toca "Vincular un dispositivo"</div>
            <div class="step">4. Escanea el código QR de arriba</div>
            <div class="step">5. ¡Listo! El bot estará conectado</div>
        </div>
        
        <p><strong>💡 Tip:</strong> Mantén este archivo abierto mientras escaneas el QR</p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('whatsapp-qr.html', htmlContent);
    console.log('\n📱 ======================================');
    console.log('💡 INSTRUCCIONES:');
    console.log('1. Abre WhatsApp en tu teléfono');
    console.log('2. Ve a Configuración > Dispositivos vinculados');
    console.log('3. Toca "Vincular un dispositivo"');
    console.log('4. Escanea el código QR de arriba');
    console.log('5. ¡Listo! El bot estará conectado');
    console.log('📱 ======================================');
    console.log('\n🌐 OPCIONAL: Abre el archivo "whatsapp-qr.html" en tu navegador');
    console.log('   para ver el QR en una página web más clara');
    console.log('📱 ======================================\n');
    
  } catch (error) {
    console.log('❌ Error creando archivo HTML:', error.message);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot conectado y listo!');
  console.log(`📱 Bot activo en: ${client.info.wid.user}`);
});

client.on('message', async (message) => {
  try {
    // Ignorar mensajes del bot mismo
    if (message.fromMe) return;
    
    // Ignorar mensajes de grupos
    if (message.from.includes('@g.us')) return;
    
    const phone = message.from;
    const body = message.body;
    
    console.log(`📨 Mensaje recibido de ${phone}: ${body}`);
    
    // Procesar mensaje del usuario
    await processUserMessage(phone, body);
    
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp Bot desconectado:', reason);
  console.log('🔄 Reiniciando conexión...');
  client.initialize();
});

// Endpoint para enviar mensajes (para testing)
app.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Faltan parámetros: to, message' });
    }
    
    const result = await sendWhatsAppMessage(to, message);
    res.json({ success: true, result });
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
    activeUsers: userStates.size,
    whatsappConnected: client.info ? true : false
  });
});

// Endpoint para obtener estado del bot
app.get('/status', (req, res) => {
  res.json({
    connected: client.info ? true : false,
    phone: client.info ? client.info.wid.user : null,
    activeUsers: userStates.size,
    uptime: process.uptime()
  });
});

// Inicializar cliente de WhatsApp
client.initialize();

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 WhatsApp Bot servidor iniciado en puerto ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📊 Status: http://localhost:${port}/status`);
  console.log(`\n💡 Este bot es 100% GRATIS - No hay costos de mensajes!`);
});

module.exports = app;
