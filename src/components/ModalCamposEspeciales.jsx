import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTaxis } from '../contexts/TaxisContext';
import { obtenerSugerenciasCiudades } from '../utils/ciudadesEcuador';

/**
 * Modal para capturar campos especiales de una novedad
 */
const ModalCamposEspeciales = ({ 
  isOpen, 
  onClose, 
  novedad, 
  onSave 
}) => {
  const { taxis } = useTaxis();
  const [formData, setFormData] = useState({});
  const [sugerenciasCiudades, setSugerenciasCiudades] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Obtener taxis disponibles (excluyendo bloqueados) - memoizado para evitar re-renders
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

  // Inicializar formulario cuando cambia la novedad
  useEffect(() => {
    if (novedad) {
      const initialData = {};
      
      // Configurar campos según el tipo de novedad
      if (novedad.codigo === 'B70') { // Multa
        initialData.motivo = '';
        initialData.responsable = '';
        initialData.observaciones = '';
      } else if (novedad.codigo === 'B54') { // Daño Mecánico
        initialData.observaciones = '';
      } else if (novedad.codigo === 'B07') { // Carrera fuera de la Ciudad
        initialData.destino = '';
        initialData.observaciones = '';
      } else {
        initialData.observaciones = '';
      }
      
      setFormData(initialData);
    }
  }, [novedad?.codigo]);

  // Asegurar que el primer campo reciba el foco cuando se abre el modal
  useEffect(() => {
    if (isOpen && novedad) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const firstInput = document.querySelector('.modal-campos-especiales .form-control');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isOpen, novedad]);

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

  // Función para manejar el guardado
  const handleSave = useCallback(async () => {
    try {
      // Validar campos requeridos
      const campos = getCamposPorTipo(novedad.codigo);
      const camposRequeridos = Object.entries(campos)
        .filter(([_, config]) => config.required)
        .map(([field, _]) => field);
      
      for (const campo of camposRequeridos) {
        if (!formData[campo] || formData[campo].trim() === '') {
          alert(`El campo "${campos[campo].label}" es requerido`);
          return;
        }
      }
      
      await onSave(novedad.codigo, novedad.descripcion, formData);
      onClose();
    } catch (error) {
      console.error('Error guardando novedad:', error);
      alert('Error al guardar la novedad');
    }
  }, [novedad, formData, onSave, onClose, getCamposPorTipo]);

  // Función para renderizar campo de input
  const renderField = useCallback((fieldName, config) => {
    const value = formData[fieldName] || '';
    
    if (config.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className="form-control"
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
          rows={3}
          autoFocus={fieldName === 'observaciones' && novedad?.codigo === 'B54'}
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
          autoComplete="off"
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

  // Función para cerrar modal
  const handleClose = useCallback(() => {
    setFormData({});
    setMostrarSugerencias(false);
    onClose();
  }, [onClose]);

  // Función para manejar click fuera del modal
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen || !novedad) return null;

  const campos = getCamposPorTipo(novedad.codigo);

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-campos-especiales">
        <div className="modal-header">
          <h3>📋 {novedad.codigo} - {novedad.descripcion}</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <div className="campos-form">
            {Object.entries(campos).map(([fieldName, config]) => (
              <div key={fieldName} className="campo-group">
                <label className="campo-label">
                  {config.label}
                  {config.required && <span className="required">*</span>}
                </label>
                {renderField(fieldName, config)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
          >
            Guardar Novedad
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-campos-especiales {
          background: white;
          border-radius: 8px;
          width: 500px;
          max-width: 90vw;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.2rem;
        }
        
        .modal-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6c757d;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .modal-close-btn:hover {
          background-color: #e9ecef;
        }
        
        .modal-content {
          padding: 20px;
          max-height: 50vh;
          overflow-y: auto;
        }
        
        .campos-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .campo-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .campo-label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }
        
        .required {
          color: #dc3545;
          margin-left: 2px;
        }
        
        .form-control, .form-select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          width: 100%;
          box-sizing: border-box;
        }
        
        .form-control:focus, .form-select:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .modal-actions {
          padding: 15px 20px;
          border-top: 1px solid #dee2e6;
          background: #f8f9fa;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #0056b3;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #545b62;
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
      `}</style>
    </div>,
    document.body
  );
};

export default ModalCamposEspeciales;
