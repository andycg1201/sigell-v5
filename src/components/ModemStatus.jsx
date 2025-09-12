import React from 'react';
import { useModemMonitor } from '../hooks/useModemMonitor';

/**
 * Componente para mostrar el estado del modem y llamadas entrantes
 */
const ModemStatus = ({ onCallDetected }) => {
  const {
    isMonitoring,
    currentCall,
    error,
    status,
    startMonitoring,
    stopMonitoring,
    clearCurrentCall
  } = useModemMonitor();

  // Efecto para notificar cuando se detecta una llamada
  React.useEffect(() => {
    if (currentCall && onCallDetected) {
      onCallDetected(currentCall);
    }
  }, [currentCall, onCallDetected]);

  // Función simplificada para iniciar monitoreo (sin archivos locales)
  const handleStartMonitoring = () => {
    console.log('ModemStatus: Iniciando monitoreo (modo simplificado)');
    // En lugar de monitorear archivos, solo cambiar el estado
    startMonitoring();
  };

  // Función para obtener el color del estado
  const getStatusColor = () => {
    switch (status) {
      case 'monitoring':
        return '#28a745'; // Verde
      case 'incoming_call':
        return '#ffc107'; // Amarillo
      case 'error':
        return '#dc3545'; // Rojo
      case 'disconnected':
        return '#6c757d'; // Gris
      default:
        return '#6c757d';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = () => {
    switch (status) {
      case 'monitoring':
        return 'Monitoreando';
      case 'incoming_call':
        return 'Llamada entrante';
      case 'error':
        return 'Error';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="modem-status">
      <div className="modem-status-header">
        <h3>📞 Estado del Modem</h3>
        <div className="modem-controls">
          {!isMonitoring ? (
            <button 
              onClick={handleStartMonitoring}
              className="btn btn-success btn-sm"
              title="Iniciar monitoreo del modem (modo simplificado)"
            >
              ▶️ Iniciar
            </button>
          ) : (
            <button 
              onClick={stopMonitoring}
              className="btn btn-danger btn-sm"
              title="Detener monitoreo del modem"
            >
              ⏹️ Detener
            </button>
          )}
        </div>
      </div>

      <div className="modem-status-info">
        <div className="status-indicator">
          <span 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {currentCall && (
          <div className="incoming-call">
            <div className="call-header">
              <span className="call-icon">📞</span>
              <span className="call-title">Llamada Entrante</span>
              <button 
                onClick={clearCurrentCall}
                className="btn btn-sm btn-outline-secondary"
                title="Limpiar llamada actual"
              >
                ✕
              </button>
            </div>
            
            <div className="call-info">
              <div className="call-number">
                <strong>Número:</strong> {currentCall.phoneNumber}
              </div>
              
              {currentCall.name && (
                <div className="call-name">
                  <strong>Nombre:</strong> {currentCall.name}
                </div>
              )}
              
              <div className="call-time">
                <strong>Hora:</strong> {new Date(currentCall.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modem-status {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
        }

        .modem-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .modem-status-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .modem-controls {
          display: flex;
          gap: 10px;
        }

        .modem-status-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-text {
          font-weight: 500;
          color: #495057;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc3545;
          background: #f8d7da;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        .incoming-call {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
        }

        .call-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .call-icon {
          font-size: 1.2rem;
        }

        .call-title {
          font-weight: 600;
          color: #856404;
          flex: 1;
        }

        .call-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .call-info div {
          color: #856404;
        }

        .call-info strong {
          color: #6c5ce7;
        }

        .btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-outline-secondary {
          background: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
        }

        .btn-outline-secondary:hover {
          background: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ModemStatus;
