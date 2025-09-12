import { useState, useEffect, useCallback } from 'react';
import modemMonitor from '../utils/modemMonitor';

/**
 * Hook personalizado para monitorear llamadas del modem
 */
export const useModemMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');

  // Callback para cuando se detecta una llamada
  const handleCallDetected = useCallback((callInfo) => {
    console.log('useModemMonitor: Llamada detectada:', callInfo);
    setCurrentCall(callInfo);
    setStatus('incoming_call');
    setError(null);
  }, []);

  // Callback para cuando termina una llamada
  const handleCallEnded = useCallback((callInfo) => {
    console.log('useModemMonitor: Llamada terminada:', callInfo);
    setCurrentCall(null);
    setStatus('idle');
  }, []);

  // Callback para errores
  const handleError = useCallback((error) => {
    console.error('useModemMonitor: Error:', error);
    setError(error.message || 'Error en el monitor del modem');
    setStatus('error');
  }, []);

  // Iniciar monitoreo
  const startMonitoring = useCallback(() => {
    try {
      modemMonitor.setCallbacks({
        onCallDetected: handleCallDetected,
        onCallEnded: handleCallEnded,
        onError: handleError
      });

      modemMonitor.startMonitoring();
      setIsMonitoring(true);
      setStatus('monitoring');
      setError(null);
      
      console.log('useModemMonitor: Monitoreo iniciado');
    } catch (error) {
      console.error('useModemMonitor: Error iniciando monitoreo:', error);
      setError('Error iniciando monitoreo del modem');
      setStatus('error');
    }
  }, [handleCallDetected, handleCallEnded, handleError]);

  // Detener monitoreo
  const stopMonitoring = useCallback(() => {
    try {
      modemMonitor.stopMonitoring();
      setIsMonitoring(false);
      setStatus('disconnected');
      setCurrentCall(null);
      setError(null);
      
      console.log('useModemMonitor: Monitoreo detenido');
    } catch (error) {
      console.error('useModemMonitor: Error deteniendo monitoreo:', error);
      setError('Error deteniendo monitoreo del modem');
    }
  }, []);

  // Limpiar llamada actual
  const clearCurrentCall = useCallback(() => {
    setCurrentCall(null);
    setStatus('idle');
  }, []);

  // Obtener estado del monitor
  const getMonitorStatus = useCallback(() => {
    return modemMonitor.getStatus();
  }, []);

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [isMonitoring, stopMonitoring]);

  return {
    // Estado
    isMonitoring,
    currentCall,
    error,
    status,
    
    // Acciones
    startMonitoring,
    stopMonitoring,
    clearCurrentCall,
    getMonitorStatus
  };
};
