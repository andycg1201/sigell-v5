import React, { useState } from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { useSelection } from '../contexts/SelectionContext';
import { useBases } from '../contexts/BasesContext';
import BaseSelectionModal from './BaseSelectionModal';

const TaxiButton = ({ taxi, onAssignUnit, orders, onCreateBaseOrder }) => {
  const { counters, incrementCounter, decrementCounter, toggleStatus } = useTaxis();
  const { selectedOrderId, clearSelection } = useSelection();
  const { bases } = useBases();
  const [showBaseModal, setShowBaseModal] = useState(false);
  const counter = counters[taxi.id] || 0;
  
  // Determinar si la fila debe ser resaltada (filas 1, 3, 5)
  const rowNumber = ((taxi.id - 1) % 5) + 1;
  const isHighlightedRow = rowNumber === 1 || rowNumber === 3 || rowNumber === 5;
  
  // Log temporal para debug
  if (isHighlightedRow) {
    console.log(`Taxi ${taxi.numero} está en fila ${rowNumber} - debe ser resaltado`);
  }

  const handleButtonClick = async () => {
    console.log('Botón clickeado:', taxi.numero, 'checkboxMarcado:', taxi.checkboxMarcado);
    
    if (!taxi.checkboxMarcado) {
      // Si hay una fila seleccionada, asignar unidad
      if (selectedOrderId) {
        console.log('Asignando unidad', taxi.numero, 'al pedido', selectedOrderId);
        
        // Asignar unidad (los contadores se manejan automáticamente en App.jsx)
        onAssignUnit(selectedOrderId, taxi.numero);
        clearSelection();
        return;
      }
      
      // Si no hay fila seleccionada, mostrar modal de bases
      console.log('Mostrando modal de bases para taxi:', taxi.id);
      setShowBaseModal(true);
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

  const handleBaseSelect = (base) => {
    console.log('Base seleccionada:', base, 'para taxi:', taxi.id);
    if (onCreateBaseOrder) {
      onCreateBaseOrder(base, taxi.numero);
    }
    setShowBaseModal(false);
  };

  const handleCloseModal = () => {
    setShowBaseModal(false);
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
        disabled={taxi.checkboxMarcado}
      >
        {taxi.numero}
      </button>
      <div className={`taxi-counter ${taxi.checkboxMarcado ? 'disabled' : ''}`}>
        {counter}
      </div>
      
      {showBaseModal && (
        <BaseSelectionModal
          bases={bases}
          onSelectBase={handleBaseSelect}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default TaxiButton;
