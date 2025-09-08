import React, { useState, useEffect } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { getClientByPhone, addClient } from '../firebase/clients';
import { addOrder, updateOrder, deleteOrder } from '../firebase/orders';
import ReassignmentHistory from './ReassignmentHistory';
import ClientModal from './ClientModal';

const OrdersTable = ({ orders = [], onAddOrder, onDeleteOrder, onUpdateOrder }) => {
  const { selectedOrderId, selectOrder } = useSelection();
  const [newOrder, setNewOrder] = useState({
    cliente: '',
    domicilio: '',
    observaciones: '',
    cantidad: 1,
    qse: false
  });
  
  const [cantidadInputRef, setCantidadInputRef] = useState(null);
  
  const [showClientModal, setShowClientModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  
  
  // Mostrar todos los pedidos (pendientes y asignados)
  const allOrders = orders;
  
  // Debug: Log de pedidos para detectar duplicados
  useEffect(() => {
    console.log('OrdersTable: Pedidos actuales:', allOrders.map(o => ({ id: o.id, cliente: o.cliente, hora: o.hora })));
  }, [allOrders]);

  const handleRowClick = (orderId) => {
    selectOrder(orderId);
  };

  const handleNewOrderChange = (field, value) => {
    setNewOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCantidadChange = (increment) => {
    setNewOrder(prev => {
      const newCantidad = increment 
        ? Math.min(prev.cantidad + 1, 5) 
        : Math.max(prev.cantidad - 1, 1);
      return {
        ...prev,
        cantidad: newCantidad
      };
    });
  };

  const handleClienteKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!newOrder.cliente.trim()) {
        return;
      }

      const phoneNumber = newOrder.cliente.trim();
      
      try {
        // Verificar si el cliente existe
        const existingClient = await getClientByPhone(phoneNumber);
        
        if (existingClient) {
          // Cliente existe, mover foco al campo cantidad
          if (cantidadInputRef) {
            cantidadInputRef.focus();
          }
        } else {
          // Cliente no existe, mostrar modal para agregarlo
          setPendingOrder({
            cliente: phoneNumber,
            domicilio: newOrder.domicilio.trim(),
            observaciones: newOrder.observaciones.trim(),
            cantidad: newOrder.cantidad,
            qse: newOrder.qse
          });
          setShowClientModal(true);
        }
      } catch (error) {
        console.error('Error verificando cliente:', error);
        // En caso de error, mostrar el modal para agregar cliente
        setPendingOrder({
          cliente: phoneNumber,
          domicilio: newOrder.domicilio.trim(),
          observaciones: newOrder.observaciones.trim(),
          cantidad: newOrder.cantidad,
          qse: newOrder.qse
        });
        setShowClientModal(true);
      }
    }
  };

  const handleCantidadKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!newOrder.cliente.trim()) {
        alert('Por favor ingrese un número de teléfono');
        return;
      }

      const phoneNumber = newOrder.cliente.trim();
      
      try {
        // Verificar si el cliente existe
        const existingClient = await getClientByPhone(phoneNumber);
        
        if (existingClient) {
          // Cliente existe, crear pedidos
          await createOrder(existingClient);
        } else {
          // Cliente no existe, mostrar modal para agregarlo
          setPendingOrder({
            cliente: phoneNumber,
            domicilio: newOrder.domicilio.trim(),
            observaciones: newOrder.observaciones.trim(),
            cantidad: newOrder.cantidad,
            qse: newOrder.qse
          });
          setShowClientModal(true);
        }
      } catch (error) {
        console.error('Error verificando cliente:', error);
        // En caso de error, mostrar el modal para agregar cliente
        setPendingOrder({
          cliente: phoneNumber,
          domicilio: newOrder.domicilio.trim(),
          observaciones: newOrder.observaciones.trim(),
          cantidad: newOrder.cantidad,
          qse: newOrder.qse
        });
        setShowClientModal(true);
      }
    }
  };

  const handleAddNewOrder = async () => {
    if (!newOrder.cliente.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    const phoneNumber = newOrder.cliente.trim();
    
    try {
      // Verificar si el cliente existe
      const existingClient = await getClientByPhone(phoneNumber);
      
      if (existingClient) {
        // Cliente existe, usar sus datos
        await createOrder(existingClient);
      } else {
        // Cliente no existe, mostrar modal para agregarlo
        setPendingOrder({
          cliente: phoneNumber,
          domicilio: newOrder.domicilio.trim(),
          observaciones: newOrder.observaciones.trim(),
          cantidad: newOrder.cantidad,
          qse: newOrder.qse
        });
        setShowClientModal(true);
      }
    } catch (error) {
      console.error('Error verificando cliente:', error);
      // En caso de error, mostrar el modal para agregar cliente
      setPendingOrder({
        cliente: phoneNumber,
        domicilio: newOrder.domicilio.trim(),
        observaciones: newOrder.observaciones.trim(),
        cantidad: newOrder.cantidad,
        qse: newOrder.qse
      });
      setShowClientModal(true);
    }
  };

  const createOrder = async (clientData) => {
    try {
      console.log('Creando pedidos con cantidad:', newOrder.cantidad);
      const currentTime = new Date().toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      // Crear múltiples pedidos según la cantidad
      const createdOrders = [];
      for (let i = 0; i < newOrder.cantidad; i++) {
        const order = {
          cliente: newOrder.cliente.trim(),
          hora: currentTime,
          domicilio: clientData.direccion || newOrder.domicilio.trim(),
          observaciones: clientData.observaciones || newOrder.observaciones.trim(),
          qse: newOrder.qse,
          unidad: null,
          horaAsignacion: null,
          b67: false,
          conf: false
        };
        console.log(`Pedido ${i + 1} creado:`, order);

        // Guardar en Firebase
        const orderWithId = await addOrder(order);
        
        // Agregar a la lista de pedidos creados (solo para logging)
        createdOrders.push(orderWithId);
      }
      
      // No agregar manualmente al estado local - el listener de Firebase se encargará
      console.log('Pedidos creados en Firebase:', createdOrders);
      
      // Limpiar la fila nueva
      setNewOrder({
        cliente: '',
        domicilio: '',
        observaciones: '',
        cantidad: 1,
        qse: false
      });
    } catch (error) {
      console.error('Error creando pedidos:', error);
      alert('Error al crear los pedidos. Intente nuevamente.');
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      // Guardar cliente en Firebase
      await addClient(clientData);
      
      // Cerrar modal
      setShowClientModal(false);
      setPendingOrder(null);
      
      // Mover foco al campo cantidad
      if (cantidadInputRef) {
        cantidadInputRef.focus();
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alert('Error al guardar el cliente. Intente nuevamente.');
    }
  };

  const handleCloseModal = () => {
    setShowClientModal(false);
    setPendingOrder(null);
  };

  const handleQSMChange = async (orderId, qsmValue) => {
    try {
      console.log('Cambiando QSM para pedido:', orderId, 'Nuevo valor:', qsmValue);
      
      // Actualizar en Firebase
      await updateOrder(orderId, { qse: qsmValue });
      console.log('QSM actualizado en Firebase');
      
      // Actualizar estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, qse: qsmValue } : order
      );
      console.log('Estado local actualizado');
      
      // Actualizar el estado del componente padre
      if (onUpdateOrder) {
        const updatedOrder = updatedOrders.find(o => o.id === orderId);
        if (updatedOrder) {
          console.log('Notificando cambio al componente padre:', updatedOrder);
          onUpdateOrder(updatedOrder);
        }
      }
    } catch (error) {
      console.error('Error actualizando QSM:', error);
      alert('Error al actualizar QSM. Intente nuevamente.');
    }
  };

  const handleConfChange = async (orderId, confValue) => {
    try {
      console.log('Cambiando Conf para pedido:', orderId, 'Nuevo valor:', confValue);
      
      // Preparar datos de actualización
      const updateData = { b67: confValue };
      
      // Si se está confirmando (marcando), agregar la hora de confirmación
      if (confValue) {
        const confirmationTime = new Date().toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        updateData.horaConfirmacion = confirmationTime;
        console.log('Hora de confirmación:', confirmationTime);
      } else {
        // Si se está desmarcando, quitar la hora de confirmación
        updateData.horaConfirmacion = null;
      }
      
      // Actualizar en Firebase
      await updateOrder(orderId, updateData);
      console.log('Conf actualizado en Firebase');
      
      // Actualizar estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updateData } : order
      );
      console.log('Estado local actualizado');
      
      // Actualizar el estado del componente padre
      if (onUpdateOrder) {
        const updatedOrder = updatedOrders.find(o => o.id === orderId);
        if (updatedOrder) {
          console.log('Notificando cambio al componente padre:', updatedOrder);
          onUpdateOrder(updatedOrder);
        }
      }
    } catch (error) {
      console.error('Error actualizando Conf:', error);
      alert('Error al actualizar confirmación. Intente nuevamente.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      // Confirmar antes de eliminar
      const confirmDelete = window.confirm('¿Está seguro de que desea eliminar este pedido?');
      
      if (confirmDelete) {
        console.log('Eliminando pedido:', orderId);
        
        // Eliminar de Firebase
        await deleteOrder(orderId);
        console.log('Pedido eliminado de Firebase');
        
        // Notificar al componente padre para actualizar la lista
        if (onDeleteOrder) {
          await onDeleteOrder(orderId);
        }
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar el pedido. Intente nuevamente.');
    }
  };

  const getRowClass = (order) => {
    // Validar que order no sea null o undefined
    if (!order) return 'order-row';
    
    let baseClass = 'order-row';
    
    if (order.qse) {
      console.log('Aplicando clase qse-row al pedido:', order.id, 'QSM:', order.qse);
      baseClass += ' qse-row';
    }
    if (order.unidad) baseClass += ' assigned-row';
    if (selectedOrderId === order.id) baseClass += ' selected-row';
    
    return baseClass;
  };

  const getUnidadClass = (order) => {
    if (!order) return 'unidad-field pending';
    if (order.unidad) return 'unidad-field assigned';
    return 'unidad-field pending';
  };

  return (
    <div className="orders-section">
      {/* Fila fija para nuevo pedido - siempre visible, sin títulos */}
      <div className="new-order-fixed-row">
        <table className="orders-table">
          <tbody>
            <tr className="new-order-row">
              <td className="cliente-field">
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newOrder.cliente}
                  onChange={(e) => handleNewOrderChange('cliente', e.target.value)}
                  onKeyPress={handleClienteKeyPress}
                  style={{ width: '100%', border: 'none', background: 'transparent' }}
                />
              </td>
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
              <td className="cantidad-field">
                <div className="cantidad-control">
                  <button
                    type="button"
                    className="cantidad-btn"
                    onClick={() => handleCantidadChange(false)}
                    disabled={newOrder.cantidad <= 1}
                  >
                    -
                  </button>
                  <span 
                    className="cantidad-value"
                    ref={setCantidadInputRef}
                    tabIndex={0}
                    onKeyPress={handleCantidadKeyPress}
                    style={{ cursor: 'pointer' }}
                  >
                    {newOrder.cantidad}
                  </span>
                  <button
                    type="button"
                    className="cantidad-btn"
                    onClick={() => handleCantidadChange(true)}
                    disabled={newOrder.cantidad >= 5}
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="confirm-field">
                <button
                  className="add-order-button"
                  onClick={handleAddNewOrder}
                  title="Agregar pedido"
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Tabla de pedidos existentes con títulos */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="header-cliente">Cliente</th>
              <th className="header-hora">Hora</th>
              <th className="header-domicilio">Domicilio</th>
              <th className="header-observaciones">Observaciones</th>
              <th className="header-qse">QSM</th>
              <th className="header-unidad">Unidad</th>
              <th className="header-hora-asignacion">Hora</th>
              <th className="header-b67">Conf</th>
              <th className="header-confirm">Eliminar</th>
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
              allOrders.filter(order => order !== null && order !== undefined && order.id).map((order) => (
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
                      onChange={(e) => handleQSMChange(order.id, e.target.checked)}
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
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <input 
                        type="checkbox" 
                        checked={order.b67 || false}
                        onChange={(e) => handleConfChange(order.id, e.target.checked)}
                      />
                      {order.b67 && order.horaConfirmacion && (
                        <div 
                          className="confirmation-tooltip"
                          title={`Confirmado a las ${order.horaConfirmacion}`}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#28a745',
                            borderRadius: '50%',
                            border: '2px solid white',
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                          onClick={() => alert(`Cliente confirmado a las ${order.horaConfirmacion}`)}
                        />
                      )}
                    </div>
                  </td>
                  <td className="confirm-field">
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Eliminar pedido"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#dc3545',
                        fontSize: '16px'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <ClientModal
        isOpen={showClientModal}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        phoneNumber={pendingOrder?.cliente}
      />
    </div>
  );
};

export default OrdersTable;
