import React from 'react';
import './NovedadesModal.css';

const NovedadesModal = ({ 
  isOpen, 
  onClose, 
  taxiId, 
  novedadesConfig, 
  taxiNovedades, 
  onToggleNovedad 
}) => {
  if (!isOpen) return null;

  const novedadesActivas = taxiNovedades?.novedades?.filter(n => n.activa) || [];
  const novedadesDisponibles = novedadesConfig?.novedades?.filter(n => n.activa) || [];

  const handleNovedadClick = (novedad) => {
    const isActiva = novedadesActivas.some(n => n.codigo === novedad.codigo);
    onToggleNovedad(taxiId, novedad.codigo, novedad.descripcion, !isActiva);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="novedades-modal-overlay" onClick={handleOverlayClick}>
      <div className="novedades-modal">
        <div className="novedades-modal-header">
          <h3>Novedades - Taxi {taxiId}</h3>
          <button className="novedades-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="novedades-modal-content">
          <p className="novedades-instructions">
            {novedadesActivas.length > 0 
              ? "Click en una novedad activa para desactivarla, o en una disponible para activarla"
              : "Selecciona una novedad para activarla"
            }
          </p>
          
          <div className="novedades-grid">
            {novedadesDisponibles.map((novedad) => {
              const isActiva = novedadesActivas.some(n => n.codigo === novedad.codigo);
              
              return (
                <button
                  key={novedad.codigo}
                  className={`novedad-button ${isActiva ? 'activa' : 'disponible'}`}
                  onClick={() => handleNovedadClick(novedad)}
                >
                  <div className="novedad-codigo">{novedad.codigo}</div>
                  <div className="novedad-descripcion">{novedad.descripcion}</div>
                  {isActiva && <div className="novedad-indicator">●</div>}
                </button>
              );
            })}
          </div>
          
          {novedadesActivas.length > 0 && (
            <div className="novedades-activas">
              <h4>Novedades Activas:</h4>
              <ul>
                {novedadesActivas.map((novedad) => (
                  <li key={novedad.codigo}>
                    {novedad.codigo} - {novedad.descripcion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovedadesModal;
