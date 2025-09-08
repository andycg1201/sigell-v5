import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTaxis } from '../contexts/TaxisContext';
import { useSelection } from '../contexts/SelectionContext';
import { useNovedades } from '../contexts/NovedadesContext';
import NovedadesModal from './NovedadesModal';
import NovedadesBadgeModal from './NovedadesBadgeModal';
import InhabilitacionModal from './InhabilitacionModal';
import { getMotivosInhabilitacion, getMotivosActivosTaxi, habilitarTaxi } from '../firebase/inhabilitaciones';

const TaxiButton = ({ taxi, onAssignUnit, orders, onCreateBaseOrder, onShowBaseModal, onShowToast }) => {
  const { counters, incrementCounter, decrementCounter, toggleStatus } = useTaxis();
  const { selectedOrderId, clearSelection } = useSelection();
  const { 
    novedadesConfig, 
    taxiNovedades, 
    subscribeToTaxi, 
    addNovedad, 
    removeNovedad, 
    getTaxiNovedadesActivas,
    getTaxiNovedadesCount 
  } = useNovedades();
  
  const counter = counters[taxi.id] || 0;
  const [showNovedadesModal, setShowNovedadesModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [optimisticNovedades, setOptimisticNovedades] = useState(new Set());
  const [showInhabilitacionModal, setShowInhabilitacionModal] = useState(false);
  const [showInhabilitacionPopup, setShowInhabilitacionPopup] = useState(false);
  const [motivosInhabilitacion, setMotivosInhabilitacion] = useState([]);
  const [motivosConfig, setMotivosConfig] = useState(null);
  
  // Optimizar cálculos de novedades con useMemo
  const realNovedadesCount = useMemo(() => getTaxiNovedadesCount(taxi.id), [taxi.id, getTaxiNovedadesCount]);
  const realNovedadesActivas = useMemo(() => getTaxiNovedadesActivas(taxi.id), [taxi.id, getTaxiNovedadesActivas]);
  
  // Combinar novedades reales con optimistas (evitando duplicados) - OPTIMIZADO
  const novedadesData = useMemo(() => {
    const realCodigos = new Set(realNovedadesActivas.map(n => n.codigo));
    const optimistasUnicos = Array.from(optimisticNovedades).filter(codigo => !realCodigos.has(codigo));
    
    const novedadesCount = realNovedadesCount + optimistasUnicos.length;
    const novedadesActivas = [
      ...realNovedadesActivas,
      ...optimistasUnicos.map(codigo => ({
        codigo,
        descripcion: novedadesConfig?.novedades?.find(n => n.codigo === codigo)?.descripcion || '',
        activa: true
      }))
    ];
    
    return {
      novedadesCount,
      novedadesActivas,
      hasNovedades: novedadesCount > 0
    };
  }, [realNovedadesCount, realNovedadesActivas, optimisticNovedades, novedadesConfig?.novedades]);
  
  const { novedadesCount, novedadesActivas, hasNovedades } = novedadesData;
  
  // Determinar si el taxi está inhabilitado
  const isInhabilitado = useMemo(() => {
    return motivosInhabilitacion.length > 0;
  }, [motivosInhabilitacion]);
  
  // Determinar si la fila debe ser resaltada (filas 1, 3, 5)
  const rowNumber = ((taxi.id - 1) % 5) + 1;
  const isHighlightedRow = rowNumber === 1 || rowNumber === 3 || rowNumber === 5;
  
  // Suscribirse a las novedades del taxi
  useEffect(() => {
    const unsubscribe = subscribeToTaxi(taxi.id);
    return () => unsubscribe();
  }, [taxi.id, subscribeToTaxi]);

  // Cargar configuración de motivos de inhabilitación
  useEffect(() => {
    const loadMotivosConfig = async () => {
      try {
        const config = await getMotivosInhabilitacion();
        setMotivosConfig(config);
      } catch (error) {
        console.error('Error cargando configuración de motivos:', error);
      }
    };
    loadMotivosConfig();
  }, []);

  // Cargar motivos activos del taxi
  useEffect(() => {
    const loadMotivosActivos = async () => {
      try {
        const motivos = await getMotivosActivosTaxi(taxi.id);
        setMotivosInhabilitacion(motivos);
      } catch (error) {
        console.error('Error cargando motivos activos:', error);
      }
    };
    loadMotivosActivos();
  }, [taxi.id]);

  // Limpiar estado optimista cuando las novedades reales se actualizan
  // useEffect removido para evitar bucle infinito

  // Log temporal para debug - REMOVIDO para evitar bucle infinito
  // if (isHighlightedRow) {
  //   console.log(`Taxi ${taxi.numero} está en fila ${rowNumber} - debe ser resaltado`);
  // }

  const handleButtonClick = useCallback(async () => {
    console.log('Botón clickeado:', taxi.numero, 'checkboxMarcado:', taxi.checkboxMarcado);
    
    if (!taxi.checkboxMarcado) {
      // Si hay una fila seleccionada, verificar inhabilitación y novedades antes de asignar
      if (selectedOrderId) {
        // Verificar si el taxi está inhabilitado
        if (isInhabilitado) {
          const motivosTexto = motivosInhabilitacion.map(m => `${m.codigo} - ${m.concepto}`).join(', ');
          const mensaje = `Taxi ${taxi.numero} está inhabilitado: ${motivosTexto}`;
          onShowToast(mensaje, 'error');
          return;
        }
        
        // Verificar si el taxi tiene novedades
        if (hasNovedades) {
          const novedadesTexto = novedadesActivas.map(n => `${n.codigo} - ${n.descripcion}`).join(', ');
          const mensaje = `Taxi ${taxi.numero} tiene novedades: ${novedadesTexto}`;
          onShowToast(mensaje, 'error');
          return;
        }
        
        console.log('Asignando unidad', taxi.numero, 'al pedido', selectedOrderId);
        
        // Asignar unidad (los contadores se manejan automáticamente en App.jsx)
        onAssignUnit(selectedOrderId, taxi.numero);
        clearSelection();
        return;
      }
      
      // Si no hay fila seleccionada, verificar inhabilitación y novedades antes de mostrar modal de bases
      if (isInhabilitado) {
        const motivosTexto = motivosInhabilitacion.map(m => `${m.codigo} - ${m.concepto}`).join(', ');
        const mensaje = `Taxi ${taxi.numero} está inhabilitado: ${motivosTexto}`;
        onShowToast(mensaje, 'error');
        return;
      }
      
      if (hasNovedades) {
        const novedadesTexto = novedadesActivas.map(n => `${n.codigo} - ${n.descripcion}`).join(', ');
        const mensaje = `Taxi ${taxi.numero} tiene novedades: ${novedadesTexto}`;
        onShowToast(mensaje, 'error');
        return;
      }
      
      // Si no tiene novedades, mostrar modal de bases
      console.log('Mostrando modal de bases para taxi:', taxi.id);
      if (onShowBaseModal) {
        onShowBaseModal(taxi.numero);
      }
    } else {
      console.log('Taxi deshabilitado, no se incrementa contador');
    }
  }, [taxi.checkboxMarcado, taxi.numero, taxi.id, selectedOrderId, isInhabilitado, motivosInhabilitacion, hasNovedades, novedadesActivas, onShowToast, onAssignUnit, clearSelection, onShowBaseModal]);

  const handleCheckboxChange = useCallback(async (e) => {
    try {
      console.log('Checkbox cambiado:', e.target.checked, 'Taxi ID:', taxi.id);
      
      // Si se está marcando (inhabilitando), mostrar modal
      if (e.target.checked === true) {
        setShowInhabilitacionModal(true);
      } else {
        // Si se está desmarcando (habilitando), habilitar directamente
        console.log('Habilitando taxi directamente:', taxi.id);
        await toggleStatus(taxi.id, false);
      }
    } catch (error) {
      console.error('Error alternando estado:', error);
    }
  }, [taxi.id, toggleStatus]);

  // Manejar click derecho para mostrar modal de novedades
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    console.log('Click derecho en taxi:', taxi.numero);
    setShowNovedadesModal(true);
  }, [taxi.numero]);

  // Manejar click en el badge para mostrar novedades activas
  const handleBadgeClick = useCallback((e) => {
    e.stopPropagation();
    setShowBadgeModal(true);
  }, []);

  // Manejar toggle de novedad - OPTIMIZADO
  const handleToggleNovedad = useCallback(async (taxiId, codigo, descripcion, activar) => {
    console.log('handleToggleNovedad llamado:', { taxiId, codigo, descripcion, activar });
    
    // Actualizar estado optimista inmediatamente
    if (activar) {
      setOptimisticNovedades(prev => new Set(prev).add(codigo));
    } else {
      setOptimisticNovedades(prev => {
        const newSet = new Set(prev);
        newSet.delete(codigo);
        return newSet;
      });
    }
    
    try {
      if (activar) {
        console.log('Agregando novedad:', codigo);
        await addNovedad(taxiId, codigo, descripcion);
        console.log('Novedad agregada exitosamente');
      } else {
        console.log('Removiendo novedad:', codigo);
        await removeNovedad(taxiId, codigo);
        console.log('Novedad removida exitosamente');
      }
    } catch (error) {
      console.error('Error toggleando novedad:', error);
      // Revertir estado optimista en caso de error
      if (activar) {
        setOptimisticNovedades(prev => {
          const newSet = new Set(prev);
          newSet.delete(codigo);
          return newSet;
        });
      } else {
        setOptimisticNovedades(prev => new Set(prev).add(codigo));
      }
    }
  }, [addNovedad, removeNovedad]);

  const handleInhabilitacionSuccess = useCallback(async () => {
    // Recargar motivos activos después de inhabilitar
    try {
      const motivos = await getMotivosActivosTaxi(taxi.id);
      setMotivosInhabilitacion(motivos);
    } catch (error) {
      console.error('Error recargando motivos activos:', error);
    }
  }, [taxi.id]);

  // Manejar click en badge de inhabilitación
  const handleInhabilitacionBadgeClick = useCallback((e) => {
    e.stopPropagation(); // Prevenir que se propague al botón
    setShowInhabilitacionPopup(!showInhabilitacionPopup);
  }, [showInhabilitacionPopup]);

  // Manejar resolución de inhabilitación individual
  const handleResolverInhabilitacion = useCallback(async (codigoMotivo) => {
    try {
      console.log('Resolviendo inhabilitación:', codigoMotivo, 'Taxi:', taxi.id);
      
      // Resolver la inhabilitación específica
      await habilitarTaxi(taxi.id, codigoMotivo);
      
      // Recargar motivos activos
      const motivos = await getMotivosActivosTaxi(taxi.id);
      setMotivosInhabilitacion(motivos);
      
      // Si no quedan motivos activos, habilitar el taxi y desmarcar checkbox
      if (motivos.length === 0) {
        await toggleStatus(taxi.id, false); // false = desmarcar checkbox (habilitar)
        onShowToast(`Taxi ${taxi.numero} habilitado - Todas las inhabilitaciones resueltas`, 'success');
      } else {
        onShowToast(`Inhabilitación ${codigoMotivo} resuelta - Quedan ${motivos.length} activas`, 'info');
      }
      
      // Cerrar popup
      setShowInhabilitacionPopup(false);
      
    } catch (error) {
      console.error('Error resolviendo inhabilitación:', error);
      onShowToast('Error al resolver inhabilitación', 'error');
    }
  }, [taxi.id, taxi.numero, toggleStatus, onShowToast]);

  // Manejar click fuera del popup para cerrarlo
  const handleClickOutside = useCallback((e) => {
    if (showInhabilitacionPopup && !e.target.closest('.inhabilitacion-popup') && !e.target.closest('.inhabilitacion-badge-count')) {
      setShowInhabilitacionPopup(false);
    }
  }, [showInhabilitacionPopup]);

  // Agregar/remover event listener para click fuera
  useEffect(() => {
    if (showInhabilitacionPopup) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showInhabilitacionPopup, handleClickOutside]);


  return (
    <div className={`taxi-item ${isHighlightedRow ? 'highlighted-row' : ''}`}>
      <input
        type="checkbox"
        className="taxi-checkbox"
        checked={taxi.checkboxMarcado || false} // Checkbox desmarcado por defecto
        onChange={handleCheckboxChange}
      />
      <button
        className="taxi-button"
        onClick={handleButtonClick}
        onContextMenu={handleRightClick}
        disabled={taxi.checkboxMarcado}
      >
        {taxi.numero}
        {hasNovedades && (
          <div 
            className="novedades-badge"
            onClick={handleBadgeClick}
            title="Click para ver novedades"
          >
            {novedadesCount}
          </div>
        )}
        {motivosInhabilitacion.length > 0 && (
          <div 
            className="inhabilitacion-badge-count"
            onClick={handleInhabilitacionBadgeClick}
            title="Click para ver detalles de inhabilitaciones"
          >
            {motivosInhabilitacion.length}
          </div>
        )}
      </button>
      <div className={`taxi-counter ${taxi.checkboxMarcado ? 'disabled' : ''}`}>
        {counter}
      </div>
      
      
      {/* Modal de novedades */}
      <NovedadesModal
        isOpen={showNovedadesModal}
        onClose={() => setShowNovedadesModal(false)}
        taxiId={taxi.numero}
        novedadesConfig={novedadesConfig}
        taxiNovedades={taxiNovedades[taxi.id]}
        onToggleNovedad={handleToggleNovedad}
      />
      
      {/* Modal de badge */}
      <NovedadesBadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        taxiId={taxi.numero}
        novedadesActivas={novedadesActivas}
      />
      
      {/* Modal de inhabilitación */}
      <InhabilitacionModal
        isOpen={showInhabilitacionModal}
        onClose={() => setShowInhabilitacionModal(false)}
        taxiId={taxi.id}
        taxiNumero={taxi.numero}
        motivosConfig={motivosConfig}
        onInhabilitacionSuccess={handleInhabilitacionSuccess}
      />
      
      {/* Popup de inhabilitaciones - Portal */}
      {showInhabilitacionPopup && motivosInhabilitacion.length > 0 && createPortal(
        <div className="inhabilitacion-popup">
          <div className="popup-header">
            <span>Inhabilitaciones Activas - Taxi #{taxi.numero}</span>
            <button 
              className="popup-close"
              onClick={() => setShowInhabilitacionPopup(false)}
            >
              ×
            </button>
          </div>
          <div className="popup-content">
            {motivosInhabilitacion.map((motivo, index) => (
              <div key={index} className="motivo-item">
                <div className="motivo-header">
                  <span className="motivo-concepto">{motivo.concepto}</span>
                  <button 
                    className="resolver-btn"
                    onClick={() => handleResolverInhabilitacion(motivo.codigo)}
                    title="Resolver esta inhabilitación"
                  >
                    ✅
                  </button>
                </div>
                <div className="motivo-details">
                  <div className="responsable">
                    {motivo.responsable}
                  </div>
                  <div className="fecha">
                    <strong>Fecha:</strong> {new Date(motivo.fechaInhabilitacion).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaxiButton;
