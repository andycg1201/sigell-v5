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

  return (
    <div className="taxis-section">
      <h2>Control de Taxis</h2>
      <div className="taxi-grid">
        {taxis.map((taxi) => (
          <TaxiButton key={taxi.id} taxi={taxi} />
        ))}
      </div>
    </div>
  );
};

export default TaxiGrid;
