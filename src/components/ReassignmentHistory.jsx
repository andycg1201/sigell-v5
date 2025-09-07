import React, { useState } from 'react';

const ReassignmentHistory = ({ order }) => {
  const [showHistory, setShowHistory] = useState(false);
  
  if (!order.reasignaciones || order.reasignaciones.length === 0) {
    return null;
  }

  const reassignmentCount = order.reasignaciones.length;

  return (
    <>
      <span 
        className="reassignment-indicator"
        onClick={(e) => {
          e.stopPropagation();
          setShowHistory(true);
        }}
        title={`${reassignmentCount} reasignación${reassignmentCount > 1 ? 'es' : ''}`}
      >
        {reassignmentCount}
      </span>
      
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-popup" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <h4>Historial de Reasignaciones</h4>
              <button 
                className="close-history-btn"
                onClick={() => setShowHistory(false)}
              >
                ✕
              </button>
            </div>
            <div className="history-content">
              <div className="history-item original">
                <span className="unit">Unidad {order.unidad}</span>
                <span className="time">{order.horaAsignacion}</span>
                <span className="status">Actual</span>
              </div>
              {order.reasignaciones.map((reassignment, index) => (
                <div key={index} className="history-item">
                  <span className="unit">Unidad {reassignment.unidad}</span>
                  <span className="time">{reassignment.hora}</span>
                  <span className="status">Anterior</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReassignmentHistory;

