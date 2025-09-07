import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToTaxisData, updateTaxisConfig, incrementTaxiCounter, toggleTaxiStatus } from '../firebase/taxis';

const TaxisContext = createContext();

export const useTaxis = () => {
  const context = useContext(TaxisContext);
  if (!context) {
    throw new Error('useTaxis debe ser usado dentro de TaxisProvider');
  }
  return context;
};

export const TaxisProvider = ({ children }) => {
  const [taxis, setTaxis] = useState([]);
  const [counters, setCounters] = useState({});
  const [totalTaxis, setTotalTaxis] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTaxisData((data) => {
      setTaxis(data.config.taxis || []);
      setCounters(data.counters || {});
      setTotalTaxis(data.config.totalTaxis || 10);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateConfig = async (newTotalTaxis) => {
    try {
      await updateTaxisConfig(newTotalTaxis);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  };

  const incrementCounter = async (taxiId) => {
    try {
      await incrementTaxiCounter(taxiId);
    } catch (error) {
      console.error('Error incrementando contador:', error);
      throw error;
    }
  };

  const toggleStatus = async (taxiId, habilitado) => {
    try {
      await toggleTaxiStatus(taxiId, habilitado);
    } catch (error) {
      console.error('Error alternando estado:', error);
      throw error;
    }
  };

  const value = {
    taxis,
    counters,
    totalTaxis,
    loading,
    updateConfig,
    incrementCounter,
    toggleStatus
  };

  return (
    <TaxisContext.Provider value={value}>
      {children}
    </TaxisContext.Provider>
  );
};
