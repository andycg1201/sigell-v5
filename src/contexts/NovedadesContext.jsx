import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  subscribeToNovedadesConfig, 
  updateNovedadesConfig,
  subscribeToTaxiNovedades,
  addTaxiNovedad,
  removeTaxiNovedad,
  getNovedadesConfig
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
    const initializeConfig = async () => {
      try {
        // Primero intentar obtener la configuración existente
        const config = await getNovedadesConfig();
        if (config) {
          setNovedadesConfig(config);
          console.log('Configuración de novedades cargada correctamente');
        }
      } catch (error) {
        console.error('Error inicializando configuración de novedades:', error);
      }
    };

    initializeConfig();

    const unsubscribe = subscribeToNovedadesConfig((config) => {
      if (config) {
        setNovedadesConfig(config);
        // console.log('Configuración de novedades actualizada:', config);
      }
    });

    return () => unsubscribe();
  }, []);

  // Función para actualizar la configuración de novedades - OPTIMIZADA
  const updateConfig = useCallback(async (newConfig) => {
    try {
      await updateNovedadesConfig(newConfig);
    } catch (error) {
      console.error('Error actualizando configuración de novedades:', error);
      throw error;
    }
  }, []);

  // Función para suscribirse a las novedades de un taxi específico - OPTIMIZADA
  const subscribeToTaxi = useCallback((taxiId) => {
    const unsubscribe = subscribeToTaxiNovedades(taxiId, (data) => {
      setTaxiNovedades(prev => ({
        ...prev,
        [taxiId]: data
      }));
    });

    return unsubscribe;
  }, []);

  // Función para agregar una novedad a un taxi - OPTIMIZADA
  const addNovedad = useCallback(async (taxiId, codigo, descripcion) => {
    console.log('NovedadesContext - addNovedad:', { taxiId, codigo, descripcion });
    try {
      await addTaxiNovedad(taxiId, codigo, descripcion);
      console.log('NovedadesContext - novedad agregada exitosamente');
    } catch (error) {
      console.error('Error agregando novedad:', error);
      throw error;
    }
  }, []);

  // Función para remover una novedad de un taxi - OPTIMIZADA
  const removeNovedad = useCallback(async (taxiId, codigo) => {
    console.log('NovedadesContext - removeNovedad:', { taxiId, codigo });
    try {
      await removeTaxiNovedad(taxiId, codigo);
      console.log('NovedadesContext - novedad removida exitosamente');
    } catch (error) {
      console.error('Error removiendo novedad:', error);
      throw error;
    }
  }, []);

  // Función para obtener las novedades activas de un taxi - OPTIMIZADA
  const getTaxiNovedadesActivas = useCallback((taxiId) => {
    const taxiData = taxiNovedades[taxiId];
    if (!taxiData || !taxiData.novedades) {
      return [];
    }
    return taxiData.novedades.filter(n => n.activa);
  }, [taxiNovedades]);

  // Función para obtener el contador de novedades de un taxi - OPTIMIZADA
  const getTaxiNovedadesCount = useCallback((taxiId) => {
    return getTaxiNovedadesActivas(taxiId).length;
  }, [getTaxiNovedadesActivas]);

  // Función para verificar si un taxi tiene novedades - OPTIMIZADA
  const hasTaxiNovedades = useCallback((taxiId) => {
    return getTaxiNovedadesCount(taxiId) > 0;
  }, [getTaxiNovedadesCount]);

  // Optimizar el valor del contexto para evitar re-renderizados innecesarios
  const value = useMemo(() => ({
    novedadesConfig,
    taxiNovedades,
    updateConfig,
    subscribeToTaxi,
    addNovedad,
    removeNovedad,
    getTaxiNovedadesActivas,
    getTaxiNovedadesCount,
    hasTaxiNovedades
  }), [
    novedadesConfig,
    taxiNovedades,
    updateConfig,
    subscribeToTaxi,
    addNovedad,
    removeNovedad,
    getTaxiNovedadesActivas,
    getTaxiNovedadesCount,
    hasTaxiNovedades
  ]);

  return (
    <NovedadesContext.Provider value={value}>
      {children}
    </NovedadesContext.Provider>
  );
};

