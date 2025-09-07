import React, { useState } from 'react';
import { useTaxis } from '../contexts/TaxisContext';

const AdminPanel = () => {
  const { totalTaxis, updateConfig } = useTaxis();
  const [newTotal, setNewTotal] = useState(totalTaxis);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = async () => {
    if (newTotal < 1 || newTotal > 100) {
      alert('El número de taxis debe estar entre 1 y 100');
      return;
    }

    setLoading(true);
    try {
      await updateConfig(newTotal);
      alert('Configuración actualizada correctamente');
    } catch (error) {
      alert('Error actualizando configuración');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <button 
        className="admin-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        ⚙️ Administración
      </button>
      
      {isOpen && (
        <div className="admin-panel-popup">
          <div className="admin-panel">
            <div className="admin-header">
              <h3>Panel de Administración</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="totalTaxis">Número total de taxis:</label>
              <input
                type="number"
                id="totalTaxis"
                className="config-input"
                value={newTotal}
                onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
                min="1"
                max="100"
              />
              <button
                onClick={handleUpdate}
                className="update-button"
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Configuración'}
              </button>
            </div>
            <div className="config-info">
              Configuración actual: {totalTaxis} taxis
            </div>
            <div className="admin-actions">
              <button className="btn-stats">📊 Estadísticas</button>
              <button className="btn-export">📤 Exportar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
