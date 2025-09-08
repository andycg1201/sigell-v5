import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  const [processingNovedades, setProcessingNovedades] = useState(new Set());
  const [optimisticNovedades, setOptimisticNovedades] = useState(new Set());

  // Usar useMemo para evitar re-cálculos innecesarios
  const novedadesActivas = useMemo(() => {
    return taxiNovedades?.novedades?.filter(n => n.activa) || [];
  }, [taxiNovedades?.novedades]);

  const novedadesDisponibles = useMemo(() => {
    return novedadesConfig?.novedades?.filter(n => n.activa) || [];
  }, [novedadesConfig?.novedades]);

  // Combinar novedades reales con optimistas para feedback inmediato (evitando duplicados)
  const novedadesActivasCombinadas = useMemo(() => {
    const realCodigos = new Set(novedadesActivas.map(n => n.codigo));
    const optimistasUnicos = Array.from(optimisticNovedades).filter(codigo => !realCodigos.has(codigo));
    
    return [
      ...novedadesActivas,
      ...optimistasUnicos.map(codigo => ({
        codigo,
        descripcion: novedadesConfig?.novedades?.find(n => n.codigo === codigo)?.descripcion || '',
        activa: true
      }))
    ];
  }, [novedadesActivas, optimisticNovedades, novedadesConfig?.novedades]);
  
  // Log solo cuando el modal se abre (una sola vez)
  useEffect(() => {
    if (isOpen) {
      console.log('NovedadesModal abierto para taxi:', taxiId);
    } else {
      // Limpiar estado optimista cuando se cierra el modal
      setOptimisticNovedades(new Set());
    }
  }, [isOpen, taxiId]);

  // Log solo si no hay novedades disponibles (una sola vez)
  useEffect(() => {
    if (novedadesDisponibles.length === 0) {
      console.log('No hay novedades disponibles en la configuración');
    }
  }, [novedadesDisponibles.length]);

  const handleNovedadClick = async (novedad) => {
    if (processingNovedades.has(novedad.codigo)) {
      console.log('Ya se está procesando la novedad', novedad.codigo, ', ignorando click');
      return;
    }

    console.log('Click en novedad:', novedad.codigo, novedad.descripcion);
    const isActiva = novedadesActivasCombinadas.some(n => n.codigo === novedad.codigo);
    console.log('Novedad activa:', isActiva, 'Cambiando a:', !isActiva);
    
    // Actualizar estado optimista inmediatamente
    if (!isActiva) {
      setOptimisticNovedades(prev => new Set(prev).add(novedad.codigo));
    } else {
      setOptimisticNovedades(prev => {
        const newSet = new Set(prev);
        newSet.delete(novedad.codigo);
        return newSet;
      });
    }
    
    setProcessingNovedades(prev => new Set(prev).add(novedad.codigo));
    try {
      await onToggleNovedad(taxiId, novedad.codigo, novedad.descripcion, !isActiva);
    } catch (error) {
      // Si hay error, revertir el estado optimista
      if (!isActiva) {
        setOptimisticNovedades(prev => {
          const newSet = new Set(prev);
          newSet.delete(novedad.codigo);
          return newSet;
        });
      } else {
        setOptimisticNovedades(prev => new Set(prev).add(novedad.codigo));
      }
      throw error;
    } finally {
      setProcessingNovedades(prev => {
        const newSet = new Set(prev);
        newSet.delete(novedad.codigo);
        return newSet;
      });
    }
  };

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return createPortal(
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
          
          {/* Debug info */}
          <div style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '5px', 
            fontSize: '12px',
            border: '1px solid #ccc'
          }}>
            <strong>Debug Info:</strong><br/>
            Config cargada: {novedadesConfig ? 'Sí' : 'No'}<br/>
            Novedades disponibles: {novedadesDisponibles.length}<br/>
            Novedades activas: {novedadesActivas.length}<br/>
            Taxi ID: {taxiId}
          </div>
          
          <div className="novedades-grid">
            {novedadesDisponibles.map((novedad) => {
              const isActiva = novedadesActivasCombinadas.some(n => n.codigo === novedad.codigo);
              
              return (
                <button
                  key={novedad.codigo}
                  className={`novedad-button ${isActiva ? 'activa' : 'disponible'}`}
                  onClick={() => handleNovedadClick(novedad)}
                  disabled={processingNovedades.has(novedad.codigo)}
                >
                  <div className="novedad-codigo">{novedad.codigo}</div>
                  <div className="novedad-descripcion">{novedad.descripcion}</div>
                  {isActiva && <div className="novedad-indicator">●</div>}
                </button>
              );
            })}
          </div>
          
          {novedadesActivasCombinadas.length > 0 && (
            <div className="novedades-activas">
              <h4>Novedades Activas:</h4>
              <ul>
                {novedadesActivasCombinadas.map((novedad) => (
                  <li key={novedad.codigo}>
                    {novedad.codigo} - {novedad.descripcion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NovedadesModal;
