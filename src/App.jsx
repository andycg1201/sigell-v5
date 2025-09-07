import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaxisProvider, useTaxis } from './contexts/TaxisContext';
import { SelectionProvider } from './contexts/SelectionContext';
import { createAdminUser } from './firebase/auth';
import { subscribeToOrders, updateOrder } from './firebase/orders';
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

  const handleUpdateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
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
      } else {
        // Primera asignación
        updateData.reasignaciones = [];
      }

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
        <TaxiGrid onAssignUnit={handleAssignUnit} orders={orders} />
        <OrdersTable orders={orders} onAddOrder={handleAddOrder} onUpdateOrder={handleUpdateOrder} />
      </main>
    </div>
  );
};

// Componente raíz
const App = () => {
  return (
    <AuthProvider>
      <SystemInitializer />
      <TaxisProvider>
        <SelectionProvider>
          <AppContent />
        </SelectionProvider>
      </TaxisProvider>
    </AuthProvider>
  );
};

export default App;
