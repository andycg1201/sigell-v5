import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query,
  where
} from 'firebase/firestore';
import { db } from './config';

// Función para obtener un cliente por teléfono
export const getClientByPhone = async (phone) => {
  try {
    const clientsRef = collection(db, 'clientes');
    const q = query(clientsRef, where('telefono', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    throw error;
  }
};

// Función para agregar un nuevo cliente
export const addClient = async (clientData) => {
  try {
    const clientsRef = collection(db, 'clientes');
    const docRef = await addDoc(clientsRef, {
      ...clientData,
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error agregando cliente:', error);
    throw error;
  }
};

// Función para obtener todos los clientes
export const getAllClients = async () => {
  try {
    const clientsRef = collection(db, 'clientes');
    const querySnapshot = await getDocs(clientsRef);
    
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return clients;
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    throw error;
  }
};

// Función para actualizar un cliente
export const updateClient = async (clientId, updateData) => {
  try {
    const clientRef = doc(db, 'clientes', clientId);
    await updateDoc(clientRef, updateData);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    throw error;
  }
};
