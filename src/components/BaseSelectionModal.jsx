import React from 'react';
import './BaseSelectionModal.css';

const BaseSelectionModal = ({ bases, onSelectBase, onClose }) => {
  const handleBaseClick = (base) => {
    onSelectBase(base);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="base-selection-modal">
        <div className="modal-header">
          <h3>Seleccionar Base</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <p>¿Desde qué base sale el taxi?</p>
          
          <div className="bases-grid">
            {bases.map((base) => (
              <button
                key={base.id}
                className="base-button"
                onClick={() => handleBaseClick(base)}
              >
                {base.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseSelectionModal;
