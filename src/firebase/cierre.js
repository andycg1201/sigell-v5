import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  writeBatch,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Función para obtener la fecha del último cierre
export const getUltimoCierre = async () => {
  try {
    const docRef = doc(db, 'sistema_control', 'cierre_diario');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().ultimoCierre;
    } else {
      // Si no existe, crear con fecha de ayer
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];
      
      await setDoc(docRef, {
        ultimoCierre: fechaAyer,
        ultimaActualizacion: serverTimestamp()
      });
      
      return fechaAyer;
    }
  } catch (error) {
    console.error('Error obteniendo último cierre:', error);
    throw error;
  }
};

// Función para marcar que se completó el cierre del día
export const marcarCierreCompletado = async (fecha) => {
  try {
    const docRef = doc(db, 'sistema_control', 'cierre_diario');
    await setDoc(docRef, {
      ultimoCierre: fecha,
      ultimaActualizacion: serverTimestamp()
    });

    console.log(`Cierre completado para la fecha: ${fecha}`);
  } catch (error) {
    console.error('Error marcando cierre completado:', error);
    throw error;
  }
};

// Función para resetear el estado de cierre (para testing)
export const resetearEstadoCierre = async () => {
  try {
    const docRef = doc(db, 'sistema_control', 'cierre_diario');
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];

    await setDoc(docRef, {
      ultimoCierre: fechaAyer,
      ultimaActualizacion: serverTimestamp()
    });

    console.log(`Estado de cierre reseteado a fecha anterior: ${fechaAyer}`);
  } catch (error) {
    console.error('Error reseteando estado de cierre:', error);
    throw error;
  }
};

// Función para verificar si ya se hizo cierre hoy
export const verificarCierreDelDia = async () => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const ultimoCierre = await getUltimoCierre();
    
    return {
      necesitaCierre: ultimoCierre !== hoy,
      ultimoCierre,
      fechaHoy: hoy
    };
  } catch (error) {
    console.error('Error verificando cierre del día:', error);
    throw error;
  }
};

// Función para archivar todos los pedidos del día
export const archivarPedidosDelDia = async (fecha) => {
  try {
    console.log(`=== ARCHIVANDO PEDIDOS DEL DÍA: ${fecha} ===`);
    
    // Obtener todos los pedidos actuales
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    
    console.log(`Pedidos encontrados en la colección: ${querySnapshot.size}`);
    
    const pedidosDelDia = [];
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      pedidosDelDia.push(pedido);
      console.log(`Agregando pedido a eliminar: ${doc.id}`);
      
      // Agregar eliminación del pedido al batch
      batch.delete(doc.ref);
    });
    
    console.log(`Total de pedidos a procesar: ${pedidosDelDia.length}`);
    
    if (pedidosDelDia.length > 0) {
      // Archivar primero
      const archivoRef = doc(db, 'pedidos_archivados', fecha);
      console.log(`Creando archivo en: pedidos_archivados/${fecha}`);

      await setDoc(archivoRef, {
        fecha,
        pedidos: pedidosDelDia,
        totalPedidos: pedidosDelDia.length,
        fechaArchivado: serverTimestamp()
      });

      console.log(`✅ ${pedidosDelDia.length} pedidos archivados en ${fecha}`);

      // Eliminar en lotes de 499 para evitar límite de batch
      const batchSize = 499;
      for (let i = 0; i < pedidosDelDia.length; i += batchSize) {
        const batch = writeBatch(db);
        const end = Math.min(i + batchSize, pedidosDelDia.length);

        for (let j = i; j < end; j++) {
          const pedidoRef = doc(db, 'pedidos', pedidosDelDia[j].id);
          batch.delete(pedidoRef);
        }

        console.log(`Ejecutando batch de eliminación ${Math.floor(i / batchSize) + 1}...`);
        await batch.commit();
        console.log(`✅ Eliminados ${end - i} pedidos`);
      }

      console.log(`✅ ${pedidosDelDia.length} pedidos archivados y eliminados de la vista actual`);
    } else {
      console.log('No hay pedidos para archivar');
    }
    
    return pedidosDelDia.length;
  } catch (error) {
    console.error('❌ Error archivando pedidos:', error);
    throw error;
  }
};

// Función para resetear todos los contadores a cero
export const resetearContadores = async () => {
  try {
    console.log('Reseteando contadores a cero');
    
    const contadoresRef = doc(db, 'contadores', 'diarios');
    const docSnap = await getDoc(contadoresRef);
    
    let contadores = {};
    if (docSnap.exists()) {
      contadores = docSnap.data();
    }
    
    // Resetear contadores del día actual a cero
    const hoy = new Date().toISOString().split('T')[0];
    contadores[hoy] = {};
    
    // También inicializar contadores para mañana en cero
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];
    contadores[fechaManana] = {};
    
    await setDoc(contadoresRef, contadores);
    console.log(`Contadores reseteados para hoy (${hoy}) e inicializados para mañana (${fechaManana})`);
    
    return true;
  } catch (error) {
    console.error('Error reseteando contadores:', error);
    throw error;
  }
};


