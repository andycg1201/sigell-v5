import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Función para obtener todos los pedidos
export const getOrders = async () => {
  try {
    const ordersRef = collection(db, 'pedidos');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    throw error;
  }
};

// Función para agregar un nuevo pedido
export const addOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'pedidos');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp()
    });
    
    // Retornar el objeto completo con el ID
    return {
      id: docRef.id,
      ...orderData,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error agregando pedido:', error);
    throw error;
  }
};

// Función para actualizar un pedido
export const updateOrder = async (orderId, updateData) => {
  try {
    const orderRef = doc(db, 'pedidos', String(orderId));
    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    throw error;
  }
};

// Función para eliminar un pedido
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'pedidos', String(orderId));
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    throw error;
  }
};

// Función para suscribirse a cambios en pedidos en tiempo real
export const subscribeToOrders = (callback) => {
  const ordersRef = collection(db, 'pedidos');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    callback(orders);
  }, (error) => {
    console.error('Error en snapshot de pedidos:', error);
  });
};
