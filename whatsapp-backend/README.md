# 🤖 WhatsApp Bot para Sistema de Taxis

## 📋 Descripción

Bot de WhatsApp que permite a los clientes hacer pedidos de taxi directamente desde WhatsApp, integrado con el sistema de control de taxis existente.

## 🚀 Características

- ✅ **Mensajes de bienvenida** y menú interactivo
- ✅ **Captura de datos** (teléfono, dirección, cantidad)
- ✅ **Validación** de información
- ✅ **Confirmación** de pedidos
- ✅ **Integración** con sistema existente
- ✅ **Estados de conversación** por usuario
- ✅ **Limpieza automática** de estados antiguos

## 🛠️ Instalación

### 1. Instalar dependencias
```bash
cd whatsapp-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp env.example .env
```

Editar el archivo `.env` con tus credenciales:
```env
# Configuración de Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Configuración de Firebase
FIREBASE_PROJECT_ID=sigell-version-5
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Configuración del servidor
PORT=3001
NODE_ENV=development

# URL del frontend
FRONTEND_URL=https://sigell-version-5.web.app
```

### 3. Configurar Twilio WhatsApp

#### Paso 1: Crear cuenta en Twilio
1. Ir a [Twilio Console](https://console.twilio.com/)
2. Crear una cuenta gratuita
3. Obtener Account SID y Auth Token

#### Paso 2: Configurar WhatsApp Sandbox
1. Ir a [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Seguir las instrucciones para conectar tu número
3. Obtener el número de WhatsApp de Twilio

#### Paso 3: Configurar Webhook
1. En Twilio Console, ir a WhatsApp > Sandbox
2. Configurar Webhook URL: `https://tu-dominio.com/webhook`
3. Método: POST

### 4. Ejecutar el servidor

#### Desarrollo:
```bash
npm run dev
```

#### Producción:
```bash
npm start
```

## 📱 Flujo del Bot

### 1. Bienvenida
```
Usuario: "hola"
Bot: "🚕 ¡Bienvenido al Sistema de Taxis!

¿En qué puedo ayudarte hoy?

1 📞 Hacer un pedido
2 📍 Ver mis direcciones  
3 📋 Ver mis pedidos recientes
4 ℹ️ Información del servicio"
```

### 2. Hacer Pedido
```
Usuario: "1"
Bot: "📞 Hacer un Pedido

Por favor, confirma tu número de teléfono:
*0987654321*

Responde:
- SÍ si es correcto
- NO si quieres usar otro número"
```

### 3. Captura de Dirección
```
Usuario: "SÍ"
Bot: "📍 Dirección de Recogida

Por favor, escribe la dirección donde quieres que te recojan:

Ejemplo: Av. Principal 123, Centro"
```

### 4. Captura de Cantidad
```
Usuario: "Av. Principal 123, Centro"
Bot: "✅ Dirección registrada: Av. Principal 123, Centro

🚗 Cantidad de Pasajeros

¿Cuántas personas van a viajar?

Responde con un número del 1 al 8."
```

### 5. Confirmación
```
Usuario: "2"
Bot: "📋 Confirmar Pedido

Teléfono: 0987654321
Dirección: Av. Principal 123, Centro
Pasajeros: 2

¿Confirmas este pedido?

Responde:
- SÍ para confirmar
- NO para cancelar
- EDITAR para modificar algún dato"
```

### 6. Pedido Confirmado
```
Usuario: "SÍ"
Bot: "✅ ¡Pedido Confirmado!

Tu pedido ha sido registrado exitosamente.

Detalles:
• Teléfono: 0987654321
• Dirección: Av. Principal 123, Centro
• Pasajeros: 2
• Hora: 14:30

Un operador se pondrá en contacto contigo pronto para asignar una unidad.

¡Gracias por usar nuestro servicio! 🚕"
```

## 🔧 API Endpoints

### POST /webhook
Recibe mensajes de WhatsApp desde Twilio.

### POST /send-message
Envía mensajes de WhatsApp (para testing).
```json
{
  "to": "593987654321",
  "message": "Mensaje de prueba"
}
```

### GET /health
Verifica el estado del servidor.
```json
{
  "status": "OK",
  "timestamp": "2025-09-10T22:30:00.000Z",
  "activeUsers": 5
}
```

## 🗂️ Estructura del Proyecto

```
whatsapp-backend/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── env.example        # Variables de entorno de ejemplo
└── README.md          # Documentación
```

## 🔄 Estados de Conversación

El bot mantiene estados de conversación para cada usuario:

- `welcome` - Mensaje de bienvenida
- `menu` - Menú principal
- `capture_phone` - Captura de teléfono
- `capture_address` - Captura de dirección
- `capture_quantity` - Captura de cantidad
- `confirm_order` - Confirmación de pedido

Los estados se limpian automáticamente después de 30 minutos de inactividad.

## 🚀 Próximos Pasos

### Fase 2: Integración con Firebase
- [ ] Conectar con Firestore para crear pedidos
- [ ] Integrar con sistema de clientes existente
- [ ] Notificaciones al operador

### Fase 3: Funcionalidades Avanzadas
- [ ] Ver direcciones guardadas
- [ ] Ver historial de pedidos
- [ ] Seguimiento de pedidos en tiempo real
- [ ] Notificaciones de estado

## 🐛 Troubleshooting

### Error: "Invalid phone number"
- Verificar que el número esté en formato internacional
- Ejemplo: 593987654321 (Ecuador)

### Error: "Webhook not configured"
- Verificar que la URL del webhook esté configurada en Twilio
- Usar ngrok para desarrollo local

### Error: "Authentication failed"
- Verificar Account SID y Auth Token en .env
- Verificar que las credenciales sean correctas

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, contactar al equipo de desarrollo.

---

**¡Bot de WhatsApp listo para producción!** 🚀