// Función principal de cierre del día
export const ejecutarCierreDelDia = async (fechaCierre, forzar = false) => {
  try {
    // VERIFICACIÓN DE SEGURIDAD: Solo permitir cierre en ventana de medianoche (a menos que se fuerce)
    if (!forzar) {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minuto = ahora.getMinutes();
      const segundo = ahora.getSeconds();

      // Solo permitir entre 00:00:00 y 00:00:30
      if (hora !== 0 || minuto !== 0 || segundo > 30) {
        console.error(`❌ BLOQUEANDO CIERRE FUERA DE HORA: ${hora}:${minuto}:${segundo} - Solo se permite entre 00:00:00-00:00:30`);
        throw new Error(`Cierre bloqueado: Solo se permite ejecutar entre 00:00:00 y 00:00:30. Hora actual: ${hora}:${minuto}:${segundo}`);
      }

      console.log(`✅ VERIFICACIÓN DE HORA PASADA: ${hora}:${minuto}:${segundo}`);
    } else {
      console.log(`🔧 CIERRE FORZADO - IGNORANDO RESTRICCIONES DE HORA`);
    }

    console.log(`=== INICIANDO CIERRE DEL DÍA: ${fechaCierre} ===`);
    
    // 1. Archivar pedidos del día (usar la fecha del último cierre)
    const hoy = new Date().toISOString().split('T')[0];
    const pedidosArchivados = await archivarPedidosDelDia(fechaCierre);
    
    // 2. Resetear contadores
    await resetearContadores();
    
    // 3. Marcar cierre completado con la fecha actual
    await marcarCierreCompletado(hoy);
    
    console.log(`=== CIERRE COMPLETADO ===`);
    console.log(`- Pedidos archivados: ${pedidosArchivados}`);
    console.log(`- Contadores reseteados`);
    console.log(`- Fecha de cierre: ${fechaCierre}`);
    console.log(`- Fecha actual: ${hoy}`);
    console.log(`- Pedidos archivados con fecha: ${fechaCierre}`);
    console.log(`- NOTA: Novedades e inhabilitaciones se mantienen hasta que el operador las quite manualmente`);
    
    return {
      pedidosArchivados,
      fechaCierre: fechaCierre
    };
  } catch (error) {
    console.error('Error ejecutando cierre del día:', error);
    throw error;
  }
};

// Función para obtener pedidos archivados por fecha
export const getPedidosArchivados = async (fecha) => {
  try {
    const docRef = doc(db, 'pedidos_archivados', fecha);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo pedidos archivados:', error);
    throw error;
  }
};

// Función para obtener lista de fechas con pedidos archivados
export const getFechasArchivadas = async () => {
  try {
    const archivosRef = collection(db, 'pedidos_archivados');
    const querySnapshot = await getDocs(archivosRef);
    
    const fechas = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      fechas.push({
        fecha: doc.id,
        totalPedidos: data.totalPedidos || 0,
        fechaArchivado: data.fechaArchivado
      });
    });
    
    // Ordenar por fecha descendente
    fechas.sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    return fechas;
  } catch (error) {
    console.error('Error obteniendo fechas archivadas:', error);
    throw error;
  }
};

