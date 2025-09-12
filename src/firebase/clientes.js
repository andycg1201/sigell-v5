import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Función para obtener un cliente por teléfono
export const getClienteByPhone = async (telefono) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    const clienteSnap = await getDoc(clienteRef);
    
    if (clienteSnap.exists()) {
      return { id: clienteSnap.id, ...clienteSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    throw error;
  }
};

// Función para crear o actualizar un cliente
export const saveCliente = async (telefono, clienteData) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    await setDoc(clienteRef, {
      ...clienteData,
      telefono,
      ultimaActualizacion: serverTimestamp()
    });
    
    console.log(`Cliente ${telefono} guardado exitosamente`);
    return true;
  } catch (error) {
    console.error('Error guardando cliente:', error);
    throw error;
  }
};

// Función para agregar una dirección a un cliente
export const addDireccionToCliente = async (telefono, direccion) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    const clienteSnap = await getDoc(clienteRef);
    
    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      const direcciones = clienteData.direcciones || [];
      
      // Verificar si la dirección ya existe
      const direccionExiste = direcciones.some(dir => 
        dir.direccion.toLowerCase() === direccion.direccion.toLowerCase()
      );
      
      if (!direccionExiste) {
        const nuevaDireccion = {
          id: Date.now().toString(),
          direccion: direccion.direccion,
          esPrincipal: direcciones.length === 0, // Primera dirección es principal
          fechaAgregada: new Date().toISOString()
        };
        
        direcciones.push(nuevaDireccion);
        
        await updateDoc(clienteRef, {
          direcciones,
          ultimaActualizacion: serverTimestamp()
        });
        
        console.log(`Dirección agregada al cliente ${telefono}`);
        return true;
      } else {
        console.log('La dirección ya existe para este cliente');
        return false;
      }
    } else {
      // Crear nuevo cliente con la dirección
      await saveCliente(telefono, {
        nombre: direccion.nombre || 'Cliente',
        direcciones: [{
          id: Date.now().toString(),
          direccion: direccion.direccion,
          esPrincipal: true,
          fechaAgregada: new Date().toISOString()
        }]
      });
      
      console.log(`Nuevo cliente ${telefono} creado con dirección`);
      return true;
    }
  } catch (error) {
    console.error('Error agregando dirección:', error);
    throw error;
  }
};

// Función para agregar calificación/historial a un cliente
export const addCalificacionToCliente = async (telefono, calificacionData) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    const clienteSnap = await getDoc(clienteRef);
    
    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      const historial = clienteData.historial || [];
      
      const nuevaCalificacion = {
        id: Date.now().toString(),
        fecha: calificacionData.fecha || new Date().toISOString().split('T')[0],
        hora: calificacionData.hora,
        unidad: calificacionData.unidad,
        operador: calificacionData.operador,
        incidente: calificacionData.incidente,
        tipo: calificacionData.tipo, // 'positivo', 'negativo', 'neutral'
        pedidoId: calificacionData.pedidoId,
        fechaRegistro: new Date().toISOString()
      };
      
      historial.push(nuevaCalificacion);
      
      // Actualizar calificación general del cliente
      const calificacionesNegativas = historial.filter(h => h.tipo === 'negativo').length;
      const calificacionesPositivas = historial.filter(h => h.tipo === 'positivo').length;
      
      let nivelGeneral = 'normal';
      if (calificacionesNegativas > calificacionesPositivas) {
        nivelGeneral = 'problematico';
      } else if (calificacionesPositivas > calificacionesNegativas) {
        nivelGeneral = 'excelente';
      }
      
      await updateDoc(clienteRef, {
        historial,
        calificacion: {
          nivel: nivelGeneral,
          observacion: calificacionData.incidente,
          ultimaActualizacion: new Date().toISOString()
        },
        ultimaActualizacion: serverTimestamp()
      });
      
      console.log(`Calificación agregada al cliente ${telefono}`);
      return true;
    } else {
      // Crear nuevo cliente con la calificación
      await saveCliente(telefono, {
        nombre: 'Cliente',
        historial: [{
          id: Date.now().toString(),
          fecha: calificacionData.fecha || new Date().toISOString().split('T')[0],
          hora: calificacionData.hora,
          unidad: calificacionData.unidad,
          operador: calificacionData.operador,
          incidente: calificacionData.incidente,
          tipo: calificacionData.tipo,
          pedidoId: calificacionData.pedidoId,
          fechaRegistro: new Date().toISOString()
        }],
        calificacion: {
          nivel: calificacionData.tipo === 'negativo' ? 'problematico' : 'normal',
          observacion: calificacionData.incidente,
          ultimaActualizacion: new Date().toISOString()
        }
      });
      
      console.log(`Nuevo cliente ${telefono} creado con calificación`);
      return true;
    }
  } catch (error) {
    console.error('Error agregando calificación:', error);
    throw error;
  }
};

