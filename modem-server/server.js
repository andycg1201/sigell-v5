const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración
const PORT = 3001;
const XML_PATH = 'C:\\Users\\Andres\\AppData\\Local\\Temp\\output.xml';
const MONITOR_INTERVAL = 500; // ms

// Estado del servidor
let isMonitoring = false;
let lastFileSize = 0;
let lastModified = 0;
let currentCall = null;

// Middleware
app.use(cors());
app.use(express.json());

// Función para verificar si el archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para obtener información del archivo
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime.getTime()
    };
  } catch (error) {
    return null;
  }
}

// Función para leer el archivo XML
function readXMLFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error leyendo archivo XML:', error);
    return null;
  }
}

// Función para parsear el XML
function parseXMLContent(content) {
  try {
    // Parseo simple de XML (sin librerías externas)
    const phoneMatch = content.match(/<phone>(.*?)<\/phone>/);
    const timestampMatch = content.match(/<timestamp>(.*?)<\/timestamp>/);
    const nameMatch = content.match(/<name>(.*?)<\/name>/);
    
    if (phoneMatch) {
      return {
        phoneNumber: cleanPhoneNumber(phoneMatch[1]),
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        name: nameMatch ? nameMatch[1] : null,
        rawXML: content
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parseando XML:', error);
    return null;
  }
}

// Función para limpiar número de teléfono
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remover caracteres no numéricos excepto +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Si no tiene código de país, agregar +57 (Colombia)
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+57' + cleaned;
  }
  
  return cleaned;
}

// Función para monitorear el archivo XML
function monitorXMLFile() {
  if (!isMonitoring) return;
  
  try {
    // Verificar si el archivo existe
    const fileExists = fs.existsSync(XML_PATH);
    
    if (!fileExists) {
      // Si no existe y había una llamada activa, la llamada terminó
      if (currentCall) {
        console.log('Llamada terminada:', currentCall.phoneNumber);
        io.emit('callEnded', currentCall);
        currentCall = null;
      }
      return;
    }

    // Obtener información del archivo
    const fileInfo = getFileInfo(XML_PATH);
    
    if (!fileInfo) {
      return;
    }

    // Verificar si el archivo cambió
    if (fileInfo.size !== lastFileSize || fileInfo.modified !== lastModified) {
      console.log('Cambio detectado en archivo XML');
      
      // Leer contenido del archivo
      const content = readXMLFile(XML_PATH);
      
      if (content) {
        const callInfo = parseXMLContent(content);
        
        if (callInfo && callInfo.phoneNumber) {
          console.log('Llamada detectada:', callInfo.phoneNumber);
          currentCall = callInfo;
          io.emit('callDetected', callInfo);
        }
      }

      // Actualizar valores de referencia
      lastFileSize = fileInfo.size;
      lastModified = fileInfo.modified;
    }
  } catch (error) {
    console.error('Error monitoreando archivo XML:', error);
  }
}

// Rutas de la API
app.get('/status', (req, res) => {
  res.json({
    isMonitoring,
    currentCall,
    xmlPath: XML_PATH,
    lastFileSize,
    lastModified
  });
});

app.post('/start-monitoring', (req, res) => {
  if (!isMonitoring) {
    isMonitoring = true;
    console.log('Iniciando monitoreo del modem...');
    res.json({ success: true, message: 'Monitoreo iniciado' });
  } else {
    res.json({ success: false, message: 'Ya está monitoreando' });
  }
});

app.post('/stop-monitoring', (req, res) => {
  if (isMonitoring) {
    isMonitoring = false;
    currentCall = null;
    console.log('Deteniendo monitoreo del modem...');
    res.json({ success: true, message: 'Monitoreo detenido' });
  } else {
    res.json({ success: false, message: 'No está monitoreando' });
  }
});

app.post('/clear-call', (req, res) => {
  currentCall = null;
  console.log('Llamada actual limpiada');
  res.json({ success: true, message: 'Llamada limpiada' });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar estado actual al cliente
  socket.emit('status', {
    isMonitoring,
    currentCall,
    xmlPath: XML_PATH
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar monitoreo automático
setInterval(monitorXMLFile, MONITOR_INTERVAL);

// Iniciar monitoreo automáticamente al arrancar
isMonitoring = true;
console.log('✅ Monitoreo iniciado automáticamente');

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor del modem ejecutándose en puerto ${PORT}`);
  console.log(`📁 Monitoreando archivo: ${XML_PATH}`);
  console.log(`🌐 WebSocket disponible en: ws://localhost:${PORT}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});