// Función de debug para verificar el estado actual
export const debugEstadoPedidos = async () => {
  try {
    console.log('=== DEBUG: ESTADO ACTUAL DE PEDIDOS ===');
    
    // Verificar pedidos activos
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    console.log(`Pedidos activos en colección 'pedidos': ${querySnapshot.size}`);
    
    querySnapshot.forEach((doc) => {
      const pedido = doc.data();
      const isBaseOrder = !pedido.hora; // Salida de base si no tiene hora
      console.log(`- Pedido activo: ${doc.id}`, {
        cliente: pedido.cliente,
        hora: pedido.hora || 'SIN HORA (SALIDA DE BASE)',
        domicilio: pedido.domicilio,
        unidad: pedido.unidad,
        horaAsignacion: pedido.horaAsignacion,
        esSalidaBase: isBaseOrder,
        createdAt: pedido.createdAt
      });
    });
    
    // Verificar archivos
    const archivosRef = collection(db, 'pedidos_archivados');
    const archivosSnapshot = await getDocs(archivosRef);
    console.log(`Archivos en 'pedidos_archivados': ${archivosSnapshot.size}`);
    
    archivosSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- Archivo: ${doc.id} (${data.totalPedidos} pedidos)`, {
        fecha: data.fecha,
        fechaArchivado: data.fechaArchivado
      });
      
      // Mostrar detalles de pedidos archivados
      if (data.pedidos && data.pedidos.length > 0) {
        console.log(`  Detalles de pedidos archivados en ${doc.id}:`);
        data.pedidos.forEach((pedido, index) => {
          const isBaseOrder = !pedido.hora;
          console.log(`    ${index + 1}. ${pedido.cliente} - ${pedido.hora || 'SALIDA DE BASE'} - Unidad: ${pedido.unidad || 'Sin asignar'}`);
        });
      }
    });
    
    // Verificar estado de cierre
    const estado = await verificarCierreDelDia();
    console.log('Estado de cierre:', estado);
    
    return {
      pedidosActivos: querySnapshot.size,
      archivos: archivosSnapshot.size,
      estadoCierre: estado
    };
  } catch (error) {
    console.error('Error en debug:', error);
    throw error;
  }
};

// Función para limpiar pedidos huérfanos (pedidos que quedaron después del cierre)
export const limpiarPedidosHuerfanos = async () => {
  try {
    console.log('=== LIMPIANDO PEDIDOS HUÉRFANOS ===');
    
    // Obtener todos los pedidos actuales
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    
    console.log(`Pedidos huérfanos encontrados: ${querySnapshot.size}`);
    
    if (querySnapshot.size === 0) {
      console.log('No hay pedidos huérfanos para limpiar');
      return { pedidosLimpiados: 0 };
    }
    
    const pedidosHuerfanos = [];
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      const isBaseOrder = !pedido.hora;
      pedidosHuerfanos.push(pedido);
      console.log(`Limpiando pedido huérfano: ${doc.id} (${isBaseOrder ? 'SALIDA DE BASE' : 'PEDIDO NORMAL'})`, {
        cliente: pedido.cliente,
        hora: pedido.hora || 'SIN HORA',
        domicilio: pedido.domicilio,
        unidad: pedido.unidad
      });
      batch.delete(doc.ref);
    });
    
    // Usar fecha de ayer para el archivo
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];
    
    console.log(`Intentando archivar en fecha: ${fechaAyer}`);
    
    // Verificar si ya existe un archivo para ayer
    const archivoRef = doc(db, 'pedidos_archivados', fechaAyer);
    const archivoSnap = await getDoc(archivoRef);
    
    if (archivoSnap.exists()) {
      // Si ya existe, agregar los pedidos huérfanos al archivo existente
      const archivoExistente = archivoSnap.data();
      const pedidosCombinados = [...archivoExistente.pedidos, ...pedidosHuerfanos];
      
      batch.update(archivoRef, {
        pedidos: pedidosCombinados,
        totalPedidos: pedidosCombinados.length,
        fechaArchivado: serverTimestamp(),
        pedidosHuerfanosAgregados: pedidosHuerfanos.length,
        ultimaLimpiezaHuerfanos: serverTimestamp()
      });
      
      console.log(`✅ ${pedidosHuerfanos.length} pedidos huérfanos agregados al archivo existente de ${fechaAyer}`);
    } else {
      // Si no existe, crear nuevo archivo
      batch.set(archivoRef, {
        fecha: fechaAyer,
        pedidos: pedidosHuerfanos,
        totalPedidos: pedidosHuerfanos.length,
        fechaArchivado: serverTimestamp(),
        esLimpiezaHuerfanos: true,
        ultimaLimpiezaHuerfanos: serverTimestamp()
      });
      
      console.log(`✅ ${pedidosHuerfanos.length} pedidos huérfanos archivados en nuevo archivo de ${fechaAyer}`);
    }
    
    console.log('Ejecutando batch de operaciones...');
    await batch.commit();
    console.log('✅ Batch ejecutado exitosamente');
    
    return {
      pedidosLimpiados: pedidosHuerfanos.length,
      fechaArchivo: fechaAyer
    };
  } catch (error) {
    console.error('❌ Error limpiando pedidos huérfanos:', error);
    throw error;
  }
};

// Función para forzar cierre (manual)
export const forzarCierreDelDia = async () => {
  try {
    console.log('=== FORZANDO CIERRE DEL DÍA ===');
    const ahora = new Date();
    const hora = ahora.getHours();
    const minuto = ahora.getMinutes();
    const segundo = ahora.getSeconds();
    console.log(`Hora actual: ${hora}:${minuto}:${segundo}`);
    
    // Obtener todos los pedidos actuales
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    
    console.log(`Pedidos encontrados para forzar cierre: ${querySnapshot.size}`);
    
    const pedidosDelDia = [];
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      pedidosDelDia.push(pedido);
      console.log(`Forzando eliminación de pedido: ${doc.id}`);
      batch.delete(doc.ref);
    });
    
    if (pedidosDelDia.length > 0) {
      // Usar fecha de HOY para el archivo
      const hoy = new Date().toISOString().split('T')[0];

      // Archivar primero
      const archivoRef = doc(db, 'pedidos_archivados', hoy);
      await setDoc(archivoRef, {
        fecha: hoy,
        pedidos: pedidosDelDia,
        totalPedidos: pedidosDelDia.length,
        fechaArchivado: serverTimestamp(),
        esCierreForzado: true
      });

      console.log(`✅ ${pedidosDelDia.length} pedidos archivados forzadamente en ${hoy}`);

      // Eliminar en lotes
      const batchSize = 499;
      for (let i = 0; i < pedidosDelDia.length; i += batchSize) {
        const batch = writeBatch(db);
        const end = Math.min(i + batchSize, pedidosDelDia.length);

        for (let j = i; j < end; j++) {
          const pedidoRef = doc(db, 'pedidos', pedidosDelDia[j].id);
          batch.delete(pedidoRef);
        }

        await batch.commit();
        console.log(`✅ Eliminados ${end - i} pedidos forzadamente`);
      }
    }
    
    // Resetear contadores
    await resetearContadores();
    
    // Marcar cierre completado
    const hoy = new Date().toISOString().split('T')[0];
    await marcarCierreCompletado(hoy);
    
    return {
      pedidosArchivados: pedidosDelDia.length,
      fechaArchivo: hoy
    };
  } catch (error) {
    console.error('Error forzando cierre:', error);
    throw error;
  }
};

// Función de emergencia para limpiar TODOS los pedidos actuales
export const limpiarTodosLosPedidos = async () => {
  try {
    console.log('=== LIMPIEZA DE EMERGENCIA - TODOS LOS PEDIDOS ===');
    
    // Obtener todos los pedidos actuales
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    
    console.log(`Pedidos encontrados para limpieza de emergencia: ${querySnapshot.size}`);
    
    if (querySnapshot.size === 0) {
      console.log('No hay pedidos para limpiar');
      return { pedidosLimpiados: 0 };
    }

    const pedidosParaLimpiar = [];
    querySnapshot.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      const isBaseOrder = !pedido.hora;
      pedidosParaLimpiar.push(pedido);
      console.log(`Limpiando pedido: ${doc.id} (${isBaseOrder ? 'SALIDA DE BASE' : 'PEDIDO NORMAL'})`, {
        cliente: pedido.cliente,
        hora: pedido.hora || 'SIN HORA',
        domicilio: pedido.domicilio,
        unidad: pedido.unidad
      });
    });

    // Usar fecha de HOY para el archivo
    const hoy = new Date().toISOString().split('T')[0];

    console.log(`Archivando en fecha: ${hoy}`);

    // Verificar si ya existe un archivo para hoy
    const archivoRef = doc(db, 'pedidos_archivados', hoy);
    const archivoSnap = await getDoc(archivoRef);

    if (archivoSnap.exists()) {
      // Si ya existe, agregar los pedidos al archivo existente
      const archivoExistente = archivoSnap.data();
      const pedidosCombinados = [...archivoExistente.pedidos, ...pedidosParaLimpiar];

      await updateDoc(archivoRef, {
        pedidos: pedidosCombinados,
        totalPedidos: pedidosCombinados.length,
        fechaArchivado: serverTimestamp(),
        limpiezaEmergencia: true,
        pedidosLimpiezaEmergencia: pedidosParaLimpiar.length
      });

      console.log(`✅ ${pedidosParaLimpiar.length} pedidos agregados al archivo existente de ${hoy}`);
    } else {
      // Si no existe, crear nuevo archivo
      await setDoc(archivoRef, {
        fecha: hoy,
        pedidos: pedidosParaLimpiar,
        totalPedidos: pedidosParaLimpiar.length,
        fechaArchivado: serverTimestamp(),
        limpiezaEmergencia: true
      });

      console.log(`✅ ${pedidosParaLimpiar.length} pedidos archivados en nuevo archivo de ${hoy}`);
    }

    // Eliminar en lotes
    const batchSize = 499;
    for (let i = 0; i < pedidosParaLimpiar.length; i += batchSize) {
      const batch = writeBatch(db);
      const end = Math.min(i + batchSize, pedidosParaLimpiar.length);

      for (let j = i; j < end; j++) {
        const pedidoRef = doc(db, 'pedidos', pedidosParaLimpiar[j].id);
        batch.delete(pedidoRef);
      }

      console.log(`Ejecutando batch de eliminación ${Math.floor(i / batchSize) + 1}...`);
      await batch.commit();
      console.log(`✅ Eliminados ${end - i} pedidos`);
    }

    console.log('✅ Limpieza completada exitosamente');
    
    return {
      pedidosLimpiados: pedidosParaLimpiar.length,
      fechaArchivo: hoy
    };
  } catch (error) {
    console.error('❌ Error en limpieza de emergencia:', error);
    throw error;
  }
};
