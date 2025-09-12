const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

console.log('🤖 Iniciando WhatsApp Bot...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  console.log('\n📱 ===== CÓDIGO QR PARA WHATSAPP =====');
  console.log('📱 Escanea este QR con WhatsApp:');
  console.log('📱 ======================================');
  
  // Generar QR en terminal (más pequeño)
  try {
    qrcode.generate(qr, { 
      small: true,
      width: 1
    });
  } catch (error) {
    console.log('❌ Error generando QR visual');
    console.log('📱 Código QR (texto):', qr);
  }
  
  // Crear archivo HTML con QR
  try {
    const qrDataURL = await QRCode.toDataURL(qr, { 
      width: 200,
      margin: 1
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

// Estados de conversación para cada usuario
const userStates = new Map();

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

// Función para procesar mensaje del usuario
function processUserMessage(phone, message) {
  const state = getUserState(phone);
  const lowerMessage = message.toLowerCase().trim();

  switch (state.step) {
    case 'welcome':
      return handleWelcome(phone, lowerMessage, state);
    
    case 'menu':
      return handleMenu(phone, lowerMessage, state);
    
    case 'capture_location':
      return handleLocationCapture(phone, message, state);
    
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
    
    return menuMessage;
  }
  
  return 'Hola! Para comenzar, escribe "hola" o "buenos días".';
}

// Manejar menú principal
function handleMenu(phone, message, state) {
  switch (message) {
    case '1':
      // Capturar número automáticamente del WhatsApp
      const cleanPhone = phone.replace('@c.us', '');
      state.data.phone = cleanPhone;
      state.step = 'capture_location';
      state.timestamp = Date.now();
      
      return `📞 *Hacer un Pedido*

✅ *Teléfono registrado:* ${cleanPhone}

📍 *Ubicación de Recogida*

Para que el taxi te encuentre más fácil, comparte tu ubicación actual:

1. Toca el botón 📍 de *ubicación* en WhatsApp
2. Selecciona *"Ubicación en tiempo real"*
3. O escribe la dirección si prefieres

*💡 Tip:* La ubicación GPS es más precisa y rápida para el taxi.`;
    
    case '2':
      return `📍 *Ver Direcciones*

Esta funcionalidad estará disponible próximamente. Por ahora, puedes hacer un pedido con la opción 1.`;
    
    case '3':
      return `📋 *Ver Pedidos Recientes*

Esta funcionalidad estará disponible próximamente. Por ahora, puedes hacer un pedido con la opción 1.`;
    
    case '4':
      return `ℹ️ *Información del Servicio*

🚕 *Sistema de Taxis*
• Servicio 24/7
• Pedidos por WhatsApp
• Seguimiento en tiempo real
• Múltiples direcciones por cliente

Para hacer un pedido, responde *1*`;
    
    default:
      return `Por favor, responde con un número del 1 al 4 para seleccionar una opción.`;
  }
}

// Manejar captura de ubicación
function handleLocationCapture(phone, message, state) {
  // Verificar si es una ubicación compartida (contiene coordenadas)
  if (message.includes('lat:') && message.includes('lng:')) {
    // Extraer coordenadas de la ubicación compartida
    const latMatch = message.match(/lat:([+-]?\d+\.?\d*)/);
    const lngMatch = message.match(/lng:([+-]?\d+\.?\d*)/);
    
    if (latMatch && lngMatch) {
      const lat = latMatch[1];
      const lng = lngMatch[1];
      
      state.data.location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        type: 'gps'
      };
      state.data.address = `📍 Ubicación GPS (${lat}, ${lng})`;
      
      state.step = 'capture_quantity';
      state.timestamp = Date.now();
      
      return `✅ *Ubicación GPS registrada*

📍 *Coordenadas:* ${lat}, ${lng}
🎯 *Precisión:* GPS exacto

🚗 *Cantidad de Pasajeros*

¿Cuántas personas van a viajar?

Responde con un número del 1 al 8.`;
    }
  }
  
  // Si es texto (dirección escrita), validar longitud
  if (message.length < 10) {
    return `Por favor, escribe una dirección más detallada (mínimo 10 caracteres) o comparte tu ubicación GPS tocando el botón 📍.`;
  }
  
  // Es una dirección escrita
  state.data.address = message;
  state.data.location = {
    type: 'address',
    text: message
  };
  
  state.step = 'capture_quantity';
  state.timestamp = Date.now();
  
  return `✅ *Dirección registrada:* ${state.data.address}

🚗 *Cantidad de Pasajeros*

¿Cuántas personas van a viajar?

Responde con un número del 1 al 8.`;
}

// Manejar captura de cantidad
function handleQuantityCapture(phone, message, state) {
  const quantity = parseInt(message);
  
  if (isNaN(quantity) || quantity < 1 || quantity > 8) {
    return `Por favor, responde con un número del 1 al 8 para la cantidad de pasajeros.`;
  }
  
  state.data.quantity = quantity;
  state.step = 'confirm_order';
  state.timestamp = Date.now();
  
  const locationInfo = state.data.location.type === 'gps' 
    ? `📍 *Ubicación GPS:* ${state.data.location.lat}, ${state.data.location.lng}`
    : `📍 *Dirección:* ${state.data.address}`;

  const confirmMessage = `📋 *Confirmar Pedido*

*Teléfono:* ${state.data.phone}
${locationInfo}
*Pasajeros:* ${state.data.quantity}

¿Confirmas este pedido?

Responde:
- *SÍ* para confirmar
- *NO* para cancelar
- *EDITAR* para modificar algún dato`;
  
  return confirmMessage;
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
    
    const finalLocationInfo = state.data.location.type === 'gps' 
      ? `• Ubicación GPS: ${state.data.location.lat}, ${state.data.location.lng}`
      : `• Dirección: ${state.data.address}`;

    return `✅ *¡Pedido Confirmado!*

Tu pedido ha sido registrado exitosamente.

*Detalles:*
• Teléfono: ${state.data.phone}
${finalLocationInfo}
• Pasajeros: ${state.data.quantity}
• Hora: ${orderData.hora}

Un operador se pondrá en contacto contigo pronto para asignar una unidad.

¡Gracias por usar nuestro servicio! 🚕`;
  }
  
  if (message.includes('no')) {
    userStates.delete(phone);
    return `❌ Pedido cancelado.

Si cambias de opinión, puedes hacer un nuevo pedido escribiendo *hola*.`;
  }
  
  if (message.includes('editar')) {
    state.step = 'capture_location';
    state.timestamp = Date.now();
    return `✏️ *Editar Pedido*

Vamos a modificar la ubicación. Comparte tu nueva ubicación:

1. Toca el botón 📍 de *ubicación* en WhatsApp
2. Selecciona *"Ubicación en tiempo real"*
3. O escribe la nueva dirección

*💡 Tip:* La ubicación GPS es más precisa para el taxi.`;
  }
  
  return `Por favor, responde *SÍ* para confirmar, *NO* para cancelar, o *EDITAR* para modificar.`;
}

// Manejar mensaje por defecto
function handleDefault(phone, state) {
  state.step = 'welcome';
  state.timestamp = Date.now();
  return `Hola! Para comenzar, escribe "hola" o "buenos días".`;
}

client.on('message', async (message) => {
  if (message.fromMe) return;
  if (message.from.includes('@g.us')) return;
  
  console.log(`📨 Mensaje recibido de ${message.from}: ${message.body}`);
  
  try {
    const response = processUserMessage(message.from, message.body);
    await message.reply(response);
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    await message.reply('❌ Error procesando tu mensaje. Por favor, intenta de nuevo.');
  }
});

client.initialize();
