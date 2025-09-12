import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  deleteDoc,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

const LimpiezaModal = ({ isOpen, onClose }) => {
  const [selecciones, setSelecciones] = useState({
    clientes: false,
    pedidos: false,
    contadores: false,
    archivos: false,
    taxis: false,
    bases: false,
    novedades: false,
    motivos: false,
    sistema: false,
    corregirFecha: false,
    todo: false
  });
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSeleccionChange = (campo) => {
    if (campo === 'todo') {
      setSelecciones({
        clientes: true,
        pedidos: true,
        contadores: true,
        archivos: true,
        taxis: true,
        bases: true,
        novedades: true,
        motivos: true,
        sistema: true,
        todo: true
      });
    } else {
      setSelecciones(prev => ({
        ...prev,
        [campo]: !prev[campo],
        todo: false
      }));
    }
  };

  const limpiarClientes = async () => {
    console.log('🗑️ Limpiando clientes...');
    const clientesRef = collection(db, 'clientes');
    const querySnapshot = await getDocs(clientesRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarPedidos = async () => {
    console.log('🗑️ Limpiando pedidos activos...');
    const pedidosRef = collection(db, 'pedidos');
    const querySnapshot = await getDocs(pedidosRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarContadores = async () => {
    console.log('🗑️ Limpiando contadores...');
    const contadoresRef = doc(db, 'contadores', 'diarios');
    await deleteDoc(contadoresRef);
    return 1;
  };

  const limpiarArchivos = async () => {
    console.log('🗑️ Limpiando archivos de pedidos...');
    const archivosRef = collection(db, 'pedidos_archivados');
    const querySnapshot = await getDocs(archivosRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarTaxis = async () => {
    console.log('🗑️ Limpiando configuración de taxis...');
    const taxisRef = collection(db, 'taxis');
    const querySnapshot = await getDocs(taxisRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarBases = async () => {
    console.log('🗑️ Limpiando configuración de bases...');
    const basesRef = collection(db, 'bases');
    const querySnapshot = await getDocs(basesRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarNovedades = async () => {
    console.log('🗑️ Limpiando configuración de novedades...');
    const configRef = doc(db, 'config', 'novedades');
    await deleteDoc(configRef);
    return 1;
  };

  const limpiarMotivos = async () => {
    console.log('🗑️ Limpiando motivos de inhabilitación...');
    const motivosRef = collection(db, 'inhabilitaciones');
    const querySnapshot = await getDocs(motivosRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return querySnapshot.size;
  };

  const limpiarSistema = async () => {
    console.log('🗑️ Limpiando configuración del sistema...');
    const sistemaRef = doc(db, 'sistema_control', 'cierre_diario');
    await deleteDoc(sistemaRef);
    return 1;
  };

  const corregirFechaSistema = async () => {
    console.log('🔧 Corrigiendo fecha del sistema...');
    const hoy = new Date();
    const fechaCorrecta = hoy.toISOString().split('T')[0];
    
    const sistemaRef = doc(db, 'sistema_control', 'cierre_diario');
    await setDoc(sistemaRef, {
      ultimoCierre: fechaCorrecta,
      ultimaActualizacion: new Date().toISOString()
    }, { merge: true });
    
    console.log(`✅ Fecha del sistema corregida a: ${fechaCorrecta}`);
    return fechaCorrecta;
  };

  const ejecutarLimpieza = async () => {
    if (!Object.values(selecciones).some(Boolean)) {
      alert('⚠️ Selecciona al menos una opción para limpiar');
      return;
    }

    const confirmacion = window.confirm(
      `⚠️ ¿Estás seguro de que quieres limpiar?\n\n` +
      `Selecciones:\n` +
      `${selecciones.clientes ? '• Clientes\n' : ''}` +
      `${selecciones.pedidos ? '• Pedidos activos\n' : ''}` +
      `${selecciones.contadores ? '• Contadores\n' : ''}` +
      `${selecciones.archivos ? '• Archivos de pedidos\n' : ''}` +
      `${selecciones.taxis ? '• Configuración de taxis\n' : ''}` +
      `${selecciones.bases ? '• Configuración de bases\n' : ''}` +
      `${selecciones.novedades ? '• Configuración de novedades\n' : ''}` +
      `${selecciones.motivos ? '• Motivos de inhabilitación\n' : ''}` +
      `${selecciones.sistema ? '• Configuración del sistema\n' : ''}` +
      `\nEsta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    setProcesando(true);
    setResultado(null);

    try {
      const resultados = {};

      if (selecciones.clientes) {
        resultados.clientes = await limpiarClientes();
      }

      if (selecciones.pedidos) {
        resultados.pedidos = await limpiarPedidos();
      }

      if (selecciones.contadores) {
        resultados.contadores = await limpiarContadores();
      }

      if (selecciones.archivos) {
        resultados.archivos = await limpiarArchivos();
      }

      if (selecciones.taxis) {
        resultados.taxis = await limpiarTaxis();
      }

      if (selecciones.bases) {
        resultados.bases = await limpiarBases();
      }

      if (selecciones.novedades) {
        resultados.novedades = await limpiarNovedades();
      }

      if (selecciones.motivos) {
        resultados.motivos = await limpiarMotivos();
      }

      if (selecciones.sistema) {
        resultados.sistema = await limpiarSistema();
      }

      if (selecciones.corregirFecha) {
        resultados.fechaCorregida = await corregirFechaSistema();
      }

      setResultado(resultados);
      console.log('✅ Limpieza completada:', resultados);

    } catch (error) {
      console.error('❌ Error en limpieza:', error);
      alert(`❌ Error durante la limpieza: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const resetearSelecciones = () => {
    setSelecciones({
      clientes: false,
      pedidos: false,
      contadores: false,
      archivos: false,
      taxis: false,
      bases: false,
      novedades: false,
      motivos: false,
      sistema: false,
      corregirFecha: false,
      todo: false
    });
    setResultado(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content limpieza-modal">
        <div className="modal-header">
          <h2>🧹 Limpieza Temporal del Sistema</h2>
          <button className="btn-cerrar" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="warning-box">
            <h3>⚠️ ADVERTENCIA</h3>
            <p>Esta herramienta es para limpieza temporal y testing. Los datos eliminados NO se pueden recuperar.</p>
          </div>

          <div className="selecciones-container">
            <h3>Selecciona qué limpiar:</h3>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.todo}
                onChange={() => handleSeleccionChange('todo')}
              />
              <span className="checkbox-text">🗑️ TODO (Limpieza completa del sistema)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.clientes}
                onChange={() => handleSeleccionChange('clientes')}
              />
              <span className="checkbox-text">👥 Clientes</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.pedidos}
                onChange={() => handleSeleccionChange('pedidos')}
              />
              <span className="checkbox-text">📋 Pedidos activos</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.contadores}
                onChange={() => handleSeleccionChange('contadores')}
              />
              <span className="checkbox-text">🔢 Contadores</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.archivos}
                onChange={() => handleSeleccionChange('archivos')}
              />
              <span className="checkbox-text">📁 Archivos de pedidos</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.taxis}
                onChange={() => handleSeleccionChange('taxis')}
              />
              <span className="checkbox-text">🚗 Configuración de taxis</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.bases}
                onChange={() => handleSeleccionChange('bases')}
              />
              <span className="checkbox-text">🏢 Configuración de bases</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.novedades}
                onChange={() => handleSeleccionChange('novedades')}
              />
              <span className="checkbox-text">🚨 Configuración de novedades</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.motivos}
                onChange={() => handleSeleccionChange('motivos')}
              />
              <span className="checkbox-text">🚫 Motivos de inhabilitación</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selecciones.sistema}
                onChange={() => handleSeleccionChange('sistema')}
              />
              <span className="checkbox-text">⚙️ Configuración del sistema</span>
            </label>

            <label className="checkbox-label" style={{ border: '2px solid #ffc107', backgroundColor: '#fff3cd' }}>
              <input
                type="checkbox"
                checked={selecciones.corregirFecha}
                onChange={() => handleSeleccionChange('corregirFecha')}
              />
              <span className="checkbox-text">🔧 Corregir fecha del sistema (URGENTE)</span>
            </label>
          </div>

          {resultado && (
            <div className="resultado-box">
              <h3>✅ Limpieza Completada</h3>
              <div className="resultado-detalles">
                {resultado.clientes && <p>👥 Clientes eliminados: {resultado.clientes}</p>}
                {resultado.pedidos && <p>📋 Pedidos eliminados: {resultado.pedidos}</p>}
                {resultado.contadores && <p>🔢 Contadores eliminados: {resultado.contadores}</p>}
                {resultado.archivos && <p>📁 Archivos eliminados: {resultado.archivos}</p>}
                {resultado.taxis && <p>🚗 Taxis eliminados: {resultado.taxis}</p>}
                {resultado.bases && <p>🏢 Bases eliminadas: {resultado.bases}</p>}
                {resultado.novedades && <p>🚨 Configuración de novedades eliminada: {resultado.novedades}</p>}
                {resultado.motivos && <p>🚫 Motivos eliminados: {resultado.motivos}</p>}
                {resultado.sistema && <p>⚙️ Configuración del sistema eliminada: {resultado.sistema}</p>}
                {resultado.fechaCorregida && <p>🔧 Fecha del sistema corregida a: {resultado.fechaCorregida}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={resetearSelecciones}
            disabled={procesando}
          >
            🔄 Resetear
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={ejecutarLimpieza}
            disabled={procesando || !Object.values(selecciones).some(Boolean)}
          >
            {procesando ? '⏳ Procesando...' : '🗑️ Ejecutar Limpieza'}
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            disabled={procesando}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimpiezaModal;
