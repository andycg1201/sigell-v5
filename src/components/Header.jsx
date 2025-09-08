import React from 'react';
import { logout } from '../firebase/auth';
import { useTaxis } from '../contexts/TaxisContext';
import { useBases } from '../contexts/BasesContext';
import { useNovedades } from '../contexts/NovedadesContext';

const Header = ({ user }) => {
  const { totalTaxis, updateConfig } = useTaxis();
  const { bases, updateConfig: updateBasesConfig } = useBases();
  const { novedadesConfig, updateConfig: updateNovedadesConfig } = useNovedades();
  const [newTotal, setNewTotal] = React.useState(totalTaxis);
  const [loading, setLoading] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [editingBases, setEditingBases] = React.useState(false);
  const [tempBases, setTempBases] = React.useState([]);
  const [editingNovedades, setEditingNovedades] = React.useState(false);
  const [tempNovedades, setTempNovedades] = React.useState([]);

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

  const handleEditBases = () => {
    setTempBases([...bases]);
    setEditingBases(true);
  };

  const handleSaveBases = async () => {
    setLoading(true);
    try {
      await updateBasesConfig(tempBases);
      setEditingBases(false);
      alert('Bases actualizadas correctamente');
    } catch (error) {
      alert('Error actualizando bases');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBases = () => {
    setTempBases([]);
    setEditingBases(false);
  };

  const handleBaseChange = (index, field, value) => {
    const newBases = [...tempBases];
    newBases[index] = { ...newBases[index], [field]: value };
    setTempBases(newBases);
  };

  const addBase = () => {
    if (tempBases.length >= 10) {
      alert('Máximo 10 bases permitidas');
      return;
    }
    const newId = Math.max(...tempBases.map(b => b.id), 0) + 1;
    setTempBases([...tempBases, { id: newId, nombre: `BASE ${newId}`, direccion: '' }]);
  };

  const removeBase = (index) => {
    if (tempBases.length <= 1) {
      alert('Debe haber al menos una base');
      return;
    }
    setTempBases(tempBases.filter((_, i) => i !== index));
  };

  // Funciones para manejar novedades
  const handleEditNovedades = () => {
    setTempNovedades([...novedadesConfig.novedades]);
    setEditingNovedades(true);
  };

  const handleSaveNovedades = async () => {
    setLoading(true);
    try {
      await updateNovedadesConfig({ ...novedadesConfig, novedades: tempNovedades });
      setEditingNovedades(false);
      alert('Novedades actualizadas correctamente');
    } catch (error) {
      console.error('Error actualizando novedades:', error);
      alert('Error actualizando novedades');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNovedades = () => {
    setEditingNovedades(false);
    setTempNovedades([]);
  };

  const handleNovedadChange = (index, field, value) => {
    const newNovedades = [...tempNovedades];
    newNovedades[index] = { ...newNovedades[index], [field]: value };
    setTempNovedades(newNovedades);
  };

  const addNovedad = () => {
    if (tempNovedades.length >= 20) {
      alert('Máximo 20 novedades permitidas');
      return;
    }
    const newId = Math.max(...tempNovedades.map(n => parseInt(n.codigo.replace('B', '')) || 0), 0) + 1;
    setTempNovedades([...tempNovedades, { codigo: `B${newId.toString().padStart(2, '0')}`, descripcion: '', activa: true }]);
  };

  const removeNovedad = (index) => {
    if (tempNovedades.length <= 1) {
      alert('Debe haber al menos una novedad');
      return;
    }
    setTempNovedades(tempNovedades.filter((_, i) => i !== index));
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
                  
                  {/* Configuración de Bases */}
                  <div className="bases-config-section">
                    <div className="section-header">
                      <h4>Configuración de Bases</h4>
                      <button 
                        className="edit-bases-btn"
                        onClick={handleEditBases}
                        disabled={editingBases}
                      >
                        {editingBases ? 'Editando...' : '✏️ Editar Bases'}
                      </button>
                    </div>
                    
                    {editingBases ? (
                      <div className="bases-editor">
                        {tempBases.map((base, index) => (
                          <div key={base.id} className="base-editor-row">
                            <input
                              type="text"
                              value={base.nombre}
                              onChange={(e) => handleBaseChange(index, 'nombre', e.target.value)}
                              placeholder="Nombre de la base"
                              className="base-input"
                            />
                            <input
                              type="text"
                              value={base.direccion}
                              onChange={(e) => handleBaseChange(index, 'direccion', e.target.value)}
                              placeholder="Dirección"
                              className="base-input"
                            />
                            <button 
                              className="remove-base-btn"
                              onClick={() => removeBase(index)}
                              disabled={tempBases.length <= 1}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        
                        <div className="bases-actions">
                          <button 
                            className="add-base-btn"
                            onClick={addBase}
                            disabled={tempBases.length >= 10}
                          >
                            ➕ Agregar Base
                          </button>
                          <div className="bases-save-cancel">
                            <button 
                              className="save-bases-btn"
                              onClick={handleSaveBases}
                              disabled={loading}
                            >
                              {loading ? 'Guardando...' : '💾 Guardar'}
                            </button>
                            <button 
                              className="cancel-bases-btn"
                              onClick={handleCancelBases}
                              disabled={loading}
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bases-list">
                        {bases.map((base) => (
                          <div key={base.id} className="base-item">
                            <strong>{base.nombre}</strong>
                            <span>{base.direccion || 'Sin dirección'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Configuración de Novedades */}
                  <div className="novedades-config-section">
                    <div className="section-header">
                      <h4>🚨 Configuración de Novedades</h4>
                      <button 
                        className="edit-novedades-btn"
                        onClick={handleEditNovedades}
                        disabled={editingNovedades}
                      >
                        {editingNovedades ? 'Editando...' : '✏️ Editar Novedades'}
                      </button>
                    </div>
                    
                    {editingNovedades ? (
                      <div className="novedades-editor">
                        {tempNovedades.map((novedad, index) => (
                          <div key={index} className="novedad-editor-row">
                            <input
                              type="text"
                              className="novedad-input codigo"
                              value={novedad.codigo}
                              onChange={(e) => handleNovedadChange(index, 'codigo', e.target.value)}
                              placeholder="Código (ej: B54)"
                            />
                            <input
                              type="text"
                              className="novedad-input descripcion"
                              value={novedad.descripcion}
                              onChange={(e) => handleNovedadChange(index, 'descripcion', e.target.value)}
                              placeholder="Descripción"
                            />
                            <label className="novedad-checkbox">
                              <input
                                type="checkbox"
                                checked={novedad.activa}
                                onChange={(e) => handleNovedadChange(index, 'activa', e.target.checked)}
                              />
                              Activa
                            </label>
                            <button 
                              className="remove-novedad-btn"
                              onClick={() => removeNovedad(index)}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        
                        <div className="novedades-actions">
                          <button className="add-novedad-btn" onClick={addNovedad}>
                            ➕ Agregar Novedad
                          </button>
                        </div>
                        
                        <div className="novedades-save-cancel">
                          <button 
                            className="save-novedades-btn"
                            onClick={handleSaveNovedades}
                            disabled={loading}
                          >
                            {loading ? 'Guardando...' : '💾 Guardar'}
                          </button>
                          <button 
                            className="cancel-novedades-btn"
                            onClick={handleCancelNovedades}
                            disabled={loading}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="novedades-list">
                        {novedadesConfig.novedades?.map((novedad, index) => (
                          <div key={index} className="novedad-item">
                            <strong>{novedad.codigo}</strong>
                            <span>{novedad.descripcion || 'Sin descripción'}</span>
                            <span className={`status ${novedad.activa ? 'activa' : 'inactiva'}`}>
                              {novedad.activa ? '✅' : '❌'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
