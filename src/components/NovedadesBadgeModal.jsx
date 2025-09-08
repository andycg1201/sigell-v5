import React from 'react';
import './NovedadesBadgeModal.css';

const NovedadesBadgeModal = ({ 
  isOpen, 
  onClose, 
  taxiId, 
  novedadesActivas 
}) => {
  if (!isOpen || !novedadesActivas || novedadesActivas.length === 0) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="badge-modal-overlay" onClick={handleOverlayClick}>
      <div className="badge-modal">
        <div className="badge-modal-header">
          <h4>Taxi {taxiId} - Novedades</h4>
          <button className="badge-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="badge-modal-content">
          <div className="novedades-list">
            {novedadesActivas.map((novedad, index) => (
              <div key={novedad.codigo} className="novedad-item">
                <div className="novedad-codigo-badge">{novedad.codigo}</div>
                <div className="novedad-descripcion-badge">{novedad.descripcion}</div>
              </div>
            ))}
          </div>
          
          <div className="badge-modal-footer">
            <small>Click derecho en el botón para gestionar novedades</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovedadesBadgeModal;
