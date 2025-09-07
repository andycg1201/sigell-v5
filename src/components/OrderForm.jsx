import React, { useState, useEffect } from 'react';
import { getClientByPhone, addClient } from '../firebase/clients';
import { addOrder } from '../firebase/orders';
import ClientModal from './ClientModal';

const OrderForm = ({ onAddOrder }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    domicilio: '',
    observaciones: '',
    qse: false
  });
  
  const [showClientModal, setShowClientModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  
  // Debug: Log cuando cambie el estado del modal
  useEffect(() => {
    console.log('Estado del modal cambió:', showClientModal);
  }, [showClientModal]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cliente.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    const phoneNumber = formData.cliente.trim();
    
    try {
      console.log('Verificando cliente con teléfono:', phoneNumber);
      // Verificar si el cliente existe
      const existingClient = await getClientByPhone(phoneNumber);
      console.log('Cliente encontrado:', existingClient);
      
      if (existingClient) {
        // Cliente existe, usar sus datos
        console.log('Cliente existe, creando pedido...');
        await createOrder(existingClient);
      } else {
        // Cliente no existe, mostrar modal para agregarlo
        console.log('Cliente no existe, mostrando modal...');
        setPendingOrder({
          cliente: phoneNumber,
          domicilio: formData.domicilio.trim(),
          observaciones: formData.observaciones.trim(),
          qse: formData.qse
        });
        console.log('Estableciendo showClientModal a true');
        setShowClientModal(true);
        console.log('showClientModal establecido');
      }
    } catch (error) {
      console.error('Error verificando cliente:', error);
      // En caso de error, mostrar el modal para agregar cliente
      console.log('Error en verificación, mostrando modal de todas formas...');
      setPendingOrder({
        cliente: phoneNumber,
        domicilio: formData.domicilio.trim(),
        observaciones: formData.observaciones.trim(),
        qse: formData.qse
      });
      setShowClientModal(true);
    }
  };

  const createOrder = async (clientData) => {
    try {
      const newOrder = {
        cliente: formData.cliente.trim(),
        hora: new Date().toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        domicilio: clientData.direccion || formData.domicilio.trim(),
        observaciones: clientData.observaciones || formData.observaciones.trim(),
        qse: formData.qse,
        unidad: null,
        horaAsignacion: null,
        b67: false,
        conf: false
      };

      // Guardar en Firebase
      const orderId = await addOrder(newOrder);
      
      // Actualizar estado local
      onAddOrder({ ...newOrder, id: orderId, createdAt: new Date() });
      
      // Limpiar formulario
      setFormData({
        cliente: '',
        domicilio: '',
        observaciones: '',
        qse: false
      });
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('Error al crear el pedido. Intente nuevamente.');
    }
  };

  const handleSaveClient = async (clientData) => {
    try {
      // Guardar cliente en Firebase
      await addClient(clientData);
      
      // Crear el pedido con los datos del cliente
      await createOrder(clientData);
      
      // Cerrar modal
      setShowClientModal(false);
      setPendingOrder(null);
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alert('Error al guardar el cliente. Intente nuevamente.');
    }
  };

  const handleCloseModal = () => {
    setShowClientModal(false);
    setPendingOrder(null);
  };

  return (
    <div className="order-form-section">
      <h3>Nuevo Pedido</h3>
      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cliente">Cliente (Teléfono):</label>
            <input
              type="tel"
              id="cliente"
              name="cliente"
              value={formData.cliente}
              onChange={handleInputChange}
              placeholder="0997652586"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="domicilio">Domicilio:</label>
            <input
              type="text"
              id="domicilio"
              name="domicilio"
              value={formData.domicilio}
              onChange={handleInputChange}
              placeholder="Los Galeanos y Analia Bernal"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="observaciones">Observaciones:</label>
            <input
              type="text"
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Cliente siempre pide que lo esperen 5 minutos"
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label htmlFor="qse">
              <input
                type="checkbox"
                id="qse"
                name="qse"
                checked={formData.qse}
                onChange={handleInputChange}
              />
              QSM (Encomiendas)
            </label>
          </div>
        </div>

        <button type="submit" className="btn-add-order">
          Agregar Pedido
        </button>
        
        {/* Botón de prueba temporal */}
        <button 
          type="button" 
          onClick={() => {
            console.log('Botón de prueba clickeado');
            setShowClientModal(true);
          }}
          style={{ marginLeft: '10px', background: 'red', color: 'white' }}
        >
          TEST MODAL
        </button>
      </form>
      
      <ClientModal
        isOpen={showClientModal}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        phoneNumber={pendingOrder?.cliente}
      />
    </div>
  );
};

export default OrderForm;
