import React, { useState, useEffect } from 'react';
import { 
  getClienteByPhone, 
  addDireccionToCliente, 
  reordenarDirecciones,
  editarDireccion,
  eliminarDireccion,
  saveCliente
} from '../firebase/clientes';

const DireccionesModal = ({ isOpen, onClose, telefono, onSelectDireccion }) => {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [agregandoDireccion, setAgregandoDireccion] = useState(false);
  const [editandoDireccion, setEditandoDireccion] = useState(null);
  const [direccionEditando, setDireccionEditando] = useState('');
  const [mostrarTodasObservaciones, setMostrarTodasObservaciones] = useState(false);
  const [esClienteNuevo, setEsClienteNuevo] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [focoEnNuevaDireccion, setFocoEnNuevaDireccion] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Cargar datos del cliente cuando se abre el modal
  useEffect(() => {
    if (isOpen && telefono) {
      cargarCliente();
      setFocoEnNuevaDireccion(false); // Resetear el flag al abrir el modal
      setModalAbierto(true); // Marcar que el modal se abrió
    } else {
      setModalAbierto(false);
    }
  }, [isOpen, telefono]);

  // Manejar tecla ESC para cancelar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleCancelar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCancelar = () => {
    onClose();
    // Volver al campo teléfono con texto seleccionado
    setTimeout(() => {
      const telefonoInput = document.querySelector('.cliente-field input');
      if (telefonoInput) {
        telefonoInput.focus();
        telefonoInput.select();
      }
    }, 100);
  };

  const cargarCliente = async () => {
    setCargando(true);
    try {
      const clienteData = await getClienteByPhone(telefono);
      if (clienteData) {
        setCliente(clienteData);
        setEsClienteNuevo(false);
      } else {
        setCliente(null);
        setEsClienteNuevo(true);
        setNombreCliente('');
      }
    } catch (error) {
      console.error('Error cargando cliente:', error);
      alert('Error cargando datos del cliente');
    } finally {
      setCargando(false);
    }
  };

  const handleSelectDireccion = (direccion) => {
    if (onSelectDireccion) {
      onSelectDireccion(direccion);
    }
    onClose();
  };

  // Función para crear cliente nuevo
  const handleCrearCliente = async () => {
    if (!nombreCliente.trim() || !nuevaDireccion.trim()) {
      alert('Por favor ingresa nombre y dirección');
      return;
    }

    setAgregandoDireccion(true);
    try {
      await saveCliente(telefono, {
        nombre: nombreCliente.trim(),
        direcciones: [{
          id: Date.now().toString(),
          direccion: nuevaDireccion.trim(),
          esPrincipal: true,
          fechaAgregada: new Date().toISOString()
        }]
      });
      
      // Recargar datos del cliente
      await cargarCliente();
      setNuevaDireccion('');
      setNombreCliente('');
      alert('Cliente creado exitosamente');
    } catch (error) {
      console.error('Error creando cliente:', error);
      alert('Error creando cliente');
    } finally {
      setAgregandoDireccion(false);
    }
  };

  // Función para reordenar direcciones
  const handleReordenar = async (direccionId, direccion) => {
    if (!cliente || !cliente.direcciones) return;
    
    const direcciones = [...cliente.direcciones];
    const index = direcciones.findIndex(dir => dir.id === direccionId);
    
    if (direccion === 'up' && index > 0) {
      [direcciones[index], direcciones[index - 1]] = [direcciones[index - 1], direcciones[index]];
    } else if (direccion === 'down' && index < direcciones.length - 1) {
      [direcciones[index], direcciones[index + 1]] = [direcciones[index + 1], direcciones[index]];
    }
    
    // Actualizar esPrincipal
    direcciones.forEach((dir, i) => {
      dir.esPrincipal = i === 0;
    });
    
    try {
      await reordenarDirecciones(telefono, direcciones);
      setCliente(prev => ({ ...prev, direcciones }));
    } catch (error) {
      console.error('Error reordenando direcciones:', error);
      alert('Error reordenando direcciones');
    }
  };

  // Función para editar dirección
  const handleEditarDireccion = async (direccionId) => {
    if (!direccionEditando.trim()) {
      alert('Por favor ingresa una dirección');
      return;
    }

    try {
      await editarDireccion(telefono, direccionId, direccionEditando.trim());
      await cargarCliente();
      setEditandoDireccion(null);
      setDireccionEditando('');
      alert('Dirección editada exitosamente');
    } catch (error) {
      console.error('Error editando dirección:', error);
      alert('Error editando dirección');
    }
  };

  // Función para eliminar dirección
  const handleEliminarDireccion = async (direccionId) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      await eliminarDireccion(telefono, direccionId);
      await cargarCliente();
      alert('Dirección eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando dirección:', error);
      alert('Error eliminando dirección');
    }
  };

  const handleAgregarDireccion = async () => {
    if (!nuevaDireccion.trim()) {
      alert('Por favor ingresa una dirección');
      return;
    }

    setAgregandoDireccion(true);
    try {
      await addDireccionToCliente(telefono, {
        direccion: nuevaDireccion.trim(),
        nombre: cliente?.nombre || 'Cliente'
      });
      
      // Recargar datos del cliente
      await cargarCliente();
      setNuevaDireccion('');
      
      // Marcar que el foco debe ir a la nueva dirección (la primera)
      setFocoEnNuevaDireccion(true);
      
      alert('Dirección agregada exitosamente');
    } catch (error) {
      console.error('Error agregando dirección:', error);
      alert('Error agregando dirección');
    } finally {
      setAgregandoDireccion(false);
    }
  };

  const getCalificacionColor = (nivel) => {
    switch (nivel) {
      case 'excelente': return '#4caf50';
      case 'problematico': return '#f44336';
      default: return '#2196f3';
    }
  };

  const getCalificacionIcon = (nivel) => {
    switch (nivel) {
      case 'excelente': return '⭐';
      case 'problematico': return '⚠️';
      default: return '👤';
    }
  };

  // Función para obtener icono y color de observación
  const getObservacionIcon = (tipo) => {
    switch (tipo) {
      case 'positivo': return { icon: '⭐', color: '#4caf50' };
      case 'negativo': return { icon: '⚠️', color: '#f44336' };
      case 'neutral': return { icon: '😐', color: '#ff9800' };
      default: return { icon: '📝', color: '#2196f3' };
    }
  };

  // Función para obtener observaciones a mostrar
  const getObservacionesAMostrar = () => {
    if (!cliente || !cliente.historial) return [];
    const historial = cliente.historial.sort((a, b) => 
      new Date(b.fechaRegistro || b.fecha) - new Date(a.fechaRegistro || a.fecha)
    );
    return mostrarTodasObservaciones ? historial : historial.slice(0, 3);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancelar}>
      <div className="direcciones-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{esClienteNuevo ? '👤 Nuevo Cliente' : '📋 Información del Cliente'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {cargando ? (
            <div className="loading">🔄 Cargando información del cliente...</div>
          ) : esClienteNuevo ? (
            /* Formulario para cliente nuevo */
            <div className="cliente-nuevo-form">
              <div className="form-group">
                <label>Nombre del Cliente:</label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Ingresa el nombre del cliente"
                  className="nombre-input"
                />
              </div>
              
              <div className="form-group">
                <label>Dirección:</label>
                <input
                  type="text"
                  value={nuevaDireccion}
                  onChange={(e) => setNuevaDireccion(e.target.value)}
                  placeholder="Ingresa la dirección"
                  className="direccion-input"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-crear"
                  onClick={handleCrearCliente}
                  disabled={agregandoDireccion || !nombreCliente.trim() || !nuevaDireccion.trim()}
                >
                  {agregandoDireccion ? 'Creando...' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          ) : (
            /* Modal para cliente existente */
            <>
              {/* Información del cliente */}
              <div className="cliente-info">
                <div className="cliente-header">
                  <h4>{cliente?.nombre || 'Cliente'}</h4>
                  <span className="telefono">{telefono}</span>
                  {cliente?.calificacion && (
                    <div 
                      className="calificacion-badge"
                      style={{ backgroundColor: getCalificacionColor(cliente.calificacion.nivel) }}
                    >
                      {getCalificacionIcon(cliente.calificacion.nivel)} {cliente.calificacion.nivel}
                    </div>
                  )}
                </div>
              </div>

              {/* Historial de observaciones */}
              {cliente?.historial && cliente.historial.length > 0 && (
                <div className="historial-section">
                  <h5>📝 Historial de Observaciones</h5>
                  <div className="historial-list">
                    {getObservacionesAMostrar().map((item, index) => {
                      const { icon, color } = getObservacionIcon(item.tipo);
                      return (
                        <div key={index} className="historial-item" style={{ borderLeftColor: color }}>
                          <div className="historial-header">
                            <span className="historial-icon" style={{ color }}>{icon}</span>
                            <span className="historial-fecha">
                              {item.fecha} {item.hora && `- ${item.hora}`}
                            </span>
                            {item.unidad && (
                              <span className="historial-unidad">Unidad: {item.unidad}</span>
                            )}
                          </div>
                          <div className="historial-incidente">
                            {item.incidente}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {cliente.historial.length > 3 && (
                    <button 
                      className="btn-ver-mas"
                      onClick={() => setMostrarTodasObservaciones(!mostrarTodasObservaciones)}
                    >
                      {mostrarTodasObservaciones ? 'Ver menos' : `Ver todas (${cliente.historial.length})`}
                    </button>
                  )}
                </div>
              )}

              {/* Direcciones del cliente */}
              <div className="direcciones-section">
                <h5>📍 Direcciones</h5>
                
                {cliente?.direcciones && cliente.direcciones.length > 0 ? (
                  <div className="direcciones-list">
                    {cliente.direcciones.map((direccion, index) => (
                      <div 
                        key={direccion.id} 
                        className={`direccion-item ${direccion.esPrincipal ? 'principal' : ''}`}
                        ref={(el) => {
                          // Solo hacer foco en la primera dirección cuando se abre el modal por primera vez
                          if (el && index === 0 && !esClienteNuevo && modalAbierto && !focoEnNuevaDireccion) {
                            setTimeout(() => {
                              el.focus();
                              setModalAbierto(false); // Marcar que ya se hizo el foco inicial
                            }, 100);
                          }
                          // Si se agregó una nueva dirección, hacer foco en la primera (que será la nueva)
                          if (el && index === 0 && focoEnNuevaDireccion) {
                            setTimeout(() => {
                              el.focus();
                              setFocoEnNuevaDireccion(false); // Resetear el flag
                            }, 100);
                          }
                        }}
                        tabIndex={0}
                        onClick={() => handleSelectDireccion(direccion.direccion)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectDireccion(direccion.direccion);
                          }
                        }}
                      >
                        <div className="direccion-content">
                          <div className="direccion-texto">
                            {direccion.direccion}
                          </div>
                          {direccion.esPrincipal && (
                            <div className="direccion-principal">
                              Principal
                            </div>
                          )}
                        </div>
                        
                        <div className="direccion-actions">
                          {/* Flechas de reordenamiento */}
                          <button
                            className="btn-flecha"
                            onClick={() => handleReordenar(direccion.id, 'up')}
                            disabled={index === 0}
                            title="Mover arriba"
                          >
                            ↑
                          </button>
                          <button
                            className="btn-flecha"
                            onClick={() => handleReordenar(direccion.id, 'down')}
                            disabled={index === cliente.direcciones.length - 1}
                            title="Mover abajo"
                          >
                            ↓
                          </button>
                          
                          {/* Botones de editar y eliminar */}
                          <button
                            className="btn-editar"
                            onClick={() => {
                              setEditandoDireccion(direccion.id);
                              setDireccionEditando(direccion.direccion);
                            }}
                            title="Editar dirección"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-eliminar"
                            onClick={() => handleEliminarDireccion(direccion.id)}
                            title="Eliminar dirección"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-direcciones">
                    No hay direcciones registradas
                  </div>
                )}

                {/* Agregar nueva dirección */}
                <div className="agregar-direccion">
                  <h6>➕ Agregar Nueva Dirección</h6>
                  <div className="agregar-direccion-form">
                    <input
                      type="text"
                      value={nuevaDireccion}
                      onChange={(e) => setNuevaDireccion(e.target.value)}
                      placeholder="Ingresa la nueva dirección"
                      className="direccion-input"
                    />
                    <button
                      onClick={handleAgregarDireccion}
                      disabled={agregandoDireccion || !nuevaDireccion.trim()}
                      className="btn-agregar-direccion"
                    >
                      {agregandoDireccion ? 'Agregando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal de edición de dirección */}
              {editandoDireccion && (
                <div className="editar-direccion-modal">
                  <h6>✏️ Editar Dirección</h6>
                  <div className="editar-direccion-form">
                    <input
                      type="text"
                      value={direccionEditando}
                      onChange={(e) => setDireccionEditando(e.target.value)}
                      className="direccion-input"
                    />
                    <button
                      onClick={() => handleEditarDireccion(editandoDireccion)}
                      className="btn-guardar"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditandoDireccion(null);
                        setDireccionEditando('');
                      }}
                      className="btn-cancelar"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Botones eliminados - Usar ESC/click fuera para cancelar, Enter/click en dirección para aceptar */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DireccionesModal;
