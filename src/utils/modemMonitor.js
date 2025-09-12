import { ref, onValue, off } from 'firebase/database';

/**
 * Sistema de monitoreo del modem para detectar llamadas entrantes
 * Monitorea el archivo XML generado por modem-console.exe
 */
class ModemMonitor {
  constructor() {
    this.isMonitoring = false;
    this.lastFileSize = 0;
    this.lastModified = 0;
    this.xmlPath = 'C:\\Users\\Andres\\AppData\\Local\\Temp\\output.xml';
    this.callbacks = {
      onCallDetected: null,
      onCallEnded: null,
      onError: null
    };
    this.intervalId = null;
    this.currentCall = null;
  }

  /**
   * Iniciar monitoreo del archivo XML del modem
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('ModemMonitor: Ya está monitoreando');
      return;
    }

    console.log('ModemMonitor: Iniciando monitoreo del modem...');
    this.isMonitoring = true;

    // Verificar cada 500ms si hay cambios en el archivo
    this.intervalId = setInterval(() => {
      this.checkForChanges();
    }, 500);

    console.log('ModemMonitor: Monitoreo iniciado correctamente');
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('ModemMonitor: Deteniendo monitoreo...');
    this.isMonitoring = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('ModemMonitor: Monitoreo detenido');
  }

  /**
   * Verificar cambios en el archivo XML
   */
  async checkForChanges() {
    try {
      // Verificar si el archivo existe
      const fileExists = await this.fileExists(this.xmlPath);
      
      if (!fileExists) {
        // Si no existe y había una llamada activa, la llamada terminó
        if (this.currentCall) {
          this.handleCallEnded();
        }
        return;
      }

      // Obtener información del archivo
      const fileInfo = await this.getFileInfo(this.xmlPath);
      
      if (!fileInfo) {
        return;
      }

      // Verificar si el archivo cambió
      if (fileInfo.size !== this.lastFileSize || fileInfo.modified !== this.lastModified) {
        console.log('ModemMonitor: Cambio detectado en archivo XML');
        
        // Leer contenido del archivo
        const content = await this.readFile(this.xmlPath);
        
        if (content) {
          this.parseXMLContent(content);
        }

        // Actualizar valores de referencia
        this.lastFileSize = fileInfo.size;
        this.lastModified = fileInfo.modified;
      }
    } catch (error) {
      console.error('ModemMonitor: Error verificando cambios:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  /**
   * Verificar si un archivo existe
   */
  async fileExists(filePath) {
    try {
      // Usar fetch para verificar si el archivo existe
      const response = await fetch(`file://${filePath}`, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener información del archivo
   */
  async getFileInfo(filePath) {
    try {
      // Crear un objeto File para obtener información
      const response = await fetch(`file://${filePath}`);
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return {
        size: blob.size,
        modified: blob.lastModified || Date.now()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Leer contenido del archivo
   */
  async readFile(filePath) {
    try {
      const response = await fetch(`file://${filePath}`);
      if (!response.ok) {
        return null;
      }
      return await response.text();
    } catch (error) {
      console.error('ModemMonitor: Error leyendo archivo:', error);
      return null;
    }
  }

  /**
   * Parsear contenido XML del modem
   */
  parseXMLContent(content) {
    try {
      // Parsear XML simple
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Buscar información de la llamada
      const callInfo = this.extractCallInfo(xmlDoc);
      
      if (callInfo && callInfo.phoneNumber) {
        this.handleCallDetected(callInfo);
      }
    } catch (error) {
      console.error('ModemMonitor: Error parseando XML:', error);
    }
  }

  /**
   * Extraer información de la llamada del XML
   */
  extractCallInfo(xmlDoc) {
    try {
      // Buscar elementos comunes en XML de caller ID
      const phoneNumber = xmlDoc.querySelector('phone')?.textContent ||
                         xmlDoc.querySelector('number')?.textContent ||
                         xmlDoc.querySelector('caller')?.textContent ||
                         xmlDoc.querySelector('cid')?.textContent;

      const timestamp = xmlDoc.querySelector('timestamp')?.textContent ||
                       xmlDoc.querySelector('time')?.textContent ||
                       xmlDoc.querySelector('date')?.textContent;

      const name = xmlDoc.querySelector('name')?.textContent ||
                  xmlDoc.querySelector('caller_name')?.textContent;

      if (phoneNumber) {
        return {
          phoneNumber: this.cleanPhoneNumber(phoneNumber),
          timestamp: timestamp || new Date().toISOString(),
          name: name || null,
          rawXML: xmlDoc.documentElement.outerHTML
        };
      }

      return null;
    } catch (error) {
      console.error('ModemMonitor: Error extrayendo información:', error);
      return null;
    }
  }

  /**
   * Limpiar número de teléfono
   */
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remover caracteres no numéricos excepto +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si no tiene código de país, agregar +57 (Colombia)
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
      cleaned = '+57' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Manejar llamada detectada
   */
  handleCallDetected(callInfo) {
    console.log('ModemMonitor: Llamada detectada:', callInfo);
    
    this.currentCall = callInfo;
    
    if (this.callbacks.onCallDetected) {
      this.callbacks.onCallDetected(callInfo);
    }
  }

  /**
   * Manejar llamada terminada
   */
  handleCallEnded() {
    console.log('ModemMonitor: Llamada terminada');
    
    if (this.currentCall && this.callbacks.onCallEnded) {
      this.callbacks.onCallEnded(this.currentCall);
    }
    
    this.currentCall = null;
  }

  /**
   * Configurar callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      currentCall: this.currentCall,
      xmlPath: this.xmlPath
    };
  }
}

// Crear instancia singleton
const modemMonitor = new ModemMonitor();

export default modemMonitor;
