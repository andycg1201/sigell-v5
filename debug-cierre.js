#!/usr/bin/env node

/**
 * Script de debug para verificar estado del cierre
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAELzaD3EmD1WjL_rLMg2xeliTmGZQPrDw",
  authDomain: "sigell-version-5.firebaseapp.com",
  projectId: "sigell-version-5",
  storageBucket: "sigell-version-5.appspot.com",
  messagingSenderId: "341553251961",
  appId: "1:341553251961:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugEstado() {
  console.log('🔍 DEBUG: VERIFICANDO ESTADO ACTUAL');
  console.log('Conectando a Firebase...');

  try {
    console.log('Inicializando Firebase app...');
    console.log('Configuración:', {
      apiKey: "****",
      projectId: "sigell-version-5"
    });
    // Verificar pedidos activos
    const pedidosRef = collection(db, 'pedidos');
    const pedidosSnapshot = await getDocs(pedidosRef);
    console.log(`📋 Pedidos activos: ${pedidosSnapshot.size}`);

    pedidosSnapshot.forEach((doc) => {
      const pedido = doc.data();
      console.log(`  - ${doc.id}: ${pedido.cliente} - ${pedido.hora || 'SIN HORA'}`);
    });

    // Verificar estado de cierre
    const cierreDoc = await getDoc(doc(db, 'sistema_control', 'cierre_diario'));
    if (cierreDoc.exists) {
      const cierreData = cierreDoc.data();
      console.log(`📅 Último cierre: ${cierreData.ultimoCierre}`);
      console.log(`🕐 Última actualización: ${cierreData.ultimaActualizacion?.toDate()}`);
    } else {
      console.log('❌ No hay registro de cierre');
    }

    // Verificar contadores
    const contadoresDoc = await getDoc(doc(db, 'contadores', 'diarios'));
    if (contadoresDoc.exists) {
      const contadores = contadoresDoc.data();
      console.log('🔢 Contadores diarios:', contadores);
    } else {
      console.log('❌ No hay contadores');
    }

    // Verificar archivos recientes
    const archivosRef = collection(db, 'pedidos_archivados');
    const archivosSnapshot = await getDocs(archivosRef);
    console.log(`📁 Archivos de pedidos: ${archivosSnapshot.size}`);

    archivosSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.totalPedidos} pedidos`);
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  debugEstado()
    .then(() => {
      console.log('✅ Debug completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Debug falló:', error);
      process.exit(1);
    });
}