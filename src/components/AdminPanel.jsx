import React, { useState } from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { useBases } from '../contexts/BasesContext';
import { useNovedades } from '../contexts/NovedadesContext';
import { useCierre } from '../contexts/CierreContext';
import { debugEstadoPedidos, forzarCierreDelDia, resetearContadores } from '../firebase/cierre';
import { getMotivosInhabilitacion, updateMotivosInhabilitacion } from '../firebase/inhabilitaciones';
import { forzarActualizacionNovedades } from '../firebase/novedades';
import ArchivosModal from './ArchivosModal';
import LimpiezaModal from './LimpiezaModal';

/**
 * Panel administrativo organizado con pestañas
 * Agrupa todas las opciones de administración por categorías
 */
const AdminPanel = ({ isOpen, onClose }) => {
  const { totalTaxis, taxiBloqueados, updateConfig } = useTaxis();
  const { bases, updateConfig: updateBasesConfig } = useBases();
  const { novedadesConfig, updateConfig: updateNovedadesConfig } = useNovedades();
  const { estadoCierre, ejecutarCierreManual, verificarCierreAutomatico, limpiarCache, debugEstado, debugCierreAutomatico, limpiarHuerfanos, limpiarTodos } = useCierre();
  
  const [activeTab, setActiveTab] = useState('sistema');
  const [newTotal, setNewTotal] = useState(totalTaxis);
  const [newTaxiBloqueados, setNewTaxiBloqueados] = useState(taxiBloqueados);
  const [loading, setLoading] = useState(false);
  const [editingBases, setEditingBases] = useState(false);
  const [tempBases, setTempBases] = useState([]);
  const [editingNovedades, setEditingNovedades] = useState(false);
  const [tempNovedades, setTempNovedades] = useState([]);
  const [showArchivosModal, setShowArchivosModal] = useState(false);
  const [showLimpiezaModal, setShowLimpiezaModal] = useState(false);
  const [editingMotivos, setEditingMotivos] = useState(false);
  const [tempMotivos, setTempMotivos] = useState([]);
  const [motivosConfig, setMotivosConfig] = useState(null);

  // Funciones de gestión del sistema
  const handleCierreManual = async () => {
    setLoading(true);
    try {
      await ejecutarCierreManual();
    } finally {
      setLoading(false);
    }
  };

  const handleForzarCierre = async () => {
    if (confirm('¿Estás seguro de forzar el cierre del día?')) {
      setLoading(true);
      try {
        await forzarCierreDelDia();
        alert('Cierre forzado ejecutado correctamente');
      } catch (error) {
        alert('Error ejecutando cierre forzado');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForzarActualizacionNovedades = async () => {
    if (confirm('¿Estás seguro de forzar la actualización de novedades? Esto reemplazará la configuración actual.')) {
      setLoading(true);
      try {
        await forzarActualizacionNovedades();
        alert('Configuración de novedades actualizada correctamente');
        // Recargar la página para aplicar los cambios
        window.location.reload();
      } catch (error) {
        console.error('Error forzando actualización de novedades:', error);
        alert('Error actualizando configuración de novedades');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerificarCierreAutomatico = async () => {
    setLoading(true);
    try {
      console.log('Verificando cierre automático manualmente...');
      await verificarCierreAutomatico();
      alert('Verificación de cierre automático completada');
    } catch (error) {
      alert('Error en verificación de cierre automático');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetearContadores = async () => {
    if (confirm('¿Estás seguro de resetear todos los contadores a cero?')) {
      setLoading(true);
      try {
        console.log('Reseteando contadores manualmente...');
        await resetearContadores();
        alert('Contadores reseteados correctamente');
      } catch (error) {
        alert('Error reseteando contadores');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };


  const handleDebugEstado = async () => {
    try {
      await debugEstado();
    } catch (error) {
      console.error('Error en debug:', error);
    }
  };

  const handleDebugCierreAutomatico = async () => {
    try {
      console.log('Ejecutando debug de cierre automático...');
      const resultado = await debugCierreAutomatico();
      alert(`Debug completado. Revisa la consola para más detalles.\nHora: ${resultado.hora}:${resultado.minuto}\nEn ventana medianoche: ${resultado.enVentanaMedianoche}`);
    } catch (error) {
      alert('Error en debug de cierre automático');
      console.error('Error en debug cierre automático:', error);
    }
  };

  const handleLimpiarCache = () => {
    limpiarCache();
    alert('Cache limpiado correctamente');
  };

  const handleLimpiarHuerfanos = async () => {
    if (confirm('¿Estás seguro de limpiar pedidos huérfanos?')) {
      setLoading(true);
      try {
        await limpiarHuerfanos();
        alert('Pedidos huérfanos limpiados correctamente');
      } catch (error) {
        alert('Error limpiando pedidos huérfanos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLimpiarTodos = async () => {
    if (confirm('¿Estás seguro de limpiar TODOS los pedidos? Esta acción no se puede deshacer.')) {
      setLoading(true);
      try {
        await limpiarTodos();
        alert('Todos los pedidos han sido limpiados');
      } catch (error) {
        alert('Error limpiando todos los pedidos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Funciones de configuración
  const handleUpdateConfig = async () => {
    if (newTotal < 1 || newTotal > 100) {
      alert('El número de taxis debe estar entre 1 y 100');
      return;
    }

    // Validar números de taxis bloqueados
    const bloqueadosArray = newTaxiBloqueados
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num) && num > 0);
    
    const maxBloqueado = Math.max(...bloqueadosArray, 0);
    if (maxBloqueado > newTotal) {
      alert(`Los taxis bloqueados no pueden ser mayores al total (${newTotal})`);
      return;
    }

    setLoading(true);
    try {
      await updateConfig(newTotal, newTaxiBloqueados);
      alert('Configuración actualizada correctamente');
    } catch (error) {
      alert('Error actualizando configuración');
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const handleSaveNovedades = async () => {
    setLoading(true);
    try {
      await updateNovedadesConfig({ ...novedadesConfig, novedades: tempNovedades });
      setEditingNovedades(false);
      alert('Novedades actualizadas correctamente');
    } catch (error) {
      alert('Error actualizando novedades');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveMotivos = async () => {
    setLoading(true);
    try {
      await updateMotivosInhabilitacion({ ...motivosConfig, motivos: tempMotivos });
      setEditingMotivos(false);
      alert('Motivos actualizados correctamente');
    } catch (error) {
      alert('Error actualizando motivos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir modal del modem
  const handleOpenModemModal = () => {
    const event = new CustomEvent('toggleModemTest');
    window.dispatchEvent(event);
    onClose(); // Cerrar panel administrativo
  };

  if (!isOpen) return null;

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>⚙️ Panel Administrativo</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="admin-panel-content">
          {/* Pestañas */}
          <div className="admin-tabs">
            <button 
              className={`tab ${activeTab === 'sistema' ? 'active' : ''}`}
              onClick={() => setActiveTab('sistema')}
            >
              🔧 Sistema
            </button>
            <button 
              className={`tab ${activeTab === 'archivos' ? 'active' : ''}`}
              onClick={() => setActiveTab('archivos')}
            >
              🗂️ Archivos
            </button>
            <button 
              className={`tab ${activeTab === 'configuracion' ? 'active' : ''}`}
              onClick={() => setActiveTab('configuracion')}
            >
              ⚙️ Configuración
            </button>
            <button 
              className={`tab ${activeTab === 'herramientas' ? 'active' : ''}`}
              onClick={() => setActiveTab('herramientas')}
            >
              🛠️ Herramientas
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div className="admin-tab-content">
            {/* Pestaña Sistema */}
            {activeTab === 'sistema' && (
              <div className="tab-section">
                <h3>🔧 Gestión del Sistema</h3>
                <div className="admin-grid">
                  <div className="admin-card">
                    <h4>🔄 Cierre del Sistema</h4>
                    <div className="card-content">
                      <p>Estado: {estadoCierre.necesitaCierre ? 'Pendiente' : 'Al día'}</p>
                      <p>Último cierre: {estadoCierre.ultimoCierre}</p>
                      <button 
                        onClick={handleCierreManual}
                        disabled={loading || !estadoCierre.necesitaCierre}
                        className="btn btn-primary"
                      >
                        {loading ? '🔄 Procesando...' : '🔄 Cierre Manual'}
                      </button>
                      <button 
                        onClick={handleVerificarCierreAutomatico}
                        disabled={loading}
                        className="btn btn-secondary"
                        style={{ marginTop: '8px' }}
                      >
                        {loading ? '🔄 Verificando...' : '🔍 Verificar Cierre Auto'}
                      </button>
                      <button 
                        onClick={handleResetearContadores}
                        disabled={loading}
                        className="btn btn-warning"
                        style={{ marginTop: '8px' }}
                      >
                        {loading ? '🔄 Reseteando...' : '🔢 Resetear Contadores'}
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>⚡ Cierre Forzado</h4>
                    <div className="card-content">
                      <p>Fuerza el cierre del día actual</p>
                      <button 
                        onClick={handleForzarCierre}
                        disabled={loading}
                        className="btn btn-warning"
                      >
                        ⚡ Forzar Cierre
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🔍 Debug del Sistema</h4>
                    <div className="card-content">
                      <p>Verifica el estado del sistema</p>
                      <button 
                        onClick={handleDebugEstado}
                        className="btn btn-info"
                      >
                        🔍 Debug
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🕛 Debug Cierre Automático</h4>
                    <div className="card-content">
                      <p>Verifica el estado del cierre automático</p>
                      <button 
                        onClick={handleDebugCierreAutomatico}
                        className="btn btn-warning"
                      >
                        🕛 Debug Cierre
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🧹 Limpieza de Cache</h4>
                    <div className="card-content">
                      <p>Limpia el cache local del sistema</p>
                      <button 
                        onClick={handleLimpiarCache}
                        className="btn btn-secondary"
                      >
                        🧹 Limpiar Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña Archivos */}
            {activeTab === 'archivos' && (
              <div className="tab-section">
                <h3>🗂️ Gestión de Archivos y Datos</h3>
                <div className="admin-grid">
                  <div className="admin-card">
                    <h4>📁 Archivos del Sistema</h4>
                    <div className="card-content">
                      <p>Gestiona archivos y backups</p>
                      <button 
                        onClick={() => setShowArchivosModal(true)}
                        className="btn btn-primary"
                      >
                        📁 Archivos
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🗑️ Limpieza de Datos</h4>
                    <div className="card-content">
                      <p>Limpieza selectiva de datos</p>
                      <button 
                        onClick={() => setShowLimpiezaModal(true)}
                        className="btn btn-warning"
                      >
                        🧹 Limpieza Temporal
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🗑️ Pedidos Huérfanos</h4>
                    <div className="card-content">
                      <p>Archiva pedidos que quedaron después del cierre</p>
                      <button 
                        onClick={handleLimpiarHuerfanos}
                        disabled={loading}
                        className="btn btn-info"
                      >
                        🗑️ Limpiar Huérfanos
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🚨 Limpieza Total</h4>
                    <div className="card-content">
                      <p>Limpieza de emergencia - archiva TODOS los pedidos</p>
                      <button 
                        onClick={handleLimpiarTodos}
                        disabled={loading}
                        className="btn btn-danger"
                      >
                        🚨 Limpiar Todos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña Configuración */}
            {activeTab === 'configuracion' && (
              <div className="tab-section">
                <h3>⚙️ Configuración del Sistema</h3>
                <div className="admin-grid">
                  <div className="admin-card">
                    <h4>🚗 Configurar Taxis</h4>
                    <div className="card-content">
                      <p>Total actual: {totalTaxis} taxis</p>
                      <div className="input-group">
                        <input
                          type="number"
                          value={newTotal}
                          onChange={(e) => setNewTotal(parseInt(e.target.value) || 1)}
                          min="1"
                          max="100"
                          className="form-control"
                          placeholder="Número total de taxis"
                        />
                      </div>
                      <div className="input-group" style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          value={newTaxiBloqueados}
                          onChange={(e) => setNewTaxiBloqueados(e.target.value)}
                          className="form-control"
                          placeholder="Taxis bloqueados (ej: 21,31,45)"
                        />
                      </div>
                      <div className="input-group" style={{ marginTop: '10px' }}>
                        <button 
                          onClick={handleUpdateConfig}
                          disabled={loading}
                          className="btn btn-primary"
                        >
                          {loading ? '🔄' : '💾'} Actualizar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🏢 Configurar Bases</h4>
                    <div className="card-content">
                      <p>Bases configuradas: {bases.length}</p>
                      <button 
                        onClick={() => {
                          setEditingBases(true);
                          setTempBases([...bases]);
                        }}
                        className="btn btn-primary"
                      >
                        🏢 Configurar Bases
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>📋 Configurar Novedades</h4>
                    <div className="card-content">
                      <p>Novedades configuradas: {novedadesConfig?.novedades?.length || 0}</p>
                      <button 
                        onClick={() => {
                          setEditingNovedades(true);
                          setTempNovedades([...novedadesConfig.novedades]);
                        }}
                        className="btn btn-primary"
                      >
                        📋 Configurar Novedades
                      </button>
                      <button 
                        onClick={handleForzarActualizacionNovedades}
                        disabled={loading}
                        className="btn btn-warning"
                        style={{ marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}
                      >
                        🔄 Forzar Actualización Novedades
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>🚫 Configurar Motivos</h4>
                    <div className="card-content">
                      <p>Motivos configurados: {motivosConfig?.motivos?.length || 0}</p>
                      <button 
                        onClick={async () => {
                          const motivos = await getMotivosInhabilitacion();
                          setMotivosConfig(motivos);
                          setEditingMotivos(true);
                          setTempMotivos([...motivos.motivos]);
                        }}
                        className="btn btn-primary"
                      >
                        🚫 Configurar Motivos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña Herramientas */}
            {activeTab === 'herramientas' && (
              <div className="tab-section">
                <h3>🛠️ Herramientas Adicionales</h3>
                <div className="admin-grid">
                  <div className="admin-card">
                    <h4>📞 Sistema del Modem</h4>
                    <div className="card-content">
                      <p>Configurar y probar el sistema del modem</p>
                      <button 
                        onClick={handleOpenModemModal}
                        className="btn btn-primary"
                      >
                        📞 Sistema Modem
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>📊 Estadísticas</h4>
                    <div className="card-content">
                      <p>Ver estadísticas del sistema</p>
                      <button 
                        className="btn btn-info"
                        disabled
                      >
                        📊 Estadísticas (Próximamente)
                      </button>
                    </div>
                  </div>

                  <div className="admin-card">
                    <h4>📤 Exportar Datos</h4>
                    <div className="card-content">
                      <p>Exportar datos del sistema</p>
                      <button 
                        className="btn btn-success"
                        disabled
                      >
                        📤 Exportar (Próximamente)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <ArchivosModal
        isOpen={showArchivosModal}
        onClose={() => setShowArchivosModal(false)}
      />

      <LimpiezaModal
        isOpen={showLimpiezaModal}
        onClose={() => setShowLimpiezaModal(false)}
      />

      {/* Modal de edición de bases */}
      {editingBases && (
        <div className="modal-overlay" onClick={() => setEditingBases(false)}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏢 Configurar Bases</h3>
              <button onClick={() => setEditingBases(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="config-list">
                {tempBases.map((base, index) => (
                  <div key={base.id} className="config-item">
                    <input
                      type="text"
                      value={base.nombre}
                      onChange={(e) => {
                        const newBases = [...tempBases];
                        newBases[index].nombre = e.target.value;
                        setTempBases(newBases);
                      }}
                      className="config-input"
                      placeholder="Nombre de la base"
                    />
                    <input
                      type="text"
                      value={base.direccion}
                      onChange={(e) => {
                        const newBases = [...tempBases];
                        newBases[index].direccion = e.target.value;
                        setTempBases(newBases);
                      }}
                      className="config-input"
                      placeholder="Dirección"
                    />
                    <button
                      onClick={() => {
                        if (tempBases.length <= 1) {
                          alert('Debe haber al menos una base');
                          return;
                        }
                        const newBases = tempBases.filter((_, i) => i !== index);
                        setTempBases(newBases);
                      }}
                      className="btn-delete"
                      title="Eliminar base"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Botón para agregar nueva base */}
              <div className="add-item-section">
                <button
                  onClick={() => {
                    if (tempBases.length >= 10) {
                      alert('Máximo 10 bases permitidas');
                      return;
                    }
                    const newId = Math.max(...tempBases.map(b => b.id), 0) + 1;
                    const newBase = {
                      id: newId,
                      nombre: `BASE ${newId}`,
                      direccion: ''
                    };
                    setTempBases([...tempBases, newBase]);
                  }}
                  className="btn-add"
                  title="Agregar nueva base"
                >
                  ➕ Agregar Base
                </button>
              </div>
              <div className="modal-actions">
                <button onClick={() => setEditingBases(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSaveBases} className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de novedades */}
      {editingNovedades && (
        <div className="modal-overlay" onClick={() => setEditingNovedades(false)}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Configurar Novedades</h3>
              <button onClick={() => setEditingNovedades(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="config-list">
                {tempNovedades.map((novedad, index) => (
                  <div key={index} className="config-item">
                    <input
                      type="text"
                      value={novedad.codigo}
                      onChange={(e) => {
                        const newNovedades = [...tempNovedades];
                        newNovedades[index].codigo = e.target.value;
                        setTempNovedades(newNovedades);
                      }}
                      className="config-input"
                      placeholder="Código"
                    />
                    <input
                      type="text"
                      value={novedad.descripcion}
                      onChange={(e) => {
                        const newNovedades = [...tempNovedades];
                        newNovedades[index].descripcion = e.target.value;
                        setTempNovedades(newNovedades);
                      }}
                      className="config-input"
                      placeholder="Descripción"
                    />
                    <button
                      onClick={() => {
                        const newNovedades = tempNovedades.filter((_, i) => i !== index);
                        setTempNovedades(newNovedades);
                      }}
                      className="btn-delete"
                      title="Eliminar novedad"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Botón para agregar nueva novedad */}
              <div className="add-item-section">
                <button
                  onClick={() => {
                    const newNovedad = {
                      codigo: '',
                      descripcion: '',
                      activa: true,
                      heredarAlCierre: true
                    };
                    setTempNovedades([...tempNovedades, newNovedad]);
                  }}
                  className="btn-add"
                  title="Agregar nueva novedad"
                >
                  ➕ Agregar Novedad
                </button>
              </div>
              <div className="modal-actions">
                <button onClick={() => setEditingNovedades(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSaveNovedades} className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de motivos */}
      {editingMotivos && (
        <div className="modal-overlay" onClick={() => setEditingMotivos(false)}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚫 Configurar Motivos</h3>
              <button onClick={() => setEditingMotivos(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="config-list">
                {tempMotivos.map((motivo, index) => (
                  <div key={index} className="config-item">
                    <input
                      type="text"
                      value={motivo.codigo}
                      onChange={(e) => {
                        const newMotivos = [...tempMotivos];
                        newMotivos[index].codigo = e.target.value;
                        setTempMotivos(newMotivos);
                      }}
                      className="config-input"
                      placeholder="Código"
                    />
                    <input
                      type="text"
                      value={motivo.concepto || motivo.descripcion}
                      onChange={(e) => {
                        const newMotivos = [...tempMotivos];
                        newMotivos[index].concepto = e.target.value;
                        setTempMotivos(newMotivos);
                      }}
                      className="config-input"
                      placeholder="Concepto/Descripción"
                    />
                    <button
                      onClick={() => {
                        const newMotivos = tempMotivos.filter((_, i) => i !== index);
                        setTempMotivos(newMotivos);
                      }}
                      className="btn-delete"
                      title="Eliminar motivo"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Botón para agregar nuevo motivo */}
              <div className="add-item-section">
                <button
                  onClick={() => {
                    const newMotivo = {
                      codigo: '',
                      concepto: '',
                      color: '#6c757d',
                      icono: '⚠️',
                      activo: true
                    };
                    setTempMotivos([...tempMotivos, newMotivo]);
                  }}
                  className="btn-add"
                  title="Agregar nuevo motivo"
                >
                  ➕ Agregar Motivo
                </button>
              </div>
              <div className="modal-actions">
                <button onClick={() => setEditingMotivos(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSaveMotivos} className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-panel-overlay {
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

        .admin-panel {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .admin-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .admin-panel-header h2 {
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

        .admin-panel-content {
          padding: 0;
        }

        .admin-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .tab {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #6c757d;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab:hover {
          background: #e9ecef;
          color: #495057;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: white;
        }

        .admin-tab-content {
          padding: 20px;
        }

        .tab-section h3 {
          margin: 0 0 20px 0;
          color: #495057;
          font-size: 1.3rem;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .admin-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s;
        }

        .admin-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .admin-card h4 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .card-content p {
          margin: 0 0 10px 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .form-control {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.9rem;
          width: 80px;
        }

        .form-control:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
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

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover:not(:disabled) {
          background: #e0a800;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background: #138496;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #218838;
        }

        /* Estilos para modales de configuración */
        .config-modal {
          background: white;
          border-radius: 8px;
          width: 700px;
          max-width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .modal-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.2rem;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .modal-header button:hover {
          background: #e9ecef;
          color: #495057;
        }

        .modal-content {
          padding: 20px;
        }

        .config-list {
          margin-bottom: 20px;
        }

        .config-item {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          align-items: center;
          width: 100%;
        }

        .config-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .config-input:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .config-input:disabled {
          background: #f8f9fa;
          color: #6c757d;
        }


        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }

        .btn-delete {
          background: #dc3545;
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          min-width: 40px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-delete:hover {
          background: #c82333;
        }

        .add-item-section {
          margin-bottom: 20px;
          padding-top: 15px;
          border-top: 1px solid #dee2e6;
        }

        .btn-add {
          background: #28a745;
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-add:hover {
          background: #218838;
        }


        /* Responsividad para pantallas pequeñas */
        @media (max-width: 768px) {
          .config-modal {
            min-width: 95vw;
            max-width: 95vw;
            margin: 10px;
          }
          
          .config-item {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }
          
          .modal-content {
            padding: 20px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
