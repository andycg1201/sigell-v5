import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToBasesConfig, updateBasesConfig } from '../firebase/bases';

const BasesContext = createContext();

export const useBases = () => {
  const context = useContext(BasesContext);
  if (!context) {
    throw new Error('useBases debe ser usado dentro de BasesProvider');
  }
  return context;
};

export const BasesProvider = ({ children }) => {
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToBasesConfig((data) => {
      console.log('BasesContext: Datos recibidos:', data);
      setBases(data.bases || []);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateConfig = async (newBases) => {
    try {
      await updateBasesConfig(newBases);
    } catch (error) {
      console.error('Error actualizando configuración de bases:', error);
      throw error;
    }
  };

  const value = {
    bases,
    loading,
    updateConfig
  };

  return (
    <BasesContext.Provider value={value}>
      {children}
    </BasesContext.Provider>
  );
};
