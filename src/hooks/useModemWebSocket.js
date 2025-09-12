import { useState, useEffect, useCallback } from 'react';
import modemWebSocketClient from '../utils/modemWebSocket';

/**
 * Hook personalizado para usar el WebSocket del modem
 * Conecta con el servidor del modem para recibir llamadas en tiempo real
 */
export const useModemWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Callback para cuando se detecta una llamada
  const handleCallDetected = useCallback((callInfo) => {
    console.log('useModemWebSocket: Llamada detectada:', callInfo);
    setCurrentCall(callInfo);
    setError(null);
  }, []);

  // Callback para cuando termina una llamada
  const handleCallEnded = useCallback((callInfo) => {
    console.log('useModemWebSocket: Llamada terminada:', callInfo);
    setCurrentCall(null);
  }, []);

  // Callback para cambios de estado
  const handleStatusChange = useCallback((status, serverData) => {
    console.log('useModemWebSocket: Estado cambiado:', status);
    
    switch (status) {
      case 'connected':
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        if (serverData) {
          setServerStatus(serverData);
        }
        break;
      case 'disconnected':
        setIsConnected(false);
        setConnectionStatus('disconnected');
        break;
      default:
        setConnectionStatus(status);
    }
  }, []);

  // Callback para errores
  const handleError = useCallback((error) => {
    console.error('useModemWebSocket: Error:', error);
    setError(error.message || 'Error de conexión con el servidor del modem');
    setConnectionStatus('error');
  }, []);

  // Conectar al servidor
  const connect = useCallback(() => {
    try {
      modemWebSocketClient.setCallbacks({
        onCallDetected: handleCallDetected,
        onCallEnded: handleCallEnded,
        onStatusChange: handleStatusChange,
        onError: handleError
      });

      modemWebSocketClient.connect();
      setConnectionStatus('connecting');
      setError(null);
      
      console.log('useModemWebSocket: Conectando al servidor del modem');
    } catch (error) {
      console.error('useModemWebSocket: Error conectando:', error);
      setError('Error conectando al servidor del modem');
      setConnectionStatus('error');
    }
  }, [handleCallDetected, handleCallEnded, handleStatusChange, handleError]);

  // Desconectar del servidor
  const disconnect = useCallback(() => {
    try {
      modemWebSocketClient.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setCurrentCall(null);
      setServerStatus(null);
      setError(null);
      
      console.log('useModemWebSocket: Desconectado del servidor del modem');
    } catch (error) {
      console.error('useModemWebSocket: Error desconectando:', error);
      setError('Error desconectando del servidor del modem');
    }
  }, []);

  // Iniciar monitoreo
  const startMonitoring = useCallback(() => {
    try {
      modemWebSocketClient.startMonitoring();
      console.log('useModemWebSocket: Monitoreo iniciado');
    } catch (error) {
      console.error('useModemWebSocket: Error iniciando monitoreo:', error);
      setError('Error iniciando monitoreo del modem');
    }
  }, []);

  // Detener monitoreo
  const stopMonitoring = useCallback(() => {
    try {
      modemWebSocketClient.stopMonitoring();
      console.log('useModemWebSocket: Monitoreo detenido');
    } catch (error) {
      console.error('useModemWebSocket: Error deteniendo monitoreo:', error);
      setError('Error deteniendo monitoreo del modem');
    }
  }, []);

  // Limpiar llamada actual
  const clearCurrentCall = useCallback(() => {
    try {
      modemWebSocketClient.clearCurrentCall();
      setCurrentCall(null);
      console.log('useModemWebSocket: Llamada actual limpiada');
    } catch (error) {
      console.error('useModemWebSocket: Error limpiando llamada:', error);
      setError('Error limpiando llamada actual');
    }
  }, []);

  // Obtener estado del servidor
  const getServerStatus = useCallback(() => {
    try {
      modemWebSocketClient.getServerStatus();
      console.log('useModemWebSocket: Solicitando estado del servidor');
    } catch (error) {
      console.error('useModemWebSocket: Error obteniendo estado:', error);
      setError('Error obteniendo estado del servidor');
    }
  }, []);

  // Obtener estado de conexión
  const getConnectionStatus = useCallback(() => {
    return modemWebSocketClient.getConnectionStatus();
  }, []);

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return {
    // Estado
    isConnected,
    currentCall,
    serverStatus,
    error,
    connectionStatus,
    
    // Acciones
    connect,
    disconnect,
    startMonitoring,
    stopMonitoring,
    clearCurrentCall,
    getServerStatus,
    getConnectionStatus
  };
};
