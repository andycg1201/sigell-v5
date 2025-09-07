import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Función para obtener la configuración de taxis
export const getTaxisConfig = async () => {
  try {
    const docRef = doc(db, 'configuracion', 'taxis');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Crear configuración por defecto - checkboxes desmarcados, botones activos
      const defaultConfig = {
        totalTaxis: 10,
        taxis: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          numero: i + 1,
          habilitado: true, // Botones activos por defecto
          checkboxMarcado: false // Checkboxes desmarcados por defecto
        }))
      };
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error obteniendo configuración de taxis:', error);
    throw error;
  }
};

// Función para actualizar la configuración de taxis
export const updateTaxisConfig = async (totalTaxis) => {
  try {
    const docRef = doc(db, 'configuracion', 'taxis');
    const taxis = Array.from({ length: totalTaxis }, (_, i) => ({
      id: i + 1,
      numero: i + 1,
      habilitado: true, // Botones activos por defecto
      checkboxMarcado: false // Checkboxes desmarcados por defecto
    }));
    
    await setDoc(docRef, { totalTaxis, taxis });
    
    // Inicializar contadores para los nuevos taxis
    const today = new Date().toISOString().split('T')[0];
    const contadoresRef = doc(db, 'contadores', 'diarios');
    const contadoresSnap = await getDoc(contadoresRef);
    
    if (contadoresSnap.exists()) {
      const contadores = contadoresSnap.data();
      const nuevosContadores = {};
      
      for (let i = 1; i <= totalTaxis; i++) {
        if (!contadores[today] || !contadores[today][i]) {
          if (!nuevosContadores[today]) nuevosContadores[today] = {};
          nuevosContadores[today][i] = 0;
        }
      }
      
      if (Object.keys(nuevosContadores).length > 0) {
        await updateDoc(contadoresRef, nuevosContadores);
      }
    } else {
      const contadoresIniciales = {
        [today]: {}
      };
      for (let i = 1; i <= totalTaxis; i++) {
        contadoresIniciales[today][i] = 0;
      }
      await setDoc(contadoresRef, contadoresIniciales);
    }
    
    return { totalTaxis, taxis };
  } catch (error) {
    console.error('Error actualizando configuración de taxis:', error);
    throw error;
  }
};

// Función para obtener contadores del día actual
export const getTodayCounters = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'contadores', 'diarios');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data[today] || {};
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error obteniendo contadores:', error);
    throw error;
  }
};

// Función para incrementar contador de un taxi
export const incrementTaxiCounter = async (taxiId) => {
  try {
    console.log('Firebase: Incrementando contador para taxi:', taxiId);
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'contadores', 'diarios');
    const docSnap = await getDoc(docRef);
    
    let contadores = {};
    if (docSnap.exists()) {
      contadores = docSnap.data();
    }
    
    if (!contadores[today]) {
      contadores[today] = {};
    }
    
    if (!contadores[today][taxiId]) {
      contadores[today][taxiId] = 0;
    }
    
    contadores[today][taxiId] += 1;
    console.log('Firebase: Nuevo valor del contador:', contadores[today][taxiId]);
    
    await setDoc(docRef, contadores);
    console.log('Firebase: Contador guardado exitosamente');
    return contadores[today][taxiId];
  } catch (error) {
    console.error('Error incrementando contador:', error);
    throw error;
  }
};

export const decrementTaxiCounter = async (taxiId) => {
  try {
    console.log('Firebase: Decrementando contador para taxi:', taxiId);
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'contadores', 'diarios');
    const docSnap = await getDoc(docRef);
    
    let contadores = {};
    if (docSnap.exists()) {
      contadores = docSnap.data();
    }
    
    if (!contadores[today]) {
      contadores[today] = {};
    }
    
    if (!contadores[today][taxiId]) {
      contadores[today][taxiId] = 0;
    }
    
    // Solo decrementar si es mayor a 0
    if (contadores[today][taxiId] > 0) {
      contadores[today][taxiId] -= 1;
    }
    
    console.log('Firebase: Nuevo valor del contador:', contadores[today][taxiId]);
    
    await setDoc(docRef, contadores);
    console.log('Firebase: Contador guardado exitosamente');
    return contadores[today][taxiId];
  } catch (error) {
    console.error('Error decrementando contador:', error);
    throw error;
  }
};

// Función para alternar estado de un taxi
export const toggleTaxiStatus = async (taxiId, checkboxMarcado) => {
  try {
    const docRef = doc(db, 'configuracion', 'taxis');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const taxis = data.taxis.map(taxi => 
        taxi.id === taxiId ? { 
          ...taxi, 
          checkboxMarcado,
          habilitado: !checkboxMarcado // Si checkbox marcado, taxi deshabilitado
        } : taxi
      );
      
      await updateDoc(docRef, { taxis });
      return taxis;
    }
  } catch (error) {
    console.error('Error alternando estado de taxi:', error);
    throw error;
  }
};

// Función para suscribirse a cambios en tiempo real
export const subscribeToTaxisData = (callback) => {
  const configRef = doc(db, 'configuracion', 'taxis');
  const contadoresRef = doc(db, 'contadores', 'diarios');
  
  let configData = null;
  let countersData = null;
  
  const updateCallback = () => {
    if (configData && countersData !== null) {
      const today = new Date().toISOString().split('T')[0];
      const todayCounters = countersData[today] || {};
      callback({
        config: configData,
        counters: todayCounters
      });
    }
  };
  
  const unsubscribeConfig = onSnapshot(configRef, (doc) => {
    if (doc.exists()) {
      configData = doc.data();
      updateCallback();
    }
  }, (error) => {
    console.error('Error en snapshot de configuración:', error);
  });

  const unsubscribeContadores = onSnapshot(contadoresRef, (doc) => {
    if (doc.exists()) {
      countersData = doc.data();
      updateCallback();
    } else {
      countersData = {};
      updateCallback();
    }
  }, (error) => {
    console.error('Error en snapshot de contadores:', error);
  });
  
  // Retornar función para cancelar ambas suscripciones
  return () => {
    unsubscribeConfig();
    unsubscribeContadores();
  };
};
