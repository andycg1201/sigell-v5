import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import TablaNovedades from './TablaNovedades';
import ModalCamposEspeciales from './ModalCamposEspeciales';
import { useNovedades } from '../contexts/NovedadesContext';

const NovedadesModal = ({ 
  isOpen, 
  onClose, 
  taxiId, 
  novedadesConfig, 
  taxiNovedades, 
  onToggleNovedad 
}) => {
  if (!isOpen) return null;

  const { addNovedad, editNovedad, removeNovedadById } = useNovedades();
  const [processingNovedades, setProcessingNovedades] = useState(new Set());
  const [optimisticNovedades, setOptimisticNovedades] = useState(new Set());
  const [showCamposModal, setShowCamposModal] = useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);

  // Usar useMemo para evitar re-cálculos innecesarios
  const novedadesActivas = useMemo(() => {
    return taxiNovedades?.novedades?.filter(n => n.activa) || [];
  }, [taxiNovedades?.novedades]);

  // Todas las novedades (activas e inactivas) para mostrar en la tabla
  const todasLasNovedades = useMemo(() => {
    return taxiNovedades?.novedades || [];
  }, [taxiNovedades?.novedades]);

  const novedadesDisponibles = useMemo(() => {
    return novedadesConfig?.novedades?.filter(n => n.activa) || [];
  }, [novedadesConfig?.novedades]);

  // Combinar novedades reales con optimistas para feedback inmediato (evitando duplicados)
  const novedadesActivasCombinadas = useMemo(() => {
    const realCodigos = new Set(novedadesActivas.map(n => n.codigo));
    const optimistasUnicos = Array.from(optimisticNovedades).filter(codigo => !realCodigos.has(codigo));
    
    return [
      ...novedadesActivas,
      ...optimistasUnicos.map(codigo => ({
        codigo,
        descripcion: novedadesConfig?.novedades?.find(n => n.codigo === codigo)?.descripcion || '',
        activa: true
      }))
    ];
  }, [novedadesActivas, optimisticNovedades, novedadesConfig?.novedades]);
  
  // Log solo cuando el modal se abre (una sola vez)
  useEffect(() => {
    if (isOpen) {
      console.log('NovedadesModal abierto para taxi:', taxiId);
      console.log('Configuración de novedades recibida:', novedadesConfig);
      console.log('Novedades disponibles:', novedadesDisponibles);
      console.log('Número de novedades disponibles:', novedadesDisponibles.length);
    } else {
      // Limpiar estado optimista cuando se cierra el modal
      setOptimisticNovedades(new Set());
    }
  }, [isOpen, taxiId, novedadesConfig, novedadesDisponibles]);

  // Log solo si no hay novedades disponibles (una sola vez)
  useEffect(() => {
    if (novedadesDisponibles.length === 0) {
      console.log('No hay novedades disponibles en la configuración');
    }
  }, [novedadesDisponibles.length]);

  const handleNovedadClick = useCallback((novedad) => {
    if (processingNovedades.has(novedad.codigo)) {
      console.log('Ya se está procesando la novedad', novedad.codigo, ', ignorando click');
      return;
    }

    console.log('Click en novedad:', novedad.codigo, novedad.descripcion);
    
    // Verificar si la novedad ya está activa
    const isActiva = novedadesActivasCombinadas.some(n => n.codigo === novedad.codigo);
    
    // Para B54 (Daño Mecánico) y B07 (Carrera fuera de la Ciudad), si ya están activos, desactivarlos directamente
    // B70 (Multa) siempre abre el modal para crear un nuevo registro
    if ((novedad.codigo === 'B54' || novedad.codigo === 'B07') && isActiva) {
      const descripcionAccion = {
        'B54': 'taxi salió de mecánica',
        'B07': 'taxi regresó de carrera fuera de la ciudad'
      };
      
      console.log(`${novedad.codigo} ya está activo, desactivando (${descripcionAccion[novedad.codigo]})`);
      setProcessingNovedades(prev => new Set([...prev, novedad.codigo]));
      
      addNovedad(taxiId, novedad.codigo, novedad.descripcion, {})
        .then(() => {
          console.log(`${novedad.codigo} desactivado exitosamente`);
        })
        .catch((error) => {
          console.error(`Error desactivando ${novedad.codigo}:`, error);
        })
        .finally(() => {
          setProcessingNovedades(prev => {
            const newSet = new Set(prev);
            newSet.delete(novedad.codigo);
            return newSet;
          });
        });
      return;
    }
    
    // Para otras novedades o B54 cuando no está activo, abrir modal de campos especiales
    setNovedadSeleccionada(novedad);
    setShowCamposModal(true);
  }, [processingNovedades, novedadesActivasCombinadas, addNovedad, taxiId]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Función para manejar agregar novedad con campos especiales
  const handleAddNovedad = useCallback(async (codigo, descripcion, camposEspeciales = {}) => {
    try {
      await addNovedad(taxiId, codigo, descripcion, camposEspeciales);
    } catch (error) {
      console.error('Error agregando novedad:', error);
      throw error;
    }
  }, [addNovedad, taxiId]);

  // Función para manejar edición de novedad
  const handleEditNovedad = useCallback(async (taxiId, novedadId, camposActualizados) => {
    try {
      await editNovedad(taxiId, novedadId, camposActualizados);
    } catch (error) {
      console.error('Error editando novedad:', error);
      throw error;
    }
  }, [editNovedad]);

  // Función para manejar eliminación de novedad
  const handleRemoveNovedad = useCallback(async (taxiId, novedadId) => {
    try {
      await removeNovedadById(taxiId, novedadId);
    } catch (error) {
      console.error('Error eliminando novedad:', error);
      throw error;
    }
  }, [removeNovedadById]);

  // Función para manejar guardado desde el modal de campos especiales
  const handleSaveCamposEspeciales = useCallback(async (codigo, descripcion, camposEspeciales) => {
    try {
      await addNovedad(taxiId, codigo, descripcion, camposEspeciales);
      setShowCamposModal(false);
      setNovedadSeleccionada(null);
    } catch (error) {
      console.error('Error guardando novedad con campos especiales:', error);
      throw error;
    }
  }, [addNovedad, taxiId]);

  // Función para cerrar modal de campos especiales
  const handleCloseCamposModal = useCallback(() => {
    setShowCamposModal(false);
    setNovedadSeleccionada(null);
  }, []);

  return createPortal(
    <div className="novedades-modal-overlay" onClick={handleOverlayClick}>
      <div className="novedades-modal">
        <div className="novedades-modal-header">
          <h3>Novedades - Taxi {taxiId}</h3>
          <button className="novedades-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="novedades-modal-content">
          <div className="novedades-section">
            <h4>Seleccionar Novedad</h4>
            <div className="novedades-grid">
              {novedadesDisponibles.map((novedad) => {
                const isActiva = novedadesActivasCombinadas.some(n => n.codigo === novedad.codigo);
                
                return (
                  <button
                    key={novedad.codigo}
                    className={`novedad-button ${isActiva ? 'activa' : 'disponible'}`}
                    onClick={() => handleNovedadClick(novedad)}
                    disabled={processingNovedades.has(novedad.codigo)}
                  >
                    <div className="novedad-codigo">{novedad.codigo}</div>
                    <div className="novedad-descripcion">{novedad.descripcion}</div>
                    {isActiva && <div className="novedad-indicator">●</div>}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Tabla de novedades */}
          <TablaNovedades
            taxiId={taxiId}
            novedadesActivas={todasLasNovedades}
            onAddNovedad={handleAddNovedad}
            onEditNovedad={handleEditNovedad}
            onRemoveNovedad={handleRemoveNovedad}
          />
        </div>
      </div>
      
      {/* Modal de campos especiales */}
      <ModalCamposEspeciales
        isOpen={showCamposModal}
        onClose={handleCloseCamposModal}
        novedad={novedadSeleccionada}
        onSave={handleSaveCamposEspeciales}
      />
    </div>,
    document.body
  );
};

export default NovedadesModal;
