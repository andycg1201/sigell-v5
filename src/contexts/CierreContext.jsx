import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  verificarCierreDelDia,
  ejecutarCierreDelDia,
  getPedidosArchivados,
  getFechasArchivadas
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

  // Verificar estado del cierre al inicializar
  const verificarEstadoCierre = useCallback(async () => {
    try {
      const estado = await verificarCierreDelDia();
      setEstadoCierre(prev => ({
        ...prev,
        ...estado,
        procesando: false
      }));
      
      console.log('Estado del cierre verificado:', estado);
      return estado;
    } catch (error) {
      console.error('Error verificando estado del cierre:', error);
      setEstadoCierre(prev => ({
        ...prev,
        procesando: false
      }));
      throw error;
    }
  }, []);

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

  // Verificar cierre automático a medianoche
  const verificarCierreAutomatico = useCallback(async () => {
    try {
      const estado = await verificarCierreDelDia();
      
      if (estado.necesitaCierre) {
        console.log('Ejecutando cierre automático...');
        // Usar la fecha del último cierre para archivar los pedidos
        const resultado = await ejecutarCierreDelDia(estado.ultimoCierre);
        
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
  }, []);

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

  // Obtener lista de fechas archivadas
  const obtenerFechasArchivadas = useCallback(async () => {
    try {
      const fechas = await getFechasArchivadas();
      setFechasArchivadas(fechas);
      return fechas;
    } catch (error) {
      console.error('Error obteniendo fechas archivadas:', error);
      throw error;
    }
  }, []);

  // Timer para verificar medianoche
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('Medianoche detectada, verificando cierre automático...');
        verificarCierreAutomatico().catch(error => {
          console.error('Error en cierre automático de medianoche:', error);
        });
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkMidnight, 60000);
    
    // Verificar inmediatamente al cargar
    checkMidnight();

    return () => clearInterval(interval);
  }, [verificarCierreAutomatico]);

  // Verificar estado del cierre al inicializar
  useEffect(() => {
    verificarEstadoCierre().catch(error => {
      console.error('Error verificando estado inicial del cierre:', error);
    });
  }, [verificarEstadoCierre]);

  const value = {
    estadoCierre,
    pedidosArchivados,
    fechasArchivadas,
    verificarEstadoCierre,
    ejecutarCierreManual,
    verificarCierreAutomatico,
    obtenerPedidosArchivados,
    obtenerFechasArchivadas
  };

  return (
    <CierreContext.Provider value={value}>
      {children}
    </CierreContext.Provider>
  );
};
