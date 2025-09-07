import React, { useState } from 'react';

const OrderForm = ({ onAddOrder }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    domicilio: '',
    observaciones: '',
    qse: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cliente.trim()) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }

    const newOrder = {
      id: Date.now(),
      cliente: formData.cliente.trim(),
      hora: new Date().toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      domicilio: formData.domicilio.trim(),
      observaciones: formData.observaciones.trim(),
      qse: formData.qse,
      unidad: null,
      horaAsignacion: null,
      b67: false,
      conf: false,
      createdAt: new Date()
    };

    onAddOrder(newOrder);
    
    // Limpiar formulario
    setFormData({
      cliente: '',
      domicilio: '',
      observaciones: '',
      qse: false
    });
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
              QSE (Encomiendas)
            </label>
          </div>
        </div>

        <button type="submit" className="btn-add-order">
          Agregar Pedido
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
