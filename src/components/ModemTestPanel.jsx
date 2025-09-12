import React, { useState } from 'react';
import modemSimulator from '../utils/modemSimulator';

/**
 * Panel de prueba para el sistema del modem
 * Permite simular llamadas entrantes para probar la funcionalidad
 */
const ModemTestPanel = ({ onSimulateCall }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [testNumber, setTestNumber] = useState('+573001234567');
  const [simulationCount, setSimulationCount] = useState(3);
  const [interval, setInterval] = useState(5000);

  // Simular una llamada individual
  const handleSimulateSingleCall = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    try {
      const result = await modemSimulator.simulateIncomingCall(testNumber);
      console.log('ModemTestPanel: Llamada simulada:', result);
      
      if (onSimulateCall) {
        onSimulateCall(result);
      }
    } catch (error) {
      console.error('ModemTestPanel: Error simulando llamada:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Simular múltiples llamadas
  const handleSimulateMultipleCalls = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    try {
      await modemSimulator.simulateMultipleCalls(simulationCount, interval);
      console.log(`ModemTestPanel: ${simulationCount} llamadas simuladas`);
    } catch (error) {
      console.error('ModemTestPanel: Error simulando múltiples llamadas:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Limpiar archivo XML
  const handleClearXML = async () => {
    try {
      await modemSimulator.clearXMLFile();
      console.log('ModemTestPanel: Archivo XML limpiado');
    } catch (error) {
      console.error('ModemTestPanel: Error limpiando XML:', error);
    }
  };

  return (
    <div className="modem-test-panel">
      <div className="test-panel-header">
        <h3>🧪 Panel de Prueba del Modem</h3>
        <p className="test-description">
          Simula llamadas entrantes para probar la funcionalidad del sistema
        </p>
      </div>

      <div className="test-controls">
        <div className="control-group">
          <label htmlFor="testNumber">Número de prueba:</label>
          <input
            id="testNumber"
            type="tel"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            placeholder="+573001234567"
            className="form-control"
          />
        </div>

        <div className="control-group">
          <label htmlFor="simulationCount">Cantidad de llamadas:</label>
          <input
            id="simulationCount"
            type="number"
            value={simulationCount}
            onChange={(e) => setSimulationCount(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="form-control"
          />
        </div>

        <div className="control-group">
          <label htmlFor="interval">Intervalo (ms):</label>
          <input
            id="interval"
            type="number"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value) || 1000)}
            min="1000"
            max="30000"
            step="1000"
            className="form-control"
          />
        </div>
      </div>

      <div className="test-buttons">
        <button
          onClick={handleSimulateSingleCall}
          disabled={isSimulating}
          className="btn btn-primary"
        >
          {isSimulating ? '⏳ Simulando...' : '📞 Simular 1 Llamada'}
        </button>

        <button
          onClick={handleSimulateMultipleCalls}
          disabled={isSimulating}
          className="btn btn-secondary"
        >
          {isSimulating ? '⏳ Simulando...' : `📞 Simular ${simulationCount} Llamadas`}
        </button>

        <button
          onClick={handleClearXML}
          className="btn btn-warning"
        >
          🗑️ Limpiar XML
        </button>
      </div>

      <div className="test-info">
        <h4>ℹ️ Información:</h4>
        <ul>
          <li><strong>Llamada individual:</strong> Simula una llamada con el número especificado</li>
          <li><strong>Múltiples llamadas:</strong> Simula varias llamadas con intervalo configurable</li>
          <li><strong>Limpiar XML:</strong> Simula el fin de una llamada</li>
          <li><strong>Archivo XML:</strong> Se genera en la carpeta temporal del sistema</li>
        </ul>
      </div>

      <style jsx>{`
        .modem-test-panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
        }

        .test-panel-header h3 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 1.2rem;
        }

        .test-description {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0 0 20px 0;
        }

        .test-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .control-group label {
          font-weight: 500;
          color: #495057;
          font-size: 0.9rem;
        }

        .form-control {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .test-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover:not(:disabled) {
          background: #e0a800;
        }

        .test-info {
          background: #e9ecef;
          border-radius: 4px;
          padding: 15px;
        }

        .test-info h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 1rem;
        }

        .test-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .test-info li {
          margin-bottom: 5px;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .test-info strong {
          color: #495057;
        }
      `}</style>
    </div>
  );
};

export default ModemTestPanel;
