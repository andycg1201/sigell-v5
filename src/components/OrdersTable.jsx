import React, { useState, useEffect } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { getClientByPhone, addClient } from '../firebase/clients';
import { getClienteByPhone } from '../firebase/clientes';
import { addOrder, updateOrder, deleteOrder } from '../firebase/orders';
import ReassignmentHistory from './ReassignmentHistory';
import ClientModal from './ClientModal';
import DireccionesModal from './DireccionesModal';
import CalificacionModal from './CalificacionModal';
import ModemModal from './ModemModal';
import { focusTelefonoFieldDelayed } from '../utils/focusUtils';

const OrdersTable = ({ orders = [], onAddOrder, onDeleteOrder, onUpdateOrder, telefonoRef }) => {
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
  const [showDireccionesModal, setShowDireccionesModal] = useState(false);
  const [telefonoSeleccionado, setTelefonoSeleccionado] = useState('');
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);
  const [pedidoParaCalificar, setPedidoParaCalificar] = useState(null);
  
  // Estado para manejar llamadas del modem
  const [incomingCall, setIncomingCall] = useState(null);
  const [showModemModal, setShowModemModal] = useState(false);
  
  
  // Mostrar todos los pedidos (pendientes y asignados)
  const allOrders = orders;
  
  // Debug: Log de pedidos para detectar duplicados
  useEffect(() => {
    console.log('OrdersTable: Pedidos actuales:', allOrders.map(o => ({ id: o.id, cliente: o.cliente, hora: o.hora })));
  }, [allOrders]);

  // Solicitar permisos de notificación al cargar el componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listener para toggle del modal del modem
  useEffect(() => {
    const handleToggleModemModal = () => {
      setShowModemModal(prev => !prev);
    };

    window.addEventListener('toggleModemTest', handleToggleModemModal);
    
    return () => {
      window.removeEventListener('toggleModemTest', handleToggleModemModal);
    };
  }, []);

  const handleRowClick = (orderId) => {
    selectOrder(orderId);
  };

  // Función para seleccionar dirección del modal
  const handleSelectDireccion = (direccion) => {
    setNewOrder(prev => ({
      ...prev,
      domicilio: direccion
    }));
    setShowDireccionesModal(false);
    setTelefonoSeleccionado('');
    
    // Enfocar el campo de cantidad después de cerrar el modal
    setTimeout(() => {
      if (cantidadInputRef) {
        cantidadInputRef.focus();
      }
    }, 100);
  };

  // Función para abrir modal de calificación
  const handleCalificarCliente = (pedido) => {
    setPedidoParaCalificar(pedido);
    setShowCalificacionModal(true);
  };

  // Función para cerrar modal de calificación
  const handleCalificacionGuardada = () => {
    setShowCalificacionModal(false);
    setPedidoParaCalificar(null);
  };

  // Función para manejar llamadas detectadas del modem
  const handleModemCallDetected = (callInfo) => {
    console.log('OrdersTable: Llamada detectada del modem:', callInfo);
    
    // Establecer la llamada entrante
    setIncomingCall(callInfo);
    
    // Pre-llenar el campo de teléfono con el número detectado
    setNewOrder(prev => ({
      ...prev,
      cliente: callInfo.phoneNumber
    }));
    
    // Abrir automáticamente el modal de direcciones
    setTelefonoSeleccionado(callInfo.phoneNumber);
    setShowDireccionesModal(true);
    
    // Mostrar notificación visual/sonora
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Llamada Entrante', {
        body: `Número: ${callInfo.phoneNumber}`,
        icon: '/favicon.ico'
      });
    }
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
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      const telefono = newOrder.cliente.trim();
      if (telefono) {
        // Abrir modal universal (siempre se abre)
        setTelefonoSeleccionado(telefono);
        setShowDireccionesModal(true);
      } else {
        // Si no hay teléfono, enfocar cantidad
        if (cantidadInputRef) {
          cantidadInputRef.focus();
        }
      }
    }
  };

  const handleCantidadKeyPress = async (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
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
            domicilio: '', // No usar valor de la fila de entrada
            observaciones: '', // No usar valor de la fila de entrada
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

      // Enfocar automáticamente el campo de teléfono
      focusTelefonoFieldDelayed();
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

      // Enfocar automáticamente el campo de teléfono
      focusTelefonoFieldDelayed();
      
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

        // Enfocar automáticamente el campo de teléfono
        focusTelefonoFieldDelayed();
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
                  ref={telefonoRef}
                  type="tel"
                  placeholder="Teléfono"
                  value={newOrder.cliente}
                  onChange={(e) => handleNewOrderChange('cliente', e.target.value)}
                  onKeyPress={handleClienteKeyPress}
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
                    tabIndex={-1}
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
                    tabIndex={-1}
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
                  tabIndex={-1}
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
              allOrders.filter(order => order !== null && order !== undefined && order.id).map((order) => {
                const isBaseOrder = !order.hora; // Salida de base si no tiene hora
                return (
                <tr 
                  key={order.id} 
                  className={`${getRowClass(order)} ${isBaseOrder ? 'base-order' : ''}`}
                  onClick={isBaseOrder ? undefined : () => handleRowClick(order.id)}
                  style={{ cursor: isBaseOrder ? 'default' : 'pointer' }}
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
                        disabled={isBaseOrder}
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
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {/* Botón de calificación - solo visible si está asignado */}
                      {order.unidad && (
                        <button
                          className="calificar-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCalificarCliente(order);
                          }}
                          title="Calificar cliente"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            color: '#ffc107',
                            fontSize: '16px'
                          }}
                        >
                          ⭐
                        </button>
                      )}
                      
                      {/* Botón eliminar */}
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
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
                    </div>
                  </td>
                </tr>
                );
              })
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

      {/* Modal de direcciones múltiples */}
      <DireccionesModal
        isOpen={showDireccionesModal}
        onClose={() => {
          setShowDireccionesModal(false);
          setTelefonoSeleccionado('');
          
          // Enfocar el campo de cantidad después de cerrar el modal
          setTimeout(() => {
            if (cantidadInputRef) {
              cantidadInputRef.focus();
            }
          }, 100);
        }}
        telefono={telefonoSeleccionado}
        onSelectDireccion={handleSelectDireccion}
      />

      {/* Modal de calificación de clientes */}
      <CalificacionModal
        isOpen={showCalificacionModal}
        onClose={() => {
          setShowCalificacionModal(false);
          setPedidoParaCalificar(null);
        }}
        pedido={pedidoParaCalificar}
        onCalificacionGuardada={handleCalificacionGuardada}
      />

      {/* Modal del sistema del modem */}
      <ModemModal
        isOpen={showModemModal}
        onClose={() => setShowModemModal(false)}
        onCallDetected={handleModemCallDetected}
      />
    </div>
  );
};

export default OrdersTable;
