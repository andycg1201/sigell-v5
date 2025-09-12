import React from 'react';
import { useModemWebSocket } from '../hooks/useModemWebSocket';

/**
 * Componente para mostrar el estado real del modem usando WebSocket
 * Conecta con el servidor del modem para recibir llamadas en tiempo real
 */
const ModemStatusReal = ({ onCallDetected }) => {
  const {
    isConnected,
    currentCall,
    serverStatus,
    error,
    connectionStatus,
    connect,
    disconnect,
    startMonitoring,
    stopMonitoring,
    clearCurrentCall
  } = useModemWebSocket();

  // Efecto para notificar cuando se detecta una llamada
  React.useEffect(() => {
    if (currentCall && onCallDetected) {
      onCallDetected(currentCall);
    }
  }, [currentCall, onCallDetected]);

  // Función para obtener el color del estado
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#28a745'; // Verde
      case 'connecting':
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
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado al servidor del modem';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Error de conexión';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="modem-status-real">
      <div className="modem-status-header">
        <h3>📞 Modem Real (WebSocket)</h3>
        <div className="modem-controls">
          {!isConnected ? (
            <button 
              onClick={connect}
              className="btn btn-success btn-sm"
              title="Conectar al servidor del modem"
            >
              🔌 Conectar
            </button>
          ) : (
            <button 
              onClick={disconnect}
              className="btn btn-danger btn-sm"
              title="Desconectar del servidor del modem"
            >
              🔌 Desconectar
            </button>
          )}
          
          {isConnected && (
            <>
              <button 
                onClick={startMonitoring}
                className="btn btn-primary btn-sm"
                title="Iniciar monitoreo del modem"
              >
                ▶️ Iniciar
              </button>
              <button 
                onClick={stopMonitoring}
                className="btn btn-warning btn-sm"
                title="Detener monitoreo del modem"
              >
                ⏹️ Detener
              </button>
            </>
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

        {serverStatus && (
          <div className="server-info">
            <div className="server-item">
              <strong>Servidor:</strong> {serverStatus.xmlPath}
            </div>
            <div className="server-item">
              <strong>Monitoreando:</strong> {serverStatus.isMonitoring ? 'Sí' : 'No'}
            </div>
            {serverStatus.lastFileSize > 0 && (
              <div className="server-item">
                <strong>Último archivo:</strong> {serverStatus.lastFileSize} bytes
              </div>
            )}
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

      <div className="modem-instructions">
        <h4>📋 Instrucciones:</h4>
        <ol>
          <li><strong>Conectar:</strong> Hacer clic en "Conectar" para conectar al servidor del modem</li>
          <li><strong>Iniciar:</strong> Hacer clic en "Iniciar" para comenzar a monitorear llamadas</li>
          <li><strong>Modem:</strong> Asegúrate de que el servidor del modem esté ejecutándose</li>
          <li><strong>Llamadas:</strong> Las llamadas entrantes aparecerán automáticamente</li>
        </ol>
      </div>

      <style jsx>{`
        .modem-status-real {
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
          flex-wrap: wrap;
        }

        .modem-status-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
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

        .server-info {
          background: #e9ecef;
          border-radius: 4px;
          padding: 10px;
        }

        .server-item {
          margin-bottom: 5px;
          color: #495057;
          font-size: 0.9rem;
        }

        .server-item strong {
          color: #6c5ce7;
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

        .modem-instructions {
          background: #e9ecef;
          border-radius: 4px;
          padding: 15px;
        }

        .modem-instructions h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 1rem;
        }

        .modem-instructions ol {
          margin: 0;
          padding-left: 20px;
        }

        .modem-instructions li {
          margin-bottom: 5px;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .modem-instructions strong {
          color: #495057;
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

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background: #e0a800;
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

export default ModemStatusReal;
