import React from 'react';
import { logout } from '../firebase/auth';
import { useTaxis } from '../contexts/TaxisContext';

const Header = ({ user }) => {
  const { totalTaxis, updateConfig } = useTaxis();
  const [newTotal, setNewTotal] = React.useState(totalTaxis);
  const [loading, setLoading] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const handleUpdateConfig = async () => {
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

  const getCurrentDateTime = () => {
    const now = new Date();
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return now.toLocaleString('es-EC', options);
  };

  const [dateTime, setDateTime] = React.useState(getCurrentDateTime());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getCurrentDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1>Sigell</h1>
        <span className="datetime">{dateTime}</span>
      </div>
      <div className="header-right">
        <div className="user-info">
          Usuario: {user?.email} ({user?.email === 'admin@sigell.com' ? 'ADMIN' : 'OPERADOR'})
        </div>
        {user?.email === 'admin@sigell.com' && (
          <div className="admin-section-header">
            <button 
              className="admin-toggle-btn-header"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              title="Panel de Administración"
            >
              ⚙️
            </button>
            
            {isAdminOpen && (
              <div className="admin-panel-popup-header">
                <div className="admin-panel-header">
                  <div className="admin-header">
                    <h3>Panel de Administración</h3>
                    <button 
                      className="close-btn"
                      onClick={() => setIsAdminOpen(false)}
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
                      onClick={handleUpdateConfig}
                      className="update-button"
                      disabled={loading}
                    >
                      {loading ? 'Actualizando...' : 'Actualizar'}
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
        )}
        <button onClick={handleLogout} className="signout-button">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;
