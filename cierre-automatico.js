#!/usr/bin/env node

/**
 * Script de cierre automático para Taxi-Control
 * Se ejecuta diariamente a medianoche Ecuador (05:00 UTC)
 * Compatible con Programador de Tareas de Windows
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

// Configuración de Firebase (copia de src/firebase/config.js)
const firebaseConfig = {
  apiKey: "AIzaSyAELzaD3EmD1WjL_rLMg2xeliTmGZQPrDw",
  authDomain: "sigell-version-5.firebaseapp.com",
  projectId: "sigell-version-5",
  storageBucket: "sigell-version-5.appspot.com",
  messagingSenderId: "341553251961",
  appId: "1:341553251961:web:1234567890abcdef"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function archivarPedidos(fecha) {
  console.log(`=== ARCHIVANDO PEDIDOS DEL ${fecha} ===`);

  try {
    // Obtener todos los pedidos
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);

    console.log(`Pedidos encontrados: ${querySnapshot.size}`);

    if (querySnapshot.size === 0) {
      console.log('No hay pedidos para archivar');
      return 0;
    }

    const pedidos = [];
    querySnapshot.forEach((doc) => {
      pedidos.push({ id: doc.id, ...doc.data() });
    });

    // Archivar pedidos
    await setDoc(doc(db, 'pedidos_archivados', fecha), {
      fecha,
      pedidos: pedidos,
      totalPedidos: pedidos.length,
      fechaArchivado: serverTimestamp(),
      archivadoPor: 'script_automatico'
    });

    console.log(`✅ ${pedidos.length} pedidos archivados`);

    // Eliminar pedidos en lotes
    const batchSize = 499;
    for (let i = 0; i < pedidos.length; i += batchSize) {
      const batch = writeBatch(db);
      const end = Math.min(i + batchSize, pedidos.length);

      for (let j = i; j < end; j++) {
        const pedidoRef = doc(db, 'pedidos', pedidos[j].id);
        batch.delete(pedidoRef);
      }

      await batch.commit();
      console.log(`✅ Eliminados ${end - i} pedidos`);
    }

    return pedidos.length;
  } catch (error) {
    console.error('❌ Error archivando pedidos:', error);
    throw error;
  }
}

async function resetearContadores() {
  console.log('=== RESETEANDO CONTADORES ===');

  try {
    const hoy = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const contadoresRef = doc(db, 'contadores', 'diarios');
    await setDoc(contadoresRef, {
      [hoy]: {},
      [manana]: {}
    });

    console.log('✅ Contadores reseteados');
  } catch (error) {
    console.error('❌ Error reseteando contadores:', error);
    throw error;
  }
}

async function marcarCierreCompletado(fecha) {
  console.log(`=== MARCANDO CIERRE COMPLETADO: ${fecha} ===`);

  try {
    const cierreRef = doc(db, 'sistema_control', 'cierre_diario');
    await setDoc(cierreRef, {
      ultimoCierre: fecha,
      ultimaActualizacion: serverTimestamp()
    });

    console.log('✅ Cierre marcado como completado');
  } catch (error) {
    console.error('❌ Error marcando cierre:', error);
    throw error;
  }
}

async function verificarCierreNecesario() {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Verificar último cierre
    const cierreDoc = await getDocs(collection(db, 'sistema_control'));
    let ultimoCierre = '2023-01-01';

    cierreDoc.forEach((doc) => {
      if (doc.id === 'cierre_diario') {
        ultimoCierre = doc.data().ultimoCierre || ultimoCierre;
      }
    });

    console.log(`Último cierre: ${ultimoCierre}`);
    console.log(`Fecha hoy: ${hoy}`);

    return ultimoCierre !== hoy;
  } catch (error) {
    console.error('❌ Error verificando cierre:', error);
    return true; // Si hay error, asumir que necesita cierre
  }
}

async function ejecutarCierreDiario() {
  console.log('🚀 INICIANDO CIERRE DIARIO AUTOMÁTICO');

  try {
    // Verificar si necesita cierre
    const necesitaCierre = await verificarCierreNecesario();
    console.log('¿Necesita cierre?', necesitaCierre);

    if (!necesitaCierre) {
      console.log('✅ Cierre ya ejecutado hoy, saliendo...');
      console.log('Para forzar un nuevo cierre, elimina el registro de cierre en Firebase');
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];
    console.log(`Fecha de cierre: ${hoy}`);

    // 1. Archivar pedidos
    const pedidosArchivados = await archivarPedidos(hoy);

    // 2. Resetear contadores
    await resetearContadores();

    // 3. Marcar cierre completado
    await marcarCierreCompletado(hoy);

    console.log('🎉 CIERRE DIARIO COMPLETADO EXITOSAMENTE');
    console.log(`📊 Pedidos archivados: ${pedidosArchivados}`);
    console.log(`📅 Fecha: ${hoy}`);

  } catch (error) {
    console.error('💥 ERROR EN CIERRE DIARIO:', error);
    process.exit(1);
  }
}

// Ejecutar cierre si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarCierreDiario()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}

export { ejecutarCierreDiario, archivarPedidos, resetearContadores, marcarCierreCompletado };