// Función para obtener historial de un cliente
export const getHistorialCliente = async (telefono) => {
  try {
    const cliente = await getClienteByPhone(telefono);
    if (cliente && cliente.historial) {
      // Ordenar historial por fecha descendente
      return cliente.historial.sort((a, b) => 
        new Date(b.fechaRegistro?.toDate?.() || b.fecha) - 
        new Date(a.fechaRegistro?.toDate?.() || a.fecha)
      );
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
};

// Función para cargar clientes masivamente (para los 15,000 clientes)
export const cargarClientesMasivamente = async (clientesData) => {
  try {
    console.log(`Iniciando carga masiva de ${clientesData.length} clientes...`);
    
    const batch = [];
    let contador = 0;
    
    for (const cliente of clientesData) {
      const clienteRef = doc(db, 'clientes', cliente.telefono);
      batch.push(setDoc(clienteRef, {
        nombre: cliente.nombre || 'Cliente',
        direcciones: cliente.direcciones || [],
        historial: cliente.historial || [],
        calificacion: cliente.calificacion || { nivel: 'normal' },
        fechaCreacion: serverTimestamp(),
        ultimaActualizacion: serverTimestamp()
      }));
      
      contador++;
      
      // Procesar en lotes de 500 (límite de Firebase)
      if (batch.length >= 500) {
        await Promise.all(batch);
        console.log(`${contador} clientes cargados...`);
        batch.length = 0; // Limpiar el batch
      }
    }
    
    // Procesar el último lote si queda algo
    if (batch.length > 0) {
      await Promise.all(batch);
    }
    
    console.log(`✅ Carga masiva completada: ${contador} clientes cargados`);
    return contador;
  } catch (error) {
    console.error('Error en carga masiva:', error);
    throw error;
  }
};

// Función para reordenar direcciones de un cliente
export const reordenarDirecciones = async (telefono, direccionesReordenadas) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    await updateDoc(clienteRef, {
      direcciones: direccionesReordenadas,
      ultimaActualizacion: serverTimestamp()
    });
    
    console.log(`Direcciones reordenadas para cliente ${telefono}`);
    return true;
  } catch (error) {
    console.error('Error reordenando direcciones:', error);
    throw error;
  }
};

// Función para editar una dirección específica
export const editarDireccion = async (telefono, direccionId, nuevaDireccion) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    const clienteSnap = await getDoc(clienteRef);
    
    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      const direcciones = clienteData.direcciones || [];
      
      const direccionIndex = direcciones.findIndex(dir => dir.id === direccionId);
      if (direccionIndex !== -1) {
        direcciones[direccionIndex].direccion = nuevaDireccion;
        
        await updateDoc(clienteRef, {
          direcciones,
          ultimaActualizacion: serverTimestamp()
        });
        
        console.log(`Dirección editada para cliente ${telefono}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error editando dirección:', error);
    throw error;
  }
};

// Función para eliminar una dirección específica
export const eliminarDireccion = async (telefono, direccionId) => {
  try {
    const clienteRef = doc(db, 'clientes', telefono);
    const clienteSnap = await getDoc(clienteRef);
    
    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      const direcciones = clienteData.direcciones || [];
      
      const direccionesFiltradas = direcciones.filter(dir => dir.id !== direccionId);
      
      // Si era la primera dirección, hacer que la nueva primera sea principal
      if (direccionesFiltradas.length > 0) {
        direccionesFiltradas[0].esPrincipal = true;
      }
      
      await updateDoc(clienteRef, {
        direcciones: direccionesFiltradas,
        ultimaActualizacion: serverTimestamp()
      });
      
      console.log(`Dirección eliminada para cliente ${telefono}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando dirección:', error);
    throw error;
  }
};

// Función para buscar clientes por nombre o teléfono
export const buscarClientes = async (termino) => {
  try {
    const clientesRef = collection(db, 'clientes');
    const q = query(
      clientesRef,
      where('nombre', '>=', termino),
      where('nombre', '<=', termino + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    const clientes = [];
    
    querySnapshot.forEach((doc) => {
      clientes.push({ id: doc.id, ...doc.data() });
    });
    
    return clientes;
  } catch (error) {
    console.error('Error buscando clientes:', error);
    throw error;
  }
};
