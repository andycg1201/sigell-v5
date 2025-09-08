import { db } from './config';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Función para obtener la configuración de bases
export const getBasesConfig = async () => {
  try {
    const docRef = doc(db, 'configuracion', 'bases');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Si no existe, crear configuración inicial
      const initialConfig = {
        bases: [
          { id: 1, nombre: 'BASE 1', direccion: '' },
          { id: 2, nombre: 'BASE 2', direccion: '' },
          { id: 3, nombre: 'BASE 3', direccion: '' },
          { id: 4, nombre: 'BASE 4', direccion: '' },
          { id: 5, nombre: 'BASE 5', direccion: '' }
        ]
      };
      await setDoc(docRef, initialConfig);
      return initialConfig;
    }
  } catch (error) {
    console.error('Error obteniendo configuración de bases:', error);
    throw error;
  }
};

// Función para actualizar la configuración de bases
export const updateBasesConfig = async (bases) => {
  try {
    const docRef = doc(db, 'configuracion', 'bases');
    await setDoc(docRef, { bases });
    return bases;
  } catch (error) {
    console.error('Error actualizando configuración de bases:', error);
    throw error;
  }
};

// Función para suscribirse a cambios en la configuración de bases
export const subscribeToBasesConfig = (callback) => {
  const docRef = doc(db, 'configuracion', 'bases');
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      // Si no existe, crear configuración inicial
      const initialConfig = {
        bases: [
          { id: 1, nombre: 'BASE 1', direccion: '' },
          { id: 2, nombre: 'BASE 2', direccion: '' },
          { id: 3, nombre: 'BASE 3', direccion: '' },
          { id: 4, nombre: 'BASE 4', direccion: '' },
          { id: 5, nombre: 'BASE 5', direccion: '' }
        ]
      };
      setDoc(docRef, initialConfig);
      callback(initialConfig);
    }
  }, (error) => {
    console.error('Error en suscripción a bases:', error);
  });
};
