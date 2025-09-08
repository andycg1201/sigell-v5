import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { inhabilitarTaxi } from '../firebase/inhabilitaciones';
import './InhabilitacionModal.css';

const InhabilitacionModal = ({ 
  isOpen, 
  onClose, 
  taxiId, 
  taxiNumero,
  motivosConfig,
  onInhabilitacionSuccess 
}) => {
  const [selectedMotivo, setSelectedMotivo] = useState(null);
  const [responsable, setResponsable] = useState('');
  const [valor, setValor] = useState(0);
  const [procesando, setProcesando] = useState(false);

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMotivo(null);
      setResponsable('');
      setValor(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMotivoClick = (motivo) => {
    setSelectedMotivo(motivo);
    // Establecer responsable por defecto basado en el motivo
    if (motivo.codigo === 'GER') {
      setResponsable('Gerencia');
    } else if (motivo.codigo === 'INS_PAR') {
      setResponsable('Inspector Parada');
    } else if (motivo.codigo === 'INS_DEP') {
      setResponsable('Inspector Deportes');
    } else {
      setResponsable('');
    }
  };

  const handleInhabilitar = async () => {
    if (!selectedMotivo || !responsable.trim()) {
      alert('Por favor seleccione un motivo y ingrese el responsable');
      return;
    }

    setProcesando(true);
    try {
      await inhabilitarTaxi(taxiId, selectedMotivo, responsable.trim(), valor);
      onInhabilitacionSuccess();
      onClose();
    } catch (error) {
      console.error('Error inhabilitando taxi:', error);
      alert('Error inhabilitando el taxi: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="inhabilitacion-modal-overlay" onClick={handleOverlayClick}>
      <div className="inhabilitacion-modal">
        <div className="inhabilitacion-modal-header">
          <h3>Inhabilitar Taxi #{taxiNumero}</h3>
          <button className="inhabilitacion-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="inhabilitacion-modal-content">
          {!selectedMotivo ? (
            // Menú de motivos
            <div className="motivos-menu">
              <h4>Seleccione el motivo de inhabilitación:</h4>
              <div className="motivos-grid">
                {motivosConfig?.motivos?.filter(m => m.activo).map((motivo) => (
                  <button
                    key={motivo.codigo}
                    className="motivo-button"
                    style={{ 
                      borderColor: motivo.color,
                      color: motivo.color 
                    }}
                    onClick={() => handleMotivoClick(motivo)}
                  >
                    <span className="motivo-icono">{motivo.icono}</span>
                    <span className="motivo-codigo">{motivo.codigo}</span>
                    <span className="motivo-concepto">{motivo.concepto}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Formulario de inhabilitación
            <div className="inhabilitacion-form">
              <div className="motivo-seleccionado">
                <span className="motivo-icono" style={{ color: selectedMotivo.color }}>
                  {selectedMotivo.icono}
                </span>
                <div>
                  <strong>{selectedMotivo.codigo}</strong>
                  <p>{selectedMotivo.concepto}</p>
                </div>
                <button 
                  className="btn-cambiar-motivo"
                  onClick={() => setSelectedMotivo(null)}
                >
                  Cambiar
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="responsable">Responsable:</label>
                <input
                  type="text"
                  id="responsable"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Nombre del responsable"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="valor">Valor (opcional):</label>
                <input
                  type="number"
                  id="valor"
                  value={valor}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn-cancelar"
                  onClick={onClose}
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-inhabilitar"
                  onClick={handleInhabilitar}
                  disabled={procesando}
                  style={{ backgroundColor: selectedMotivo.color }}
                >
                  {procesando ? 'Inhabilitando...' : 'Inhabilitar Taxi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InhabilitacionModal;
