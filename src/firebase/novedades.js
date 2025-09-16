import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// Función para obtener la configuración de novedades
export const getNovedadesConfig = async () => {
  try {
    const docRef = doc(db, 'config', 'novedades');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const config = docSnap.data();
      console.log('Configuración existente encontrada:', config);
      console.log('Número de novedades en configuración existente:', config.novedades?.length || 0);
      return config;
    } else {
      // Crear configuración por defecto
      const defaultConfig = {
        novedades: [
          { codigo: 'B23', descripcion: 'Problema eléctrico', activa: true, heredarAlCierre: true },
          { codigo: 'B45', descripcion: 'Sin combustible', activa: true, heredarAlCierre: true },
          { codigo: 'B01', descripcion: 'Avería motor', activa: true, heredarAlCierre: true },
          { codigo: 'B02', descripcion: 'Problema frenos', activa: true, heredarAlCierre: true },
          { codigo: 'B03', descripcion: 'Neumático pinchado', activa: true, heredarAlCierre: true }
        ],
        mantenerAlCierre: true,
        ultimaActualizacion: serverTimestamp()
      };
      
      console.log('Creando configuración por defecto de novedades:', defaultConfig);
      await setDoc(docRef, defaultConfig);
      console.log('Configuración por defecto creada exitosamente');
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error obteniendo configuración de novedades:', error);
    throw error;
  }
};

// Función para actualizar la configuración de novedades
export const updateNovedadesConfig = async (config) => {
  try {
    const docRef = doc(db, 'config', 'novedades');
    await updateDoc(docRef, {
      ...config,
      ultimaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error actualizando configuración de novedades:', error);
    throw error;
  }
};

// Función para forzar la actualización de la configuración con novedades por defecto
export const forzarActualizacionNovedades = async () => {
  try {
    const docRef = doc(db, 'config', 'novedades');
    const configActualizada = {
      novedades: [
        { codigo: 'B23', descripcion: 'Problema eléctrico', activa: true, heredarAlCierre: true },
        { codigo: 'B45', descripcion: 'Sin combustible', activa: true, heredarAlCierre: true },
        { codigo: 'B01', descripcion: 'Avería motor', activa: true, heredarAlCierre: true },
        { codigo: 'B02', descripcion: 'Problema frenos', activa: true, heredarAlCierre: true },
        { codigo: 'B03', descripcion: 'Neumático pinchado', activa: true, heredarAlCierre: true }
      ],
      mantenerAlCierre: true,
      ultimaActualizacion: serverTimestamp()
    };
    
    await setDoc(docRef, configActualizada);
    console.log('Configuración de novedades actualizada forzadamente');
    return configActualizada;
  } catch (error) {
    console.error('Error forzando actualización de novedades:', error);
    throw error;
  }
};

// Función para suscribirse a cambios en la configuración de novedades
export const subscribeToNovedadesConfig = (callback) => {
  const docRef = doc(db, 'config', 'novedades');
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error en snapshot de configuración de novedades:', error);
  });
};

// Función para obtener las novedades de un taxi específico
export const getTaxiNovedades = async (taxiId) => {
  try {
    const docRef = doc(db, 'taxi_novedades', String(taxiId));
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return { novedades: [], ultimaActualizacion: null };
    }
  } catch (error) {
    console.error('Error obteniendo novedades del taxi:', error);
    throw error;
  }
};

// Función para actualizar las novedades de un taxi
export const updateTaxiNovedades = async (taxiId, novedades) => {
  try {
    const docRef = doc(db, 'taxi_novedades', String(taxiId));
    await setDoc(docRef, {
      novedades: novedades,
      ultimaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error actualizando novedades del taxi:', error);
    throw error;
  }
};

// Función para suscribirse a cambios en las novedades de un taxi
export const subscribeToTaxiNovedades = (taxiId, callback) => {
  const docRef = doc(db, 'taxi_novedades', String(taxiId));
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ novedades: [], ultimaActualizacion: null });
    }
  }, (error) => {
    console.error('Error en snapshot de novedades del taxi:', error);
  });
};

// Función para agregar una novedad a un taxi
export const addTaxiNovedad = async (taxiId, codigo, descripcion) => {
  try {
    const currentData = await getTaxiNovedades(taxiId);
    const novedades = currentData.novedades || [];
    
    // Verificar si la novedad ya existe
    const novedadExistente = novedades.find(n => n.codigo === codigo);
    
    if (novedadExistente) {
      return; // Ya existe, no hacer nada
    }
    
    // Agregar nueva novedad
    const nuevaNovedad = {
      codigo,
      descripcion,
      activa: true,
      fechaHora: new Date()
    };
    
    novedades.push(nuevaNovedad);
    await updateTaxiNovedades(taxiId, novedades);
    
  } catch (error) {
    console.error('Error agregando novedad al taxi:', error);
    throw error;
  }
};

// Función para remover una novedad de un taxi
export const removeTaxiNovedad = async (taxiId, codigo) => {
  try {
    const currentData = await getTaxiNovedades(taxiId);
    const novedades = currentData.novedades || [];
    
    // Filtrar la novedad a remover
    const novedadesActualizadas = novedades.filter(n => n.codigo !== codigo);
    
    await updateTaxiNovedades(taxiId, novedadesActualizadas);
    
  } catch (error) {
    console.error('Error removiendo novedad del taxi:', error);
    throw error;
  }
};

// Función para limpiar todas las novedades al cierre del día
export const limpiarNovedadesAlCierre = async () => {
  try {
    const config = await getNovedadesConfig();
    
    if (!config.mantenerAlCierre) {
      // Obtener todos los documentos de taxi_novedades
      const novedadesRef = collection(db, 'taxi_novedades');
      const querySnapshot = await getDocs(novedadesRef);
      
      // Limpiar novedades de todos los taxis
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { novedades: [] });
      });
      
      await batch.commit();
      console.log('Novedades limpiadas al cierre del día');
    }
  } catch (error) {
    console.error('Error limpiando novedades al cierre:', error);
    throw error;
  }
};
