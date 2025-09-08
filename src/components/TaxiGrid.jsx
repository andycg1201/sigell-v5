import React, { useState } from 'react';
import { useTaxis } from '../contexts/TaxisContext';
import { useBases } from '../contexts/BasesContext';
import TaxiButton from './TaxiButton';
import BaseSelectionModal from './BaseSelectionModal';

const TaxiGrid = ({ onAssignUnit, orders, onCreateBaseOrder }) => {
  const { taxis, loading } = useTaxis();
  const { bases } = useBases();
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [selectedTaxiNumber, setSelectedTaxiNumber] = useState(null);

  const handleShowBaseModal = (taxiNumber) => {
    setSelectedTaxiNumber(taxiNumber);
    setShowBaseModal(true);
  };

  const handleBaseSelect = (base) => {
    console.log('Base seleccionada:', base, 'para taxi:', selectedTaxiNumber);
    if (onCreateBaseOrder) {
      onCreateBaseOrder(base, selectedTaxiNumber);
    }
    setShowBaseModal(false);
    setSelectedTaxiNumber(null);
  };

  const handleCloseModal = () => {
    setShowBaseModal(false);
    setSelectedTaxiNumber(null);
  };

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
            onShowBaseModal={handleShowBaseModal}
          />
        ))}
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

export default TaxiGrid;
