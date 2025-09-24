const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Función programada para cierre diario a medianoche Ecuador (05:00 UTC)
exports.cierreDiario = functions.pubsub
  .schedule('0 5 * * *') // Todos los días a las 05:00 UTC (medianoche Ecuador)
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('=== INICIANDO CIERRE DIARIO AUTOMÁTICO ===');

    try {
      const db = admin.firestore();

      // Obtener fecha actual
      const hoy = new Date().toISOString().split('T')[0];
      console.log(`Fecha de cierre: ${hoy}`);

      // Verificar último cierre
      const cierreDoc = await db.collection('sistema_control').doc('cierre_diario').get();
      let ultimoCierre = '2023-01-01'; // Fecha antigua por defecto

      if (cierreDoc.exists) {
        ultimoCierre = cierreDoc.data().ultimoCierre || ultimoCierre;
      }

      console.log(`Último cierre: ${ultimoCierre}`);

      // Si ya se cerró hoy, salir
      if (ultimoCierre === hoy) {
        console.log('Cierre ya ejecutado hoy, saliendo...');
        return null;
      }

      // Obtener todos los pedidos
      const pedidosSnapshot = await db.collection('pedidos').get();
      const pedidos = [];

      pedidosSnapshot.forEach(doc => {
        pedidos.push({ id: doc.id, ...doc.data() });
      });

      console.log(`Pedidos encontrados: ${pedidos.length}`);

      if (pedidos.length > 0) {
        // Archivar pedidos
        await db.collection('pedidos_archivados').doc(ultimoCierre).set({
          fecha: ultimoCierre,
          pedidos: pedidos,
          totalPedidos: pedidos.length,
          fechaArchivado: admin.firestore.FieldValue.serverTimestamp(),
          archivadoPor: 'funcion_programada'
        });

        console.log(`✅ ${pedidos.length} pedidos archivados bajo fecha ${ultimoCierre}`);

        // Eliminar pedidos en lotes
        const batchSize = 499;
        for (let i = 0; i < pedidos.length; i += batchSize) {
          const batch = db.batch();
          const end = Math.min(i + batchSize, pedidos.length);

          for (let j = i; j < end; j++) {
            const pedidoRef = db.collection('pedidos').doc(pedidos[j].id);
            batch.delete(pedidoRef);
          }

          await batch.commit();
          console.log(`✅ Eliminados ${end - i} pedidos`);
        }
      }

      // Resetear contadores
      const contadoresRef = db.collection('contadores').doc('diarios');
      await contadoresRef.set({
        [hoy]: {},
        [new Date(Date.now() + 86400000).toISOString().split('T')[0]]: {}
      });

      console.log('✅ Contadores reseteados');

      // Marcar cierre completado
      await db.collection('sistema_control').doc('cierre_diario').set({
        ultimoCierre: hoy,
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Cierre completado para ${hoy}`);

      return {
        pedidosArchivados: pedidos.length,
        fechaCierre: hoy
      };

    } catch (error) {
      console.error('❌ Error en cierre diario:', error);
      throw error;
    }
  });