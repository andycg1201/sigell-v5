import React, { useState } from 'react';
import { addCalificacionToCliente } from '../firebase/clientes';

const CalificacionModal = ({ isOpen, onClose, pedido, onCalificacionGuardada }) => {
  const [tipoCalificacion, setTipoCalificacion] = useState('');
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const opcionesRapidas = [
    { tipo: 'negativo', texto: 'Cliente grosero', icono: '😠' },
    { tipo: 'negativo', texto: 'No espera', icono: '⏰' },
    { tipo: 'negativo', texto: 'No pagó', icono: '💸' },
    { tipo: 'negativo', texto: 'Cliente difícil', icono: '😤' },
    { tipo: 'positivo', texto: 'Cliente excelente', icono: '⭐' },
    { tipo: 'positivo', texto: 'Buena propina', icono: '💰' },
    { tipo: 'positivo', texto: 'Muy amable', icono: '😊' },
    { tipo: 'neutral', texto: 'Sin observaciones', icono: '😐' }
  ];

  const handleGuardarCalificacion = async () => {
    if (!tipoCalificacion || !observacion.trim()) {
      alert('Por favor selecciona un tipo y escribe una observación');
      return;
    }

    setGuardando(true);
    try {
      const calificacionData = {
        fecha: new Date().toISOString().split('T')[0],
        hora: pedido.horaAsignacion || new Date().toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        unidad: pedido.unidad,
        operador: 'admin@sigell.com', // TODO: Obtener del contexto de usuario
        incidente: observacion.trim(),
        tipo: tipoCalificacion,
        pedidoId: pedido.id
      };

      await addCalificacionToCliente(pedido.cliente, calificacionData);
      
      if (onCalificacionGuardada) {
        onCalificacionGuardada();
      }
      
      alert('Calificación guardada exitosamente');
      onClose();
      
      // Limpiar formulario
      setTipoCalificacion('');
      setObservacion('');
    } catch (error) {
      console.error('Error guardando calificación:', error);
      alert('Error guardando calificación');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpcionRapida = (opcion) => {
    setTipoCalificacion(opcion.tipo);
    setObservacion(opcion.texto);
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'positivo': return '#4caf50';
      case 'negativo': return '#f44336';
      case 'neutral': return '#ff9800';
      default: return '#2196f3';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="calificacion-modal">
        <div className="modal-header">
          <h3>⭐ Calificar Cliente</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Información del pedido */}
          <div className="pedido-info">
            <h4>Información del Pedido</h4>
            <div className="pedido-details">
              <div><strong>Cliente:</strong> {pedido.cliente}</div>
              <div><strong>Hora:</strong> {pedido.horaAsignacion || 'N/A'}</div>
              <div><strong>Unidad:</strong> {pedido.unidad || 'N/A'}</div>
              <div><strong>Dirección:</strong> {pedido.domicilio || 'N/A'}</div>
            </div>
          </div>

          {/* Opciones rápidas */}
          <div className="opciones-rapidas">
            <h5>Opciones Rápidas</h5>
            <div className="opciones-grid">
              {opcionesRapidas.map((opcion, index) => (
                <button
                  key={index}
                  className={`opcion-rapida ${tipoCalificacion === opcion.tipo && observacion === opcion.texto ? 'seleccionada' : ''}`}
                  style={{ 
                    borderColor: getTipoColor(opcion.tipo),
                    backgroundColor: tipoCalificacion === opcion.tipo && observacion === opcion.texto ? getTipoColor(opcion.tipo) + '20' : 'transparent'
                  }}
                  onClick={() => handleOpcionRapida(opcion)}
                >
                  <span className="opcion-icono">{opcion.icono}</span>
                  <span className="opcion-texto">{opcion.texto}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de calificación */}
          <div className="tipo-calificacion">
            <h5>Tipo de Calificación</h5>
            <div className="tipo-options">
              <label className={`tipo-option ${tipoCalificacion === 'positivo' ? 'seleccionada' : ''}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="positivo"
                  checked={tipoCalificacion === 'positivo'}
                  onChange={(e) => setTipoCalificacion(e.target.value)}
                />
                <span className="tipo-icono">⭐</span>
                <span>Positivo</span>
              </label>
              
              <label className={`tipo-option ${tipoCalificacion === 'neutral' ? 'seleccionada' : ''}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="neutral"
                  checked={tipoCalificacion === 'neutral'}
                  onChange={(e) => setTipoCalificacion(e.target.value)}
                />
                <span className="tipo-icono">😐</span>
                <span>Neutral</span>
              </label>
              
              <label className={`tipo-option ${tipoCalificacion === 'negativo' ? 'seleccionada' : ''}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="negativo"
                  checked={tipoCalificacion === 'negativo'}
                  onChange={(e) => setTipoCalificacion(e.target.value)}
                />
                <span className="tipo-icono">⚠️</span>
                <span>Negativo</span>
              </label>
            </div>
          </div>

          {/* Observación personalizada */}
          <div className="observacion-section">
            <h5>Observación</h5>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe la situación o comportamiento del cliente..."
              className="observacion-textarea"
              rows="4"
            />
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="btn-guardar"
              onClick={handleGuardarCalificacion}
              disabled={guardando || !tipoCalificacion || !observacion.trim()}
            >
              {guardando ? 'Guardando...' : 'Guardar Calificación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalificacionModal;
