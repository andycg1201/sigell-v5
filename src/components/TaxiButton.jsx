import React, { useState, useEffect } from 'react';
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
  
  const novedadesCount = getTaxiNovedadesCount(taxi.id);
  const novedadesActivas = getTaxiNovedadesActivas(taxi.id);
  const hasNovedades = novedadesCount > 0;
  
  // Determinar si la fila debe ser resaltada (filas 1, 3, 5)
  const rowNumber = ((taxi.id - 1) % 5) + 1;
  const isHighlightedRow = rowNumber === 1 || rowNumber === 3 || rowNumber === 5;
  
  // Suscribirse a las novedades del taxi
  useEffect(() => {
    const unsubscribe = subscribeToTaxi(taxi.id);
    return () => unsubscribe();
  }, [taxi.id, subscribeToTaxi]);

  // Log temporal para debug
  if (isHighlightedRow) {
    console.log(`Taxi ${taxi.numero} está en fila ${rowNumber} - debe ser resaltado`);
  }

  const handleButtonClick = async () => {
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
      
      // Si no hay fila seleccionada, mostrar modal de bases
      console.log('Mostrando modal de bases para taxi:', taxi.id);
      if (onShowBaseModal) {
        onShowBaseModal(taxi.numero);
      }
    } else {
      console.log('Taxi deshabilitado, no se incrementa contador');
    }
  };

  const handleCheckboxChange = async (e) => {
    try {
      // Si se marca el checkbox, se desactiva el taxi
      // Si se desmarca el checkbox, se activa el taxi
      await toggleStatus(taxi.id, e.target.checked);
    } catch (error) {
      console.error('Error alternando estado:', error);
    }
  };

  // Manejar click derecho para mostrar modal de novedades
  const handleRightClick = (e) => {
    e.preventDefault();
    setShowNovedadesModal(true);
  };

  // Manejar click en el badge para mostrar novedades activas
  const handleBadgeClick = (e) => {
    e.stopPropagation();
    setShowBadgeModal(true);
  };

  // Manejar toggle de novedad
  const handleToggleNovedad = async (taxiId, codigo, descripcion, activar) => {
    try {
      if (activar) {
        await addNovedad(taxiId, codigo, descripcion);
      } else {
        await removeNovedad(taxiId, codigo);
      }
    } catch (error) {
      console.error('Error toggleando novedad:', error);
    }
  };


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
