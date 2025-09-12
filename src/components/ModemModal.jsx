import React, { useState, useEffect } from 'react';
import ModemStatus from './ModemStatus';
import ModemStatusReal from './ModemStatusReal';
import ModemTestPanel from './ModemTestPanel';

/**
 * Modal que contiene todo el sistema del modem
 * Incluye: ModemStatus, ModemStatusReal, ModemTestPanel
 */
const ModemModal = ({ isOpen, onClose, onCallDetected }) => {
  const [useRealModem, setUseRealModem] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Función para manejar llamadas detectadas del modem
  const handleModemCallDetected = (callInfo) => {
    console.log('ModemModal: Llamada detectada:', callInfo);
    
    if (onCallDetected) {
      onCallDetected(callInfo);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    onClose();
  };

  // Función para alternar entre modem real y simulado
  const toggleModemType = () => {
    setUseRealModem(!useRealModem);
  };

  // Función para alternar panel de prueba
  const toggleTestPanel = () => {
    setShowTestPanel(!showTestPanel);
  };

  // Efecto para solicitar permisos de notificación al abrir el modal
  useEffect(() => {
    if (isOpen && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modem-modal-overlay" onClick={handleClose}>
      <div className="modem-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modem-modal-header">
          <h2>📞 Sistema del Modem</h2>
          <button 
            onClick={handleClose}
            className="close-button"
            title="Cerrar modal del modem"
          >
            ✕
          </button>
        </div>

        <div className="modem-modal-content">
          {/* Controles principales */}
          <div className="modem-controls-section">
            <div className="control-group">
              <button
                onClick={toggleModemType}
                className={`toggle-button ${useRealModem ? 'active' : ''}`}
                title={useRealModem ? 'Cambiar a Modem Simulado' : 'Cambiar a Modem Real'}
              >
                {useRealModem ? '🔄 Modem Simulado' : '🔌 Modem Real'}
              </button>
              
              <button
                onClick={toggleTestPanel}
                className={`toggle-button ${showTestPanel ? 'active' : ''}`}
                title={showTestPanel ? 'Ocultar Panel de Prueba' : 'Mostrar Panel de Prueba'}
              >
                {showTestPanel ? '🧪 Ocultar Pruebas' : '🧪 Mostrar Pruebas'}
              </button>
            </div>
          </div>

          {/* Componente del modem (real o simulado) */}
          <div className="modem-component-section">
            {useRealModem ? (
              <ModemStatusReal onCallDetected={handleModemCallDetected} />
            ) : (
              <ModemStatus onCallDetected={handleModemCallDetected} />
            )}
          </div>

          {/* Panel de prueba */}
          {showTestPanel && (
            <div className="test-panel-section">
              <ModemTestPanel onSimulateCall={handleModemCallDetected} />
            </div>
          )}

          {/* Información del sistema */}
          <div className="modem-info-section">
            <h3>ℹ️ Información del Sistema</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Modo actual:</strong> {useRealModem ? 'Modem Real (WebSocket)' : 'Modem Simulado'}
              </div>
              <div className="info-item">
                <strong>Panel de prueba:</strong> {showTestPanel ? 'Visible' : 'Oculto'}
              </div>
              <div className="info-item">
                <strong>Notificaciones:</strong> {Notification.permission === 'granted' ? 'Habilitadas' : 'Deshabilitadas'}
              </div>
              <div className="info-item">
                <strong>Estado:</strong> {isOpen ? 'Modal abierto' : 'Modal cerrado'}
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="modem-instructions-section">
            <h3>📋 Instrucciones de Uso</h3>
            <div className="instructions-content">
              <h4>Para Modem Simulado:</h4>
              <ol>
                <li>Hacer clic en "🧪 Mostrar Pruebas"</li>
                <li>Configurar número de prueba</li>
                <li>Hacer clic en "📞 Simular 1 Llamada"</li>
                <li>El modal se abrirá automáticamente</li>
              </ol>
              
              <h4>Para Modem Real:</h4>
              <ol>
                <li>Cambiar a "🔌 Modem Real"</li>
                <li>Ejecutar servidor del modem: <code>cd modem-server && npm start</code></li>
                <li>Ejecutar modem-console.exe: <code>cd modem && .\modem-console.exe</code></li>
                <li>Hacer clic en "Conectar" y "Iniciar"</li>
                <li>Hacer llamada real al número conectado</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="modem-modal-footer">
          <button 
            onClick={handleClose}
            className="btn btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        .modem-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modem-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modem-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .modem-modal-header h2 {
          margin: 0;
          color: #495057;
          font-size: 1.5rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #e9ecef;
          color: #495057;
        }

        .modem-modal-content {
          padding: 20px;
        }

        .modem-controls-section {
          margin-bottom: 20px;
        }

        .control-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toggle-button {
          padding: 10px 16px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .toggle-button:hover {
          border-color: #007bff;
          color: #007bff;
        }

        .toggle-button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .modem-component-section {
          margin-bottom: 20px;
        }

        .test-panel-section {
          margin-bottom: 20px;
        }

        .modem-info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .modem-info-section h3 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .info-item {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .info-item strong {
          color: #495057;
        }

        .modem-instructions-section {
          background: #e9ecef;
          border-radius: 8px;
          padding: 15px;
        }

        .modem-instructions-section h3 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .instructions-content h4 {
          margin: 15px 0 10px 0;
          color: #495057;
          font-size: 1rem;
        }

        .instructions-content ol {
          margin: 0 0 15px 0;
          padding-left: 20px;
        }

        .instructions-content li {
          margin-bottom: 5px;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .instructions-content code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          color: #e83e8c;
        }

        .modem-modal-footer {
          padding: 20px;
          border-top: 1px solid #dee2e6;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
          text-align: right;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default ModemModal;
