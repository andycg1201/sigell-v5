import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaxisProvider, useTaxis } from './contexts/TaxisContext';
import { BasesProvider } from './contexts/BasesContext';
import { SelectionProvider } from './contexts/SelectionContext';
import { createAdminUser } from './firebase/auth';
import { subscribeToOrders, updateOrder, addOrder } from './firebase/orders';
import { incrementTaxiCounter, decrementTaxiCounter } from './firebase/taxis';
import Login from './components/Login';
import Header from './components/Header';
import TaxiGrid from './components/TaxiGrid';
import OrdersTable from './components/OrdersTable';
import './App.css';

// Componente para inicializar el sistema
const SystemInitializer = () => {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Crear usuario administrador si no existe
        await createAdminUser('admin@sigell.com', 'admin123');
        console.log('Sistema inicializado correctamente');
      } catch (error) {
        console.error('Error inicializando sistema:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeSystem();
  }, []);

  if (initializing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Inicializando sistema...</p>
      </div>
    );
  }

  return null;
};

// Componente principal de la aplicación
const AppContent = () => {
  const { user, loading } = useAuth();
  const { loading: taxisLoading } = useTaxis();
  const [orders, setOrders] = useState([]);

  // Cargar pedidos desde Firebase
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToOrders((ordersData) => {
        setOrders(ordersData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleAddOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      // Buscar el pedido antes de eliminarlo para ver si tenía unidad asignada
      const orderToDelete = orders.find(order => order.id === orderId);
      
      if (orderToDelete && orderToDelete.unidad) {
        // Si tenía unidad asignada, decrementar el contador del taxi
        const taxiId = parseInt(orderToDelete.unidad);
        console.log('Eliminación: decrementando contador del taxi', taxiId, 'por pedido eliminado');
        await decrementTaxiCounter(taxiId);
      }
      
      // Eliminar el pedido del estado local
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error manejando contadores al eliminar pedido:', error);
      // Aún así eliminar el pedido del estado local
      setOrders(prev => prev.filter(order => order.id !== orderId));
    }
  };

  const handleUpdateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const handleCreateBaseOrder = async (base, unitNumber) => {
    try {
      const currentTime = new Date().toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      // Crear pedido desde base
      const baseOrder = {
        cliente: base.nombre,
        domicilio: base.direccion,
        observaciones: '',
        unidad: unitNumber,
        horaAsignacion: currentTime,
        qsm: false,
        confirmado: false,
        reasignaciones: []
      };

      // Crear pedido en Firebase
      console.log('Creando pedido desde base en Firebase:', baseOrder);
      const newOrder = await addOrder(baseOrder);
      
      // Incrementar contador del taxi automáticamente
      console.log('Creando pedido desde base: incrementando contador del taxi', unitNumber);
      await incrementTaxiCounter(unitNumber);

      // Agregar pedido al estado local
      setOrders(prev => [newOrder, ...prev]);
      
      console.log('Pedido desde base creado exitosamente:', newOrder);
      
    } catch (error) {
      console.error('Error creando pedido desde base:', error);
      alert('Error creando pedido desde base. Intente nuevamente.');
    }
  };

  const handleAssignUnit = async (orderId, unitNumber) => {
    try {
      const currentTime = new Date().toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      let updateData = {
        unidad: unitNumber,
        horaAsignacion: currentTime
      };

      // Si ya tiene una unidad asignada, es una reasignación
      if (order.unidad) {
        updateData.reasignaciones = [
          ...(order.reasignaciones || []),
          { unidad: order.unidad, hora: order.horaAsignacion }
        ];
        
        // Decrementar contador del taxi anterior
        const previousTaxiId = parseInt(order.unidad);
        console.log('Reasignación: decrementando contador del taxi', previousTaxiId);
        await decrementTaxiCounter(previousTaxiId);
      } else {
        // Primera asignación
        updateData.reasignaciones = [];
      }

      // Incrementar contador del nuevo taxi
      console.log('Asignación: incrementando contador del taxi', unitNumber);
      await incrementTaxiCounter(unitNumber);

      // Actualizar en Firebase
      await updateOrder(orderId, updateData);

      // Actualizar estado local
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            ...updateData
          };
        }
        return order;
      }));
    } catch (error) {
      console.error('Error asignando unidad:', error);
      alert('Error al asignar la unidad. Intente nuevamente.');
    }
  };

  if (loading || taxisLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      <Header user={user} />
      <main className="main-content">
        <TaxiGrid onAssignUnit={handleAssignUnit} orders={orders} onCreateBaseOrder={handleCreateBaseOrder} />
        <OrdersTable orders={orders} onAddOrder={handleAddOrder} onDeleteOrder={handleDeleteOrder} onUpdateOrder={handleUpdateOrder} />
      </main>
    </div>
  );
};

// Componente raíz
const App = () => {
  return (
    <AuthProvider>
      <BasesProvider>
        <SystemInitializer />
        <TaxisProvider>
          <SelectionProvider>
            <AppContent />
          </SelectionProvider>
        </TaxisProvider>
      </BasesProvider>
    </AuthProvider>
  );
};

export default App;
