/**
 * Cliente WebSocket para conectar con el servidor del modem
 * Permite comunicación en tiempo real entre el sistema web y el servidor del modem
 */

class ModemWebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.serverUrl = 'http://localhost:3001';
    this.callbacks = {
      onCallDetected: null,
      onCallEnded: null,
      onStatusChange: null,
      onError: null
    };
  }

  /**
   * Conectar al servidor del modem
   */
  connect() {
    try {
      console.log('ModemWebSocket: Conectando al servidor del modem...');
      
      // Importar socket.io-client dinámicamente
      import('socket.io-client').then(({ io }) => {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('ModemWebSocket: Conectado al servidor del modem');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('connected');
          }
        });

        this.socket.on('disconnect', () => {
          console.log('ModemWebSocket: Desconectado del servidor del modem');
          this.isConnected = false;
          
          if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('disconnected');
          }
          
          this.attemptReconnect();
        });

        this.socket.on('callDetected', (callInfo) => {
          console.log('ModemWebSocket: Llamada detectada:', callInfo);
          
          if (this.callbacks.onCallDetected) {
            this.callbacks.onCallDetected(callInfo);
          }
        });

        this.socket.on('callEnded', (callInfo) => {
          console.log('ModemWebSocket: Llamada terminada:', callInfo);
          
          if (this.callbacks.onCallEnded) {
            this.callbacks.onCallEnded(callInfo);
          }
        });

        this.socket.on('status', (status) => {
          console.log('ModemWebSocket: Estado del servidor:', status);
          
          if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('connected', status);
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('ModemWebSocket: Error de conexión:', error);
          
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          
          this.attemptReconnect();
        });

      }).catch(error => {
        console.error('ModemWebSocket: Error importando socket.io-client:', error);
        
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      });

    } catch (error) {
      console.error('ModemWebSocket: Error conectando:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      console.log('ModemWebSocket: Desconectando del servidor del modem');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Intentar reconectar
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`ModemWebSocket: Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('ModemWebSocket: Máximo de intentos de reconexión alcanzado');
      
      if (this.callbacks.onError) {
        this.callbacks.onError(new Error('No se pudo conectar al servidor del modem'));
      }
    }
  }

  /**
   * Iniciar monitoreo en el servidor
   */
  startMonitoring() {
    if (this.socket && this.isConnected) {
      console.log('ModemWebSocket: Iniciando monitoreo en el servidor');
      this.socket.emit('startMonitoring');
    } else {
      console.warn('ModemWebSocket: No conectado al servidor');
    }
  }

  /**
   * Detener monitoreo en el servidor
   */
  stopMonitoring() {
    if (this.socket && this.isConnected) {
      console.log('ModemWebSocket: Deteniendo monitoreo en el servidor');
      this.socket.emit('stopMonitoring');
    } else {
      console.warn('ModemWebSocket: No conectado al servidor');
    }
  }

  /**
   * Limpiar llamada actual
   */
  clearCurrentCall() {
    if (this.socket && this.isConnected) {
      console.log('ModemWebSocket: Limpiando llamada actual');
      this.socket.emit('clearCall');
    } else {
      console.warn('ModemWebSocket: No conectado al servidor');
    }
  }

  /**
   * Obtener estado del servidor
   */
  getServerStatus() {
    if (this.socket && this.isConnected) {
      this.socket.emit('getStatus');
    } else {
      console.warn('ModemWebSocket: No conectado al servidor');
    }
  }

  /**
   * Configurar callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      serverUrl: this.serverUrl
    };
  }
}

// Crear instancia singleton
const modemWebSocketClient = new ModemWebSocketClient();

export default modemWebSocketClient;
