import { db } from './config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

// Función para obtener la configuración de motivos de inhabilitación
export const getMotivosInhabilitacion = async () => {
  try {
    const docRef = doc(db, 'configuracion', 'motivos_inhabilitacion');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Crear configuración por defecto
      const motivosDefault = {
        motivos: [
          {
            codigo: 'GER',
            concepto: 'Gerencia - Taxis no al día',
            color: '#dc2626',
            icono: '👔',
            activo: true
          },
          {
            codigo: 'INS_PAR',
            concepto: 'Inspector Parada - Multa no pagada',
            color: '#f59e0b',
            icono: '🚦',
            activo: true
          },
          {
            codigo: 'INS_DEP',
            concepto: 'Inspector Deportes - Evento no participado',
            color: '#8b5cf6',
            icono: '⚽',
            activo: true
          }
        ],
        ultimaActualizacion: serverTimestamp()
      };
      
      await setDoc(docRef, motivosDefault);
      return motivosDefault;
    }
  } catch (error) {
    console.error('Error obteniendo motivos de inhabilitación:', error);
    throw error;
  }
};

// Función para actualizar la configuración de motivos
export const updateMotivosInhabilitacion = async (motivos) => {
  try {
    const docRef = doc(db, 'configuracion', 'motivos_inhabilitacion');
    await updateDoc(docRef, {
      motivos: motivos,
      ultimaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error actualizando motivos de inhabilitación:', error);
    throw error;
  }
};

// Función para inhabilitar un taxi
export const inhabilitarTaxi = async (taxiId, motivo, responsable, valor = 0) => {
  try {
    console.log('Inhabilitando taxi ID:', taxiId, 'Tipo:', typeof taxiId);
    
    // Obtener la configuración de taxis
    const configRef = doc(db, 'configuracion', 'taxis');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const configData = configSnap.data();
      const taxis = configData.taxis || [];
      
      // Buscar el taxi específico
      const taxiIndex = taxis.findIndex(t => t.id === taxiId);
      
      if (taxiIndex !== -1) {
        const taxi = taxis[taxiIndex];
        const motivosActuales = taxi.motivosInhabilitacion || [];
        
        // Verificar si ya está inhabilitado por este motivo
        const yaInhabilitado = motivosActuales.some(m => m.codigo === motivo.codigo && m.activo);
        
        if (!yaInhabilitado) {
          const nuevoMotivo = {
            codigo: motivo.codigo,
            concepto: motivo.concepto,
            responsable: responsable,
            valor: valor,
            fechaInhabilitacion: new Date().toISOString(),
            activo: true
          };
          
          // Actualizar el taxi específico en el array
          const taxisActualizados = [...taxis];
          taxisActualizados[taxiIndex] = {
            ...taxi,
            motivosInhabilitacion: [...motivosActuales, nuevoMotivo],
            habilitado: false
          };
          
          // Guardar la configuración actualizada
          await updateDoc(configRef, {
            taxis: taxisActualizados
          });
          
          console.log('Taxi inhabilitado exitosamente:', taxiId);
          return nuevoMotivo;
        } else {
          throw new Error('El taxi ya está inhabilitado por este motivo');
        }
      } else {
        throw new Error('Taxi no encontrado en la configuración');
      }
    } else {
      throw new Error('Configuración de taxis no encontrada');
    }
  } catch (error) {
    console.error('Error inhabilitando taxi:', error);
    throw error;
  }
};

// Función para habilitar un taxi (resolver un motivo específico)
export const habilitarTaxi = async (taxiId, codigoMotivo) => {
  try {
    console.log('Habilitando taxi ID:', taxiId, 'Motivo:', codigoMotivo);
    
    // Obtener la configuración de taxis
    const configRef = doc(db, 'configuracion', 'taxis');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const configData = configSnap.data();
      const taxis = configData.taxis || [];
      
      // Buscar el taxi específico
      const taxiIndex = taxis.findIndex(t => t.id === taxiId);
      
      if (taxiIndex !== -1) {
        const taxi = taxis[taxiIndex];
        const motivosActuales = taxi.motivosInhabilitacion || [];
        
        // Encontrar el motivo a resolver
        const motivoAResolver = motivosActuales.find(m => m.codigo === codigoMotivo && m.activo);
        
        if (motivoAResolver) {
          // Marcar el motivo como inactivo
          const motivoResuelto = {
            ...motivoAResolver,
            activo: false,
            fechaHabilitacion: new Date().toISOString()
          };
          
          // Actualizar motivos
          const motivosActualizados = motivosActuales.map(m => 
            m.codigo === codigoMotivo && m.activo ? motivoResuelto : m
          );
          
          // Verificar si quedan motivos activos
          const motivosActivos = motivosActualizados.filter(m => m.activo);
          
          // Actualizar el taxi específico en el array
          const taxisActualizados = [...taxis];
          taxisActualizados[taxiIndex] = {
            ...taxi,
            motivosInhabilitacion: motivosActualizados,
            habilitado: motivosActivos.length === 0
          };
          
          // Guardar la configuración actualizada
          await updateDoc(configRef, {
            taxis: taxisActualizados
          });
          
          console.log('Taxi habilitado exitosamente:', taxiId);
          return motivoResuelto;
        } else {
          throw new Error('Motivo no encontrado o ya resuelto');
        }
      } else {
        throw new Error('Taxi no encontrado en la configuración');
      }
    } else {
      throw new Error('Configuración de taxis no encontrada');
    }
  } catch (error) {
    console.error('Error habilitando taxi:', error);
    throw error;
  }
};

// Función para obtener motivos activos de un taxi
export const getMotivosActivosTaxi = async (taxiId) => {
  try {
    console.log('Obteniendo motivos activos para taxi ID:', taxiId);
    
    // Obtener la configuración de taxis
    const configRef = doc(db, 'configuracion', 'taxis');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const configData = configSnap.data();
      const taxis = configData.taxis || [];
      
      // Buscar el taxi específico
      const taxi = taxis.find(t => t.id === taxiId);
      
      if (taxi) {
        return taxi.motivosInhabilitacion?.filter(m => m.activo) || [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo motivos activos del taxi:', error);
    throw error;
  }
};
