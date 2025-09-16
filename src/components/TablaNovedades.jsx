import React, { useState, useMemo, useCallback } from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { obtenerSugerenciasCiudades } from '../utils/ciudadesEcuador';

/**
 * Componente de tabla para mostrar y gestionar novedades de un taxi específico
 * Incluye campos dinámicos según el tipo de novedad
 */
const TablaNovedades = ({ 
  taxiId, 
  novedadesActivas, 
  onAddNovedad, 
  onEditNovedad, 
  onRemoveNovedad 
}) => {
  const { taxis } = useTaxis();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [sugerenciasCiudades, setSugerenciasCiudades] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Obtener taxis disponibles (excluyendo bloqueados)
  const taxisDisponibles = useMemo(() => {
    return taxis
      .filter(taxi => !taxi.bloqueado)
      .map(taxi => taxi.numero)
      .sort((a, b) => a - b);
  }, [taxis]);

  // Función para obtener campos según el tipo de novedad
  const getCamposPorTipo = useCallback((tipoNovedad) => {
    const campos = {
      'B70': { // Multa
        motivo: { label: 'Motivo Multa', type: 'text', required: true },
        responsable: { label: 'Responsable', type: 'select', required: true, options: taxisDisponibles },
        observaciones: { label: 'Observaciones', type: 'textarea', required: false }
      },
      'B54': { // Daño Mecánico
        observaciones: { label: 'Observaciones', type: 'textarea', required: true }
      },
      'B07': { // Carrera fuera de la Ciudad
        destino: { label: 'Destino', type: 'text', required: true, suggestions: true },
        observaciones: { label: 'Observaciones', type: 'textarea', required: false }
      }
    };
    
    return campos[tipoNovedad] || { observaciones: { label: 'Observaciones', type: 'textarea', required: false } };
  }, [taxisDisponibles]);

  // Función para manejar sugerencias de ciudades
  const handleBuscarCiudad = useCallback((texto) => {
    if (texto.length > 1) {
      const sugerencias = obtenerSugerenciasCiudades(texto);
      setSugerenciasCiudades(sugerencias);
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
    }
  }, []);

  // Función para seleccionar una ciudad
  const handleSeleccionarCiudad = useCallback((ciudad) => {
    setFormData(prev => ({ ...prev, destino: ciudad }));
    setMostrarSugerencias(false);
  }, []);

  // Función para manejar cambios en el formulario
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si es el campo destino, buscar sugerencias
    if (field === 'destino') {
      handleBuscarCiudad(value);
    }
  }, [handleBuscarCiudad]);

  // Función para iniciar edición
  const handleEdit = useCallback((novedad) => {
    setEditingId(novedad.id);
    setFormData({
      motivo: novedad.motivo || '',
      responsable: novedad.responsable || '',
      destino: novedad.destino || '',
      observaciones: novedad.observaciones || ''
    });
  }, []);

  // Función para cancelar edición
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData({});
    setMostrarSugerencias(false);
  }, []);

  // Función para guardar cambios
  const handleSave = useCallback(async () => {
    try {
      if (editingId) {
        // Editar novedad existente
        await onEditNovedad(taxiId, editingId, formData);
      }
      setEditingId(null);
      setFormData({});
      setMostrarSugerencias(false);
    } catch (error) {
      console.error('Error guardando novedad:', error);
    }
  }, [editingId, formData, taxiId, onEditNovedad]);

  // Función para eliminar novedad
  const handleDelete = useCallback(async (novedadId) => {
    if (confirm('¿Estás seguro de eliminar esta novedad?')) {
      try {
        await onRemoveNovedad(taxiId, novedadId);
      } catch (error) {
        console.error('Error eliminando novedad:', error);
      }
    }
  }, [taxiId, onRemoveNovedad]);

  // Función para renderizar campo de input
  const renderField = useCallback((fieldName, config) => {
    const value = formData[fieldName] || '';
    
    if (config.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className="form-select"
          required={config.required}
        >
          <option value="">Seleccionar...</option>
          {config.options?.map(option => (
            <option key={option} value={option}>Taxi {option}</option>
          ))}
        </select>
      );
    }
    
    if (config.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className="form-control"
          placeholder={config.label}
          required={config.required}
          rows={2}
        />
      );
    }
    
    return (
      <div className="position-relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className="form-control"
          placeholder={config.label}
          required={config.required}
        />
        {config.suggestions && mostrarSugerencias && sugerenciasCiudades.length > 0 && (
          <div className="sugerencias-dropdown">
            {sugerenciasCiudades.map((ciudad, idx) => (
              <div
                key={idx}
                className="sugerencia-item"
                onClick={() => handleSeleccionarCiudad(ciudad)}
              >
                {ciudad}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [formData, handleInputChange, mostrarSugerencias, sugerenciasCiudades, handleSeleccionarCiudad]);

  // Función para formatear fecha
  const formatearFecha = useCallback((fecha) => {
    if (!fecha) return '';
    
    try {
      let date;
      
      // Si es un timestamp de Firestore
      if (fecha.seconds) {
        date = new Date(fecha.seconds * 1000);
      }
      // Si es un objeto Date válido
      else if (fecha instanceof Date) {
        date = fecha;
      }
      // Si es una string o timestamp
      else {
        date = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida recibida:', fecha);
        return 'Hora inválida';
      }
      
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Fecha recibida:', fecha);
      return 'Error fecha';
    }
  }, []);

  return (
    <div className="tabla-novedades">
      <div className="tabla-novedades-header">
        <h5>📋 Novedades del Taxi {taxiId} - {new Date().toLocaleDateString('es-ES')}</h5>
        <small>Total: {novedadesActivas.length} novedades (activas e inactivas)</small>
      </div>
      
      {novedadesActivas.length === 0 ? (
        <div className="no-novedades">
          <p>No hay novedades registradas para este taxi hoy.</p>
        </div>
      ) : (
        <div className="tabla-novedades-content">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Motivo</th>
                <th>Responsable</th>
                <th>Destino</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {novedadesActivas.map((novedad) => (
                <tr key={novedad.id} className={novedad.activa ? 'novedad-activa' : 'novedad-inactiva'}>
                  <td>{formatearFecha(novedad.fechaHora)}</td>
                  <td>
                    <span className={`badge ${novedad.activa ? 'bg-success' : 'bg-secondary'}`}>
                      {novedad.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-primary">{novedad.codigo}</span>
                  </td>
                  <td>{novedad.descripcion}</td>
                  
                  {editingId === novedad.id ? (
                    <>
                      <td>
                        {getCamposPorTipo(novedad.codigo).motivo && 
                          renderField('motivo', getCamposPorTipo(novedad.codigo).motivo)
                        }
                      </td>
                      <td>
                        {getCamposPorTipo(novedad.codigo).responsable && 
                          renderField('responsable', getCamposPorTipo(novedad.codigo).responsable)
                        }
                      </td>
                      <td>
                        {getCamposPorTipo(novedad.codigo).destino && 
                          renderField('destino', getCamposPorTipo(novedad.codigo).destino)
                        }
                      </td>
                      <td>
                        {getCamposPorTipo(novedad.codigo).observaciones && 
                          renderField('observaciones', getCamposPorTipo(novedad.codigo).observaciones)
                        }
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={handleSave}
                            title="Guardar"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={handleCancelEdit}
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{novedad.motivo || '-'}</td>
                      <td>{novedad.responsable ? `Taxi ${novedad.responsable}` : '-'}</td>
                      <td>{novedad.destino || '-'}</td>
                      <td>{novedad.observaciones || '-'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleEdit(novedad)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(novedad.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .tabla-novedades {
          margin-top: 20px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .tabla-novedades-header {
          background: #f8f9fa;
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .tabla-novedades-header h5 {
          margin: 0;
          color: #495057;
        }
        
        .tabla-novedades-header small {
          color: #6c757d;
        }
        
        .no-novedades {
          padding: 30px;
          text-align: center;
          color: #6c757d;
        }
        
        .tabla-novedades-content {
          overflow-x: auto;
        }
        
        .table {
          margin: 0;
        }
        
        .table th {
          background: #e9ecef;
          border-top: none;
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .table td {
          vertical-align: middle;
          font-size: 0.875rem;
        }
        
        .badge {
          font-size: 0.75rem;
        }
        
        .form-control, .form-select {
          font-size: 0.875rem;
          padding: 0.375rem 0.5rem;
        }
        
        .sugerencias-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ced4da;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .sugerencia-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f8f9fa;
          transition: background-color 0.2s;
        }
        
        .sugerencia-item:hover {
          background-color: #f8f9fa;
        }
        
        .sugerencia-item:last-child {
          border-bottom: none;
        }
        
        .btn-group-sm .btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
        
        .novedad-activa {
          background-color: #f8f9fa;
        }
        
        .novedad-inactiva {
          background-color: #f1f3f4;
          opacity: 0.8;
        }
        
        .novedad-inactiva td {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default TablaNovedades;
