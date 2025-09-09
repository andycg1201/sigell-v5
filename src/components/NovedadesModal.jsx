import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NovedadesModal;
