import React, { createContext, useContext, useState } from 'react';

const SelectionContext = createContext();

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection debe ser usado dentro de SelectionProvider');
  }
  return context;
};

export const SelectionProvider = ({ children }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectOrder = (orderId) => {
    setSelectedOrderId(orderId);
  };

  const clearSelection = () => {
    setSelectedOrderId(null);
  };

  return (
    <SelectionContext.Provider value={{
      selectedOrderId,
      selectOrder,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

