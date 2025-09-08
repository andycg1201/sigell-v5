import React from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import TaxiButton from './TaxiButton';

const TaxiGrid = ({ onAssignUnit, orders, onCreateBaseOrder }) => {
  const { taxis, loading } = useTaxis();

  if (loading) {
    return (
      <div className="taxis-section">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Cargando taxis...
        </div>
      </div>
    );
  }

  return (
    <div className="taxis-section">
      <div className="taxi-grid">
        {taxis.map((taxi) => (
          <TaxiButton 
            key={taxi.id} 
            taxi={taxi} 
            onAssignUnit={onAssignUnit} 
            orders={orders}
            onCreateBaseOrder={onCreateBaseOrder}
          />
        ))}
      </div>
    </div>
  );
};

export default TaxiGrid;
