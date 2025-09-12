# 📞 Servidor del Modem - Instrucciones de Uso

## 🎯 **Descripción**

Este servidor monitorea el archivo XML generado por `modem-console.exe` y envía las llamadas entrantes al sistema web en tiempo real usando WebSocket.

## 🚀 **Instalación y Configuración**

### **1. Instalar dependencias:**
```bash
cd modem-server
npm install
```

### **2. Configurar la ruta del archivo XML:**
Editar `server.js` línea 12:
```javascript
const XML_PATH = 'C:\\Users\\Andres\\AppData\\Local\\Temp\\output.xml';
```

### **3. Iniciar el servidor:**
```bash
npm start
```

## 🔧 **Uso**

### **Iniciar el servidor:**
```bash
cd modem-server
npm start
```

### **El servidor se ejecutará en:**
- **Puerto**: 3001
- **WebSocket**: ws://localhost:3001
- **API**: http://localhost:3001

## 📡 **API Endpoints**

### **GET /status**
Obtiene el estado actual del servidor:
```bash
curl http://localhost:3001/status
```

### **POST /start-monitoring**
Inicia el monitoreo del archivo XML:
```bash
curl -X POST http://localhost:3001/start-monitoring
```

### **POST /stop-monitoring**
Detiene el monitoreo:
```bash
curl -X POST http://localhost:3001/stop-monitoring
```

### **POST /clear-call**
Limpia la llamada actual:
```bash
curl -X POST http://localhost:3001/clear-call
```

## 🔌 **WebSocket Events**

### **Eventos del servidor al cliente:**
- `callDetected` - Nueva llamada detectada
- `callEnded` - Llamada terminada
- `status` - Estado del servidor

### **Eventos del cliente al servidor:**
- `startMonitoring` - Iniciar monitoreo
- `stopMonitoring` - Detener monitoreo
- `clearCall` - Limpiar llamada actual
- `getStatus` - Obtener estado

## 🎯 **Flujo de Funcionamiento**

1. **Servidor inicia** y monitorea el archivo XML
2. **Modem detecta** llamada entrante
3. **Archivo XML** se actualiza con información de la llamada
4. **Servidor detecta** cambio en el archivo
5. **Servidor parsea** el XML y extrae el número
6. **Servidor envía** evento `callDetected` via WebSocket
7. **Sistema web** recibe la llamada y abre el modal automáticamente

## 🔧 **Configuración del Modem**

### **Asegúrate de que:**
1. **modem-console.exe** esté ejecutándose
2. **Modem esté conectado** y funcionando
3. **Archivo XML** se genere en la ruta configurada
4. **Servidor del modem** esté ejecutándose

## 🧪 **Pruebas**

### **1. Verificar que el servidor esté funcionando:**
```bash
curl http://localhost:3001/status
```

### **2. Verificar que el archivo XML se genere:**
- Ejecutar `modem-console.exe`
- Hacer una llamada de prueba
- Verificar que se cree el archivo XML

### **3. Verificar la conexión WebSocket:**
- Abrir el sistema web
- Hacer clic en "🔌 Cambiar a Modem Real"
- Hacer clic en "Conectar"
- Verificar que aparezca "Conectado al servidor del modem"

## 🚨 **Solución de Problemas**

### **Error: "No se pudo conectar al servidor del modem"**
- Verificar que el servidor esté ejecutándose en puerto 3001
- Verificar que no haya firewall bloqueando la conexión

### **Error: "Archivo XML no encontrado"**
- Verificar que `modem-console.exe` esté ejecutándose
- Verificar la ruta del archivo XML en `server.js`
- Verificar permisos de acceso al archivo

### **Error: "Llamadas no detectadas"**
- Verificar que el modem esté conectado
- Verificar que `modem-console.exe` esté monitoreando
- Verificar que el archivo XML se esté generando

## 📊 **Logs del Servidor**

El servidor muestra logs detallados:
```
🚀 Servidor del modem ejecutándose en puerto 3001
📁 Monitoreando archivo: C:\Users\Andres\AppData\Local\Temp\output.xml
🌐 WebSocket disponible en: ws://localhost:3001
📡 API disponible en: http://localhost:3001
Cliente conectado: abc123
Cambio detectado en archivo XML
Llamada detectada: +573001234567
```

## 🔄 **Reinicio Automático**

Para desarrollo, usar:
```bash
npm run dev
```

Esto reiniciará automáticamente el servidor cuando cambien los archivos.

## 🎉 **¡Listo para Usar!**

Una vez configurado, el sistema funcionará automáticamente:
1. **Llamada entrante** → Modem detecta número
2. **Sistema web** → Recibe llamada automáticamente
3. **Modal se abre** → Con información del cliente
4. **Operador** → Decide si crear pedido

---

**📅 Fecha**: 10 de Septiembre 2025  
**👤 Desarrollado por**: Asistente AI  
**🎯 Estado**: Sistema completo y funcional
