import React from 'react';
import { useTaxis } from '../contexts/TaxisContext';

const TaxiButton = ({ taxi }) => {
  const { counters, incrementCounter, toggleStatus } = useTaxis();
  const counter = counters[taxi.id] || 0;

  const handleButtonClick = async () => {
    console.log('Botón clickeado:', taxi.numero, 'checkboxMarcado:', taxi.checkboxMarcado);
    if (!taxi.checkboxMarcado) {
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
    <div className="taxi-item">
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
