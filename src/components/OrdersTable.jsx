import React, { useState } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import ReassignmentHistory from './ReassignmentHistory';

const OrdersTable = ({ orders = [], onAddOrder }) => {
  const { selectedOrderId, selectOrder } = useSelection();
  const [newOrder, setNewOrder] = useState({
    cliente: '',
    domicilio: '',
    observaciones: '',
    qse: false
  });
  
  // Mostrar todos los pedidos (pendientes y asignados)
  const allOrders = orders;

  const handleRowClick = (orderId) => {
    selectOrder(orderId);
  };

  const handleNewOrderChange = (field, value) => {
    setNewOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNewOrder = () => {
    if (!newOrder.cliente.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    const order = {
      id: Date.now(),
      cliente: newOrder.cliente.trim(),
      hora: new Date().toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      domicilio: newOrder.domicilio.trim(),
      observaciones: newOrder.observaciones.trim(),
      qse: newOrder.qse,
      unidad: null,
      horaAsignacion: null,
      b67: false,
      conf: false,
      createdAt: new Date()
    };

    onAddOrder(order);
    
    // Limpiar la fila nueva
    setNewOrder({
      cliente: '',
      domicilio: '',
      observaciones: '',
      qse: false
    });
  };

  const getRowClass = (order) => {
    let baseClass = 'order-row';
    
    if (order.qse) baseClass += ' qse-row';
    if (order.unidad) baseClass += ' assigned-row';
    if (selectedOrderId === order.id) baseClass += ' selected-row';
    
    return baseClass;
  };

  const getUnidadClass = (order) => {
    if (order.unidad) return 'unidad-field assigned';
    return 'unidad-field pending';
  };

  return (
    <div className="orders-section">
      
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="header-cliente">Cliente</th>
              <th className="header-hora">Hora</th>
              <th className="header-domicilio">Domicilio</th>
              <th className="header-observaciones">Observaciones</th>
              <th className="header-qse">QSE</th>
              <th className="header-unidad">Unidad</th>
              <th className="header-hora-asignacion">Hora</th>
              <th className="header-b67">B67</th>
              <th className="header-confirm">Confirm:</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No hay pedidos
                </td>
              </tr>
            ) : (
              allOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className={getRowClass(order)}
                  onClick={() => handleRowClick(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="cliente-field">
                    {order.cliente}
                    <span className="dropdown-arrow">▼</span>
                  </td>
                  <td className="hora-field">{order.hora}</td>
                  <td className="domicilio-field">{order.domicilio}</td>
                  <td className="observaciones-field">{order.observaciones}</td>
                  <td className="qse-field">
                    <input 
                      type="checkbox" 
                      checked={order.qse || false}
                      readOnly
                    />
                  </td>
                  <td className={getUnidadClass(order)}>
                    {order.unidad ? (
                      <span className="unidad-box assigned">
                        {order.unidad}
                        <ReassignmentHistory order={order} />
                      </span>
                    ) : (
                      <span className="unidad-box pending">Sin asignar</span>
                    )}
                    <span className="dropdown-arrow">▼</span>
                  </td>
                  <td className="hora-asignacion-field">{order.horaAsignacion || ''}</td>
                  <td className="b67-field">
                    <input 
                      type="checkbox" 
                      checked={order.b67 || false}
                      readOnly
                    />
                  </td>
                  <td className="confirm-field">
                    <input 
                      type="text" 
                      placeholder=""
                      readOnly
                    />
                  </td>
                </tr>
              ))
            )}
            
            {/* Fila vacía para nuevo pedido */}
            <tr className="new-order-row">
              <td className="cliente-field">
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newOrder.cliente}
                  onChange={(e) => handleNewOrderChange('cliente', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewOrder()}
                  style={{ width: '100%', border: 'none', background: 'transparent' }}
                />
              </td>
              <td className="hora-field">-</td>
              <td className="domicilio-field">
                <input
                  type="text"
                  placeholder="Domicilio"
                  value={newOrder.domicilio}
                  onChange={(e) => handleNewOrderChange('domicilio', e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent' }}
                />
              </td>
              <td className="observaciones-field">
                <input
                  type="text"
                  placeholder="Observaciones"
                  value={newOrder.observaciones}
                  onChange={(e) => handleNewOrderChange('observaciones', e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent' }}
                />
              </td>
              <td className="qse-field">
                <input
                  type="checkbox"
                  checked={newOrder.qse}
                  onChange={(e) => handleNewOrderChange('qse', e.target.checked)}
                />
              </td>
              <td className="unidad-field">
                <span className="unidad-box pending">Sin asignar</span>
              </td>
              <td className="hora-asignacion-field">-</td>
              <td className="b67-field">
                <input type="checkbox" disabled />
              </td>
              <td className="confirm-field">
                <input type="text" placeholder="" disabled />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
