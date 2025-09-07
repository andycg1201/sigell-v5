import React from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import TaxiButton from './TaxiButton';

const TaxiGrid = () => {
  const { taxis, loading } = useTaxis();

  if (loading) {
    return (
      <div className="taxis-section">
        <h2>Control de Taxis</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Cargando taxis...
        </div>
      </div>
    );
  }

  // Organizar taxis por columnas (1,2,3,4,5 en primera columna, 6,7,8,9,10 en segunda, etc.)
  const organizedTaxis = [];
  const taxisPerColumn = 5;
  const totalColumns = Math.ceil(taxis.length / taxisPerColumn);
  
  for (let col = 0; col < totalColumns; col++) {
    for (let row = 0; row < taxisPerColumn; row++) {
      const index = col * taxisPerColumn + row;
      if (index < taxis.length) {
        organizedTaxis.push(taxis[index]);
      }
    }
  }

  return (
    <div className="taxis-section">
      <h2>Control de Taxis</h2>
      <div className="taxi-grid">
        {organizedTaxis.map((taxi) => (
          <TaxiButton key={taxi.id} taxi={taxi} />
        ))}
      </div>
    </div>
  );
};

export default TaxiGrid;
