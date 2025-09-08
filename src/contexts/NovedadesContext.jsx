import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeToNovedadesConfig, 
  updateNovedadesConfig,
  subscribeToTaxiNovedades,
  addTaxiNovedad,
  removeTaxiNovedad
} from '../firebase/novedades';

const NovedadesContext = createContext();

export const useNovedades = () => {
  const context = useContext(NovedadesContext);
  if (!context) {
    throw new Error('useNovedades debe ser usado dentro de NovedadesProvider');
  }
  return context;
};

export const NovedadesProvider = ({ children }) => {
  const [novedadesConfig, setNovedadesConfig] = useState({
    novedades: [],
    mantenerAlCierre: true
  });
  const [taxiNovedades, setTaxiNovedades] = useState({});

  // Suscribirse a la configuración de novedades
  useEffect(() => {
    const unsubscribe = subscribeToNovedadesConfig((config) => {
      if (config) {
        setNovedadesConfig(config);
      }
    });

    return () => unsubscribe();
  }, []);

  // Función para actualizar la configuración de novedades
  const updateConfig = async (newConfig) => {
    try {
      await updateNovedadesConfig(newConfig);
    } catch (error) {
      console.error('Error actualizando configuración de novedades:', error);
      throw error;
    }
  };

  // Función para suscribirse a las novedades de un taxi específico
  const subscribeToTaxi = (taxiId) => {
    const unsubscribe = subscribeToTaxiNovedades(taxiId, (data) => {
      setTaxiNovedades(prev => ({
        ...prev,
        [taxiId]: data
      }));
    });

    return unsubscribe;
  };

  // Función para agregar una novedad a un taxi
  const addNovedad = async (taxiId, codigo, descripcion) => {
    try {
      await addTaxiNovedad(taxiId, codigo, descripcion);
    } catch (error) {
      console.error('Error agregando novedad:', error);
      throw error;
    }
  };

  // Función para remover una novedad de un taxi
  const removeNovedad = async (taxiId, codigo) => {
    try {
      await removeTaxiNovedad(taxiId, codigo);
    } catch (error) {
      console.error('Error removiendo novedad:', error);
      throw error;
    }
  };

  // Función para obtener las novedades activas de un taxi
  const getTaxiNovedadesActivas = (taxiId) => {
    const taxiData = taxiNovedades[taxiId];
    if (!taxiData || !taxiData.novedades) {
      return [];
    }
    return taxiData.novedades.filter(n => n.activa);
  };

  // Función para obtener el contador de novedades de un taxi
  const getTaxiNovedadesCount = (taxiId) => {
    return getTaxiNovedadesActivas(taxiId).length;
  };

  // Función para verificar si un taxi tiene novedades
  const hasTaxiNovedades = (taxiId) => {
    return getTaxiNovedadesCount(taxiId) > 0;
  };

  const value = {
    novedadesConfig,
    taxiNovedades,
    updateConfig,
    subscribeToTaxi,
    addNovedad,
    removeNovedad,
    getTaxiNovedadesActivas,
    getTaxiNovedadesCount,
    hasTaxiNovedades
  };

  return (
    <NovedadesContext.Provider value={value}>
      {children}
    </NovedadesContext.Provider>
  );
};
