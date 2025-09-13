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
      // Usar cache si está disponible, sino consultar Firebase
      const estado = await verificarEstadoCierre();
      
      if (estado.necesitaCierre) {
        console.log('Ejecutando cierre automático...');
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
        
        console.log('Cierre automático completado:', resultado);
        return resultado;
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
    const checkMidnight = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      // Solo ejecutar cierre automático exactamente a medianoche (00:00:00)
      if (currentHour === 0 && currentMinute === 0 && currentSecond === 0) {
        console.log('Medianoche detectada (00:00:00), ejecutando cierre automático...');
        verificarCierreAutomatico().catch(error => {
          console.error('Error en cierre automático de medianoche:', error);
        });
      }
    };

    // Verificar cada segundo para detectar medianoche exacta
    const interval = setInterval(checkMidnight, 1000);
    
    // No verificar inmediatamente al cargar (solo a medianoche)

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
    limpiarHuerfanos,
    limpiarTodos
  };

  return (
    <CierreContext.Provider value={value}>
      {children}
    </CierreContext.Provider>
  );
};
