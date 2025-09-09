import React, { useState, useEffect, useRef } from 'react';

const ClientModal = ({ isOpen, onClose, onSave, phoneNumber }) => {
  const [formData, setFormData] = useState({
    telefono: phoneNumber || '',
    direccion: '',
    observaciones: ''
  });

  const direccionRef = useRef(null);
  const observacionesRef = useRef(null);

  // Actualizar el campo teléfono cuando cambie la prop
  useEffect(() => {
    if (phoneNumber) {
      setFormData(prev => ({
        ...prev,
        telefono: phoneNumber
      }));
    }
  }, [phoneNumber]);

  // Foco automático en dirección al abrir el modal
  useEffect(() => {
    if (isOpen && direccionRef.current) {
      setTimeout(() => {
        direccionRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDireccionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (observacionesRef.current) {
        observacionesRef.current.focus();
      }
    }
  };

  const handleObservacionesKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.telefono.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    if (!formData.direccion.trim()) {
      alert('Por favor ingrese una dirección');
      return;
    }

    onSave(formData);
    
    // Limpiar formulario
    setFormData({
      telefono: '',
      direccion: '',
      observaciones: ''
    });
  };

  const handleClose = () => {
    // Limpiar formulario al cerrar
    setFormData({
      telefono: '',
      direccion: '',
      observaciones: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Agregar Cliente Nuevo</h3>
          <button className="modal-close" onClick={handleClose} tabIndex={-1}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label htmlFor="telefono">Teléfono:</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="0997652586"
              disabled
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="direccion">Dirección:</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              onKeyPress={handleDireccionKeyPress}
              placeholder="Los Galeanos y Analia Bernal"
              ref={direccionRef}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="observaciones">Observaciones:</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              onKeyPress={handleObservacionesKeyPress}
              placeholder="Cliente siempre pide que lo esperen 5 minutos"
              ref={observacionesRef}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose} tabIndex={-1}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" tabIndex={-1}>
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
