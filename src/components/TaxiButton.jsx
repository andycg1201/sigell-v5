import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { useSelection } from '../contexts/SelectionContext';
import { useNovedades } from '../contexts/NovedadesContext';
import NovedadesModal from './NovedadesModal';
import NovedadesBadgeModal from './NovedadesBadgeModal';

const TaxiButton = ({ taxi, onAssignUnit, orders, onCreateBaseOrder, onShowBaseModal, onShowToast }) => {
  const { counters, incrementCounter, decrementCounter, toggleStatus } = useTaxis();
  const { selectedOrderId, clearSelection } = useSelection();
  const { 
    novedadesConfig, 
    taxiNovedades, 
    subscribeToTaxi, 
    addNovedad, 
    removeNovedad, 
    getTaxiNovedadesActivas,
    getTaxiNovedadesCount 
  } = useNovedades();
  
  const counter = counters[taxi.id] || 0;
  const [showNovedadesModal, setShowNovedadesModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [optimisticNovedades, setOptimisticNovedades] = useState(new Set());
  
  // Optimizar cálculos de novedades con useMemo
  const realNovedadesCount = useMemo(() => getTaxiNovedadesCount(taxi.id), [taxi.id, getTaxiNovedadesCount]);
  const realNovedadesActivas = useMemo(() => getTaxiNovedadesActivas(taxi.id), [taxi.id, getTaxiNovedadesActivas]);
  
  // Combinar novedades reales con optimistas (evitando duplicados) - OPTIMIZADO
  const novedadesData = useMemo(() => {
    const realCodigos = new Set(realNovedadesActivas.map(n => n.codigo));
    const optimistasUnicos = Array.from(optimisticNovedades).filter(codigo => !realCodigos.has(codigo));
    
    const novedadesCount = realNovedadesCount + optimistasUnicos.length;
    const novedadesActivas = [
      ...realNovedadesActivas,
      ...optimistasUnicos.map(codigo => ({
        codigo,
        descripcion: novedadesConfig?.novedades?.find(n => n.codigo === codigo)?.descripcion || '',
        activa: true
      }))
    ];
    
    return {
      novedadesCount,
      novedadesActivas,
      hasNovedades: novedadesCount > 0
    };
  }, [realNovedadesCount, realNovedadesActivas, optimisticNovedades, novedadesConfig?.novedades]);
  
  const { novedadesCount, novedadesActivas, hasNovedades } = novedadesData;
  
  // Determinar si la fila debe ser resaltada (filas 1, 3, 5)
  const rowNumber = ((taxi.id - 1) % 5) + 1;
  const isHighlightedRow = rowNumber === 1 || rowNumber === 3 || rowNumber === 5;
  
  // Suscribirse a las novedades del taxi
  useEffect(() => {
    const unsubscribe = subscribeToTaxi(taxi.id);
    return () => unsubscribe();
  }, [taxi.id, subscribeToTaxi]);

  // Limpiar estado optimista cuando las novedades reales se actualizan
  // useEffect removido para evitar bucle infinito

  // Log temporal para debug - REMOVIDO para evitar bucle infinito
  // if (isHighlightedRow) {
  //   console.log(`Taxi ${taxi.numero} está en fila ${rowNumber} - debe ser resaltado`);
  // }

  const handleButtonClick = useCallback(async () => {
    console.log('Botón clickeado:', taxi.numero, 'checkboxMarcado:', taxi.checkboxMarcado);
    
    if (!taxi.checkboxMarcado) {
      // Si hay una fila seleccionada, verificar novedades antes de asignar
      if (selectedOrderId) {
        // Verificar si el taxi tiene novedades
        if (hasNovedades) {
          const novedadesTexto = novedadesActivas.map(n => `${n.codigo} - ${n.descripcion}`).join(', ');
          const mensaje = `Taxi ${taxi.numero} tiene novedades: ${novedadesTexto}`;
          onShowToast(mensaje, 'error');
          return;
        }
        
        console.log('Asignando unidad', taxi.numero, 'al pedido', selectedOrderId);
        
        // Asignar unidad (los contadores se manejan automáticamente en App.jsx)
        onAssignUnit(selectedOrderId, taxi.numero);
        clearSelection();
        return;
      }
      
      // Si no hay fila seleccionada, verificar novedades antes de mostrar modal de bases
      if (hasNovedades) {
        const novedadesTexto = novedadesActivas.map(n => `${n.codigo} - ${n.descripcion}`).join(', ');
        const mensaje = `Taxi ${taxi.numero} tiene novedades: ${novedadesTexto}`;
        onShowToast(mensaje, 'error');
        return;
      }
      
      // Si no tiene novedades, mostrar modal de bases
      console.log('Mostrando modal de bases para taxi:', taxi.id);
      if (onShowBaseModal) {
        onShowBaseModal(taxi.numero);
      }
    } else {
      console.log('Taxi deshabilitado, no se incrementa contador');
    }
  }, [taxi.checkboxMarcado, taxi.numero, taxi.id, selectedOrderId, hasNovedades, novedadesActivas, onShowToast, onAssignUnit, clearSelection, onShowBaseModal]);

  const handleCheckboxChange = useCallback(async (e) => {
    try {
      // Si se marca el checkbox, se desactiva el taxi
      // Si se desmarca el checkbox, se activa el taxi
      await toggleStatus(taxi.id, e.target.checked);
    } catch (error) {
      console.error('Error alternando estado:', error);
    }
  }, [taxi.id, toggleStatus]);

  // Manejar click derecho para mostrar modal de novedades
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    console.log('Click derecho en taxi:', taxi.numero);
    setShowNovedadesModal(true);
  }, [taxi.numero]);

  // Manejar click en el badge para mostrar novedades activas
  const handleBadgeClick = useCallback((e) => {
    e.stopPropagation();
    setShowBadgeModal(true);
  }, []);

  // Manejar toggle de novedad - OPTIMIZADO
  const handleToggleNovedad = useCallback(async (taxiId, codigo, descripcion, activar) => {
    console.log('handleToggleNovedad llamado:', { taxiId, codigo, descripcion, activar });
    
    // Actualizar estado optimista inmediatamente
    if (activar) {
      setOptimisticNovedades(prev => new Set(prev).add(codigo));
    } else {
      setOptimisticNovedades(prev => {
        const newSet = new Set(prev);
        newSet.delete(codigo);
        return newSet;
      });
    }
    
    try {
      if (activar) {
        console.log('Agregando novedad:', codigo);
        await addNovedad(taxiId, codigo, descripcion);
        console.log('Novedad agregada exitosamente');
      } else {
        console.log('Removiendo novedad:', codigo);
        await removeNovedad(taxiId, codigo);
        console.log('Novedad removida exitosamente');
      }
    } catch (error) {
      console.error('Error toggleando novedad:', error);
      // Revertir estado optimista en caso de error
      if (activar) {
        setOptimisticNovedades(prev => {
          const newSet = new Set(prev);
          newSet.delete(codigo);
          return newSet;
        });
      } else {
        setOptimisticNovedades(prev => new Set(prev).add(codigo));
      }
    }
  }, [addNovedad, removeNovedad]);


  return (
    <div className={`taxi-item ${isHighlightedRow ? 'highlighted-row' : ''}`}>
      <input
        type="checkbox"
        className="taxi-checkbox"
        checked={taxi.checkboxMarcado || false} // Checkbox desmarcado por defecto
        onChange={handleCheckboxChange}
      />
      <button
        className="taxi-button"
        onClick={handleButtonClick}
        onContextMenu={handleRightClick}
        disabled={taxi.checkboxMarcado}
      >
        {taxi.numero}
        {hasNovedades && (
          <div 
            className="novedades-badge"
            onClick={handleBadgeClick}
            title="Click para ver novedades"
          >
            {novedadesCount}
          </div>
        )}
      </button>
      <div className={`taxi-counter ${taxi.checkboxMarcado ? 'disabled' : ''}`}>
        {counter}
      </div>
      
      {/* Modal de novedades */}
      <NovedadesModal
        isOpen={showNovedadesModal}
        onClose={() => setShowNovedadesModal(false)}
        taxiId={taxi.numero}
        novedadesConfig={novedadesConfig}
        taxiNovedades={taxiNovedades[taxi.id]}
        onToggleNovedad={handleToggleNovedad}
      />
      
      {/* Modal de badge */}
      <NovedadesBadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        taxiId={taxi.numero}
        novedadesActivas={novedadesActivas}
      />
    </div>
  );
};

export default TaxiButton;
