import React from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { useSelection } from '../contexts/SelectionContext';

const TaxiButton = ({ taxi, onAssignUnit, orders }) => {
  const { counters, incrementCounter, decrementCounter, toggleStatus } = useTaxis();
  const { selectedOrderId, clearSelection } = useSelection();
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
      
      // Si no hay fila seleccionada, incrementar contador manualmente
      try {
        console.log('Incrementando contador para taxi:', taxi.id);
        await incrementCounter(taxi.id);
        console.log('Contador incrementado exitosamente');
      } catch (error) {
        console.error('Error incrementando contador:', error);
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
    </div>
  );
};

export default TaxiButton;
