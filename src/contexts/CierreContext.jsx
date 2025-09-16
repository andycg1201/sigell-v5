import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  verificarCierreDelDia,
  ejecutarCierreDelDia,
  getPedidosArchivados,
  getFechasArchivadas,
  debugEstadoPedidos,
  limpiarPedidosHuerfanos,
  limpiarTodosLosPedidos
} from '../firebase/cierre';

const CierreContext = createContext();

export const useCierre = () => {
  const context = useContext(CierreContext);
  if (!context) {
    throw new Error('useCierre debe ser usado dentro de CierreProvider');
  }
  return context;
};

export const CierreProvider = ({ children }) => {
  const [estadoCierre, setEstadoCierre] = useState({
    necesitaCierre: false,
    ultimoCierre: null,
    fechaHoy: null,
    procesando: false
  });
  const [pedidosArchivados, setPedidosArchivados] = useState([]);
  const [fechasArchivadas, setFechasArchivadas] = useState([]);
  
  // Cache local para evitar consultas innecesarias
  const [cacheLocal, setCacheLocal] = useState({
    ultimaVerificacion: null,
    estadoCache: null,
    fechaCache: null
  });

  // Verificar estado del cierre con cache optimizado
  const verificarEstadoCierre = useCallback(async (forzarConsulta = false) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const ahora = Date.now();
      
      // Verificar cache local (válido por 30 minutos)
      if (!forzarConsulta && 
          cacheLocal.estadoCache && 
          cacheLocal.fechaCache === hoy &&
          cacheLocal.ultimaVerificacion &&
          (ahora - cacheLocal.ultimaVerificacion) < 1800000) { // 30 minutos
        
        console.log('Usando cache local para estado de cierre');
        setEstadoCierre(prev => ({
          ...prev,
          ...cacheLocal.estadoCache,
          procesando: false
        }));
        return cacheLocal.estadoCache;
      }
      
      // Consultar Firebase solo si es necesario
      console.log('Consultando Firebase para estado de cierre');
      const estado = await verificarCierreDelDia();
      
      // Verificar si estamos en la última media hora antes de medianoche
      const ahoraFecha = new Date();
      const hora = ahoraFecha.getHours();
      const minuto = ahoraFecha.getMinutes();
      const enUltimaMediaHora = (hora === 23 && minuto >= 30) || (hora === 0 && minuto <= 30);
      
      // Solo mostrar "necesita cierre" si realmente necesita cierre Y estamos en la última media hora
      const estadoConHora = {
        ...estado,
        necesitaCierre: estado.necesitaCierre && enUltimaMediaHora
      };
      
      // Actualizar cache local
      setCacheLocal({
        ultimaVerificacion: ahora,
        estadoCache: estadoConHora,
        fechaCache: hoy
      });
      
      setEstadoCierre(prev => ({
        ...prev,
        ...estadoConHora,
        procesando: false
      }));
      
      console.log('Estado del cierre verificado:', estadoConHora);
      return estadoConHora;
    } catch (error) {
      console.error('Error verificando estado del cierre:', error);
      setEstadoCierre(prev => ({
        ...prev,
        procesando: false
      }));
      throw error;
    }
  }, [cacheLocal]);

  // Ejecutar cierre manual
  const ejecutarCierreManual = useCallback(async () => {
    try {
      setEstadoCierre(prev => ({ ...prev, procesando: true }));
      
      const estado = await verificarCierreDelDia();
      if (!estado.necesitaCierre) {
        throw new Error('No se necesita cierre en este momento');
      }
      
      // Usar la fecha del último cierre para archivar los pedidos
      const resultado = await ejecutarCierreDelDia(estado.ultimoCierre);
      
      // Actualizar estado después del cierre
      await verificarEstadoCierre();
      
      console.log('Cierre manual ejecutado:', resultado);
      return resultado;
    } catch (error) {
      console.error('Error ejecutando cierre manual:', error);
      setEstadoCierre(prev => ({ ...prev, procesando: false }));
      throw error;
    }
  }, [verificarEstadoCierre]);

  // Verificar cierre automático optimizado
  const verificarCierreAutomatico = useCallback(async () => {
    try {
      // Verificar que estamos realmente en la ventana de medianoche (MÁS ESTRICTO)
      const ahora = new Date();
      const hora = ahora.getHours();
      const minuto = ahora.getMinutes();
      const segundo = ahora.getSeconds();
      
      // Solo ejecutar entre 00:00:00 y 00:00:30 (ventana de 30 segundos exacta)
      if (hora !== 0 || minuto !== 0 || segundo > 30) {
        console.log(`❌ NO EJECUTAR CIERRE: No estamos en ventana de medianoche exacta (${hora}:${minuto}:${segundo}), saltando cierre automático`);
        return null;
      }
      
      console.log(`✅ VENTANA DE MEDIANOCHE DETECTADA: ${hora}:${minuto}:${segundo} - Procediendo con verificación de cierre`);
      
      // Usar cache si está disponible, sino consultar Firebase
      const estado = await verificarEstadoCierre(true); // Forzar consulta para cierre automático
      
      if (estado.necesitaCierre) {
        console.log('=== EJECUTANDO CIERRE AUTOMÁTICO ===');
        console.log(`Hora actual: ${hora}:${minuto}`);
        console.log(`Último cierre: ${estado.ultimoCierre}`);
        console.log(`Fecha hoy: ${estado.fechaHoy}`);
        
        // Usar la fecha del último cierre para archivar los pedidos
        const resultado = await ejecutarCierreDelDia(estado.ultimoCierre);
        
        // Limpiar cache después del cierre
        setCacheLocal({
          ultimaVerificacion: null,
          estadoCache: null,
          fechaCache: null
        });
        
        // Actualizar estado
        setEstadoCierre(prev => ({
          ...prev,
          ...estado,
          procesando: false
        }));
        
        console.log('=== CIERRE AUTOMÁTICO COMPLETADO ===', resultado);
        return resultado;
      } else {
        console.log('No se necesita cierre automático en este momento');
      }
      
      return null;
    } catch (error) {
      console.error('Error en cierre automático:', error);
      throw error;
    }
  }, [verificarEstadoCierre]);

  // Obtener pedidos archivados por fecha
  const obtenerPedidosArchivados = useCallback(async (fecha) => {
    try {
      const pedidos = await getPedidosArchivados(fecha);
      setPedidosArchivados(pedidos ? pedidos.pedidos : []);
      return pedidos;
    } catch (error) {
      console.error('Error obteniendo pedidos archivados:', error);
      throw error;
    }
  }, []);

  // Obtener lista de fechas archivadas con cache
  const obtenerFechasArchivadas = useCallback(async (forzarConsulta = false) => {
    try {
      // Cache de fechas archivadas (válido por 1 hora)
      const ahora = Date.now();
      const cacheKey = 'fechasArchivadas';
      const cacheData = localStorage.getItem(cacheKey);
      
      if (!forzarConsulta && cacheData) {
        const { fechas, timestamp } = JSON.parse(cacheData);
        if ((ahora - timestamp) < 3600000) { // 1 hora
          console.log('Usando cache para fechas archivadas');
          setFechasArchivadas(fechas);
          return fechas;
        }
      }
      
      console.log('Consultando Firebase para fechas archivadas');
      const fechas = await getFechasArchivadas();
      
      // Guardar en cache local
      localStorage.setItem(cacheKey, JSON.stringify({
        fechas,
        timestamp: ahora
      }));
      
      setFechasArchivadas(fechas);
      return fechas;
    } catch (error) {
      console.error('Error obteniendo fechas archivadas:', error);
      throw error;
    }
  }, []);

  // Timer optimizado para verificar medianoche
  useEffect(() => {
    let cierreEjecutado = false; // Flag para evitar múltiples ejecuciones
    
    const checkMidnight = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      // Debug: Log cada 5 minutos para verificar que el timer funciona
      if (currentMinute % 5 === 0 && currentSecond < 30) {
        console.log(`Timer funcionando - Hora actual: ${currentHour}:${currentMinute}`);
      }
      
      // ALERTA: Log si estamos cerca de medianoche para detectar problemas
      if (currentHour === 23 && currentMinute >= 58) {
        console.log(`⚠️ ACERCÁNDOSE A MEDIANOCHE: ${currentHour}:${currentMinute}:${currentSecond}`);
      }
      if (currentHour === 0 && currentMinute <= 2) {
        console.log(`⚠️ DESPUÉS DE MEDIANOCHE: ${currentHour}:${currentMinute}:${currentSecond}`);
      }
      
      // Verificar si necesita cierre automático (solo en 00:00:00-00:00:30 para evitar múltiples ejecuciones)
      if (currentHour === 0 && currentMinute === 0 && currentSecond <= 30 && !cierreEjecutado) {
        console.log(`🔍 VERIFICANDO CIERRE AUTOMÁTICO: ${currentHour}:${currentMinute}:${currentSecond}`);
        cierreEjecutado = true; // Marcar como ejecutado para evitar repeticiones
        
        verificarCierreAutomatico().catch(error => {
          console.error('Error en verificación de cierre automático:', error);
          cierreEjecutado = false; // Resetear flag en caso de error
        });
      }
      
      // Resetear flag cuando salgamos de la ventana de medianoche exacta
      if (currentHour !== 0 || currentMinute !== 0) {
        cierreEjecutado = false;
      }
    };

    // Verificar cada 10 segundos para detectar medianoche exacta
    const interval = setInterval(checkMidnight, 10000);
    
    // Verificar inmediatamente al cargar si estamos en la ventana de medianoche exacta
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('Sistema iniciado en ventana de medianoche exacta, verificando cierre...');
      verificarCierreAutomatico().catch(error => {
        console.error('Error en verificación inicial de cierre:', error);
      });
    }

    return () => clearInterval(interval);
  }, [verificarCierreAutomatico]);

  // Verificar estado del cierre al inicializar
  useEffect(() => {
    verificarEstadoCierre().catch(error => {
      console.error('Error verificando estado inicial del cierre:', error);
    });
  }, [verificarEstadoCierre]);

  // Función para limpiar cache
  const limpiarCache = useCallback(() => {
    console.log('Limpiando cache local...');
    setCacheLocal({
      ultimaVerificacion: null,
      estadoCache: null,
      fechaCache: null
    });
    localStorage.removeItem('fechasArchivadas');
  }, []);

  // Función para debug del estado
  const debugEstado = useCallback(async () => {
    try {
      const resultado = await debugEstadoPedidos();
      console.log('Debug completado:', resultado);
      return resultado;
    } catch (error) {
      console.error('Error en debug:', error);
      throw error;
    }
  }, []);

  // Función de debug específica para cierre automático
  const debugCierreAutomatico = useCallback(async () => {
    try {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minuto = ahora.getMinutes();
      const segundo = ahora.getSeconds();
      const fechaHoy = ahora.toISOString().split('T')[0];
      
      console.log('=== DEBUG CIERRE AUTOMÁTICO ===');
      console.log(`Hora actual: ${hora}:${minuto}:${segundo}`);
      console.log(`Fecha hoy: ${fechaHoy}`);
      console.log(`En ventana de medianoche: ${hora === 0 && minuto === 0 && segundo <= 30}`);
      console.log(`Ventana segura para forzar: ${(hora === 0 && minuto === 0 && segundo <= 30) || (hora === 23 && minuto === 59 && segundo >= 30)}`);
      
      const estado = await verificarEstadoCierre(true);
      console.log('Estado del cierre:', estado);
      console.log('Cache local:', cacheLocal);
      console.log('Estado actual:', estadoCierre);
      console.log('=== FIN DEBUG CIERRE AUTOMÁTICO ===');
      
      return {
        hora,
        minuto,
        segundo,
        fechaHoy,
        enVentanaMedianoche: hora === 0 && minuto === 0 && segundo <= 30,
        enVentanaSegura: (hora === 0 && minuto === 0 && segundo <= 30) || (hora === 23 && minuto === 59 && segundo >= 30),
        estado,
        cacheLocal,
        estadoCierre
      };
    } catch (error) {
      console.error('Error en debug cierre automático:', error);
      throw error;
    }
  }, [verificarEstadoCierre, cacheLocal, estadoCierre]);

  // Función para limpiar pedidos huérfanos
  const limpiarHuerfanos = useCallback(async () => {
    try {
      const resultado = await limpiarPedidosHuerfanos();
      console.log('Limpieza de huérfanos completada:', resultado);
      
      // Actualizar estado después de la limpieza
      await verificarEstadoCierre();
      
      return resultado;
    } catch (error) {
      console.error('Error limpiando huérfanos:', error);
      throw error;
    }
  }, [verificarEstadoCierre]);

  // Función de emergencia para limpiar todos los pedidos
  const limpiarTodos = useCallback(async () => {
    try {
      const resultado = await limpiarTodosLosPedidos();
      console.log('Limpieza de emergencia completada:', resultado);
      
      // Actualizar estado después de la limpieza
      await verificarEstadoCierre();
      
      return resultado;
    } catch (error) {
      console.error('Error en limpieza de emergencia:', error);
      throw error;
    }
  }, [verificarEstadoCierre]);

  const value = {
    estadoCierre,
    pedidosArchivados,
    fechasArchivadas,
    verificarEstadoCierre,
    ejecutarCierreManual,
    verificarCierreAutomatico,
    obtenerPedidosArchivados,
    obtenerFechasArchivadas,
    limpiarCache,
    debugEstado,
    debugCierreAutomatico,
    limpiarHuerfanos,
    limpiarTodos
  };

  return (
    <CierreContext.Provider value={value}>
      {children}
    </CierreContext.Provider>
  );
};
