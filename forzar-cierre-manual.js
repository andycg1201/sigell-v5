#!/usr/bin/env node

/**
 * Script para forzar cierre manual (ignora si ya se cerró hoy)
 * Útil para pruebas
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

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

async function forzarCierre() {
  console.log('🔧 FORZANDO CIERRE MANUAL');
  console.log('Conectando a Firebase...');

  try {
    const hoy = new Date().toISOString().split('T')[0];
    console.log(`Fecha de cierre: ${hoy}`);

    // Obtener pedidos
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    const pedidos = [];

    querySnapshot.forEach((doc) => {
      pedidos.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Pedidos encontrados: ${pedidos.length}`);

    if (pedidos.length > 0) {
      // Archivar pedidos
      await setDoc(doc(db, 'pedidos_archivados', hoy), {
        fecha: hoy,
        pedidos: pedidos,
        totalPedidos: pedidos.length,
        fechaArchivado: serverTimestamp(),
        archivadoPor: 'forzar_manual'
      });

      console.log(`✅ ${pedidos.length} pedidos archivados`);

      // Eliminar pedidos
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
    }

    // Resetear contadores
    const contadoresRef = doc(db, 'contadores', 'diarios');
    await setDoc(contadoresRef, {
      [hoy]: {},
      [new Date(Date.now() + 86400000).toISOString().split('T')[0]]: {}
    });

    console.log('✅ Contadores reseteados');

    // Marcar cierre completado
    const cierreRef = doc(db, 'sistema_control', 'cierre_diario');
    await setDoc(cierreRef, {
      ultimoCierre: hoy,
      ultimaActualizacion: serverTimestamp()
    });

    console.log(`✅ Cierre forzado completado para ${hoy}`);

  } catch (error) {
    console.error('❌ Error en cierre forzado:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  forzarCierre()
    .then(() => {
      console.log('✅ Cierre forzado completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cierre forzado falló:', error);
      process.exit(1);
    });
}