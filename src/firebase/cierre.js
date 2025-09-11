import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  writeBatch,
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
      // Crear documento de archivo para la fecha
      const archivoRef = doc(db, 'pedidos_archivados', fecha);
      console.log(`Creando archivo en: pedidos_archivados/${fecha}`);
      
      batch.set(archivoRef, {
        fecha,
        pedidos: pedidosDelDia,
        totalPedidos: pedidosDelDia.length,
        fechaArchivado: serverTimestamp()
      });
      
      console.log('Ejecutando batch de operaciones...');
      // Ejecutar todas las operaciones (eliminar pedidos + crear archivo)
      await batch.commit();
      
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
    
    const hoy = new Date().toISOString().split('T')[0];
    const contadoresRef = doc(db, 'contadores', 'diarios');
    const docSnap = await getDoc(contadoresRef);
    
    let contadores = {};
    if (docSnap.exists()) {
      contadores = docSnap.data();
    }
    
    // Inicializar contadores del día actual en cero
    contadores[hoy] = {};
    
    await setDoc(contadoresRef, contadores);
    console.log('Contadores reseteados exitosamente');
    
    return true;
  } catch (error) {
    console.error('Error reseteando contadores:', error);
    throw error;
  }
};

// Función para limpiar novedades según configuración
export const limpiarNovedadesSegunConfig = async () => {
  try {
    console.log('Limpiando novedades según configuración');
    
    // Obtener configuración de novedades
    const configRef = doc(db, 'config', 'novedades');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.log('No hay configuración de novedades');
      return;
    }
    
    const config = configSnap.data();
    const novedadesConfig = config.novedades || [];
    
    // Obtener todas las novedades de taxis
    const novedadesRef = collection(db, 'taxi_novedades');
    const querySnapshot = await getDocs(novedadesRef);
    
    const batch = writeBatch(db);
    let taxisActualizados = 0;
    
    querySnapshot.forEach((doc) => {
      const taxiData = doc.data();
      const novedadesActuales = taxiData.novedades || [];
      
      // Filtrar novedades que NO se deben heredar
      const novedadesHeredadas = novedadesActuales.filter(novedad => {
        const configNovedad = novedadesConfig.find(n => n.codigo === novedad.codigo);
        return configNovedad && configNovedad.heredarAlCierre !== false;
      });
      
      // Solo actualizar si hay cambios
      if (novedadesHeredadas.length !== novedadesActuales.length) {
        batch.update(doc.ref, { 
          novedades: novedadesHeredadas,
          ultimaActualizacion: serverTimestamp()
        });
        taxisActualizados++;
      }
    });
    
    if (taxisActualizados > 0) {
      await batch.commit();
      console.log(`${taxisActualizados} taxis actualizados con novedades heredadas`);
    } else {
      console.log('No hay novedades que limpiar');
    }
    
    return taxisActualizados;
  } catch (error) {
    console.error('Error limpiando novedades:', error);
    throw error;
  }
};

// Función principal de cierre del día
export const ejecutarCierreDelDia = async (fechaCierre) => {
  try {
    console.log(`=== INICIANDO CIERRE DEL DÍA: ${fechaCierre} ===`);
    
    // 1. Archivar pedidos del día
    const pedidosArchivados = await archivarPedidosDelDia(fechaCierre);
    
    // 2. Resetear contadores
    await resetearContadores();
    
    // 3. Limpiar novedades según configuración
    const taxisActualizados = await limpiarNovedadesSegunConfig();
    
    // 4. Marcar cierre completado con la fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    await marcarCierreCompletado(hoy);
    
    console.log(`=== CIERRE COMPLETADO ===`);
    console.log(`- Pedidos archivados: ${pedidosArchivados}`);
    console.log(`- Taxis con novedades actualizadas: ${taxisActualizados}`);
    console.log(`- Contadores reseteados`);
    console.log(`- Fecha de cierre: ${fechaCierre}`);
    console.log(`- Fecha actual: ${hoy}`);
    
    return {
      pedidosArchivados,
      taxisActualizados,
      fechaCierre: hoy
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

// Función para forzar cierre (solo para testing)
export const forzarCierreDelDia = async () => {
  try {
    console.log('=== FORZANDO CIERRE DEL DÍA ===');
    
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
      // Usar fecha de ayer para el archivo
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];
      
      const archivoRef = doc(db, 'pedidos_archivados', fechaAyer);
      batch.set(archivoRef, {
        fecha: fechaAyer,
        pedidos: pedidosDelDia,
        totalPedidos: pedidosDelDia.length,
        fechaArchivado: serverTimestamp()
      });
      
      await batch.commit();
      console.log(`✅ ${pedidosDelDia.length} pedidos archivados forzadamente en ${fechaAyer}`);
    }
    
    // Resetear contadores
    await resetearContadores();
    
    // Limpiar novedades
    await limpiarNovedadesSegunConfig();
    
    // Marcar cierre completado
    const hoy = new Date().toISOString().split('T')[0];
    await marcarCierreCompletado(hoy);
    
    return {
      pedidosArchivados: pedidosDelDia.length,
      fechaArchivo: ayer.toISOString().split('T')[0]
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
    const batch = writeBatch(db);
    
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
      batch.delete(doc.ref);
    });
    
    // Usar fecha de ayer para el archivo
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];
    
    console.log(`Archivando en fecha: ${fechaAyer}`);
    
    // Verificar si ya existe un archivo para ayer
    const archivoRef = doc(db, 'pedidos_archivados', fechaAyer);
    const archivoSnap = await getDoc(archivoRef);
    
    if (archivoSnap.exists()) {
      // Si ya existe, agregar los pedidos al archivo existente
      const archivoExistente = archivoSnap.data();
      const pedidosCombinados = [...archivoExistente.pedidos, ...pedidosParaLimpiar];
      
      batch.update(archivoRef, {
        pedidos: pedidosCombinados,
        totalPedidos: pedidosCombinados.length,
        fechaArchivado: serverTimestamp(),
        limpiezaEmergencia: true,
        pedidosLimpiezaEmergencia: pedidosParaLimpiar.length
      });
      
      console.log(`✅ ${pedidosParaLimpiar.length} pedidos agregados al archivo existente de ${fechaAyer}`);
    } else {
      // Si no existe, crear nuevo archivo
      batch.set(archivoRef, {
        fecha: fechaAyer,
        pedidos: pedidosParaLimpiar,
        totalPedidos: pedidosParaLimpiar.length,
        fechaArchivado: serverTimestamp(),
        limpiezaEmergencia: true
      });
      
      console.log(`✅ ${pedidosParaLimpiar.length} pedidos archivados en nuevo archivo de ${fechaAyer}`);
    }
    
    console.log('Ejecutando batch de operaciones...');
    await batch.commit();
    console.log('✅ Batch ejecutado exitosamente');
    
    return {
      pedidosLimpiados: pedidosParaLimpiar.length,
      fechaArchivo: fechaAyer
    };
  } catch (error) {
    console.error('❌ Error en limpieza de emergencia:', error);
    throw error;
  }
};
