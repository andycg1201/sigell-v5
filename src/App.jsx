import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaxisProvider, useTaxis } from './contexts/TaxisContext';
import { SelectionProvider } from './contexts/SelectionContext';
import { createAdminUser } from './firebase/auth';
import Login from './components/Login';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
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
  const [orders, setOrders] = useState([
    // Datos de ejemplo para probar
    {
      id: 1,
      cliente: '0997652586',
      hora: '14:30',
      domicilio: 'Los Galeanos y Analia Bernal',
      observaciones: 'Cliente siempre pide que lo esperen 5 minutos',
      qse: false,
      unidad: null,
      horaAsignacion: null,
      b67: false,
      conf: false,
      createdAt: new Date()
    },
    {
      id: 2,
      cliente: '0987654321',
      hora: '14:25',
      domicilio: 'Av. 6 de Diciembre y Colón',
      observaciones: 'Llevar cambio exacto',
      qse: true,
      unidad: null,
      horaAsignacion: null,
      b67: false,
      conf: false,
      createdAt: new Date()
    }
  ]);

  const handleAddOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleAssignUnit = (orderId, unitNumber) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const currentTime = new Date().toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        // Si ya tiene una unidad asignada, es una reasignación
        if (order.unidad) {
          return {
            ...order,
            unidad: unitNumber,
            horaAsignacion: currentTime,
            reasignaciones: [
              ...(order.reasignaciones || []),
              { unidad: order.unidad, hora: order.horaAsignacion }
            ]
          };
        } else {
          // Primera asignación
          return {
            ...order,
            unidad: unitNumber,
            horaAsignacion: currentTime,
            reasignaciones: []
          };
        }
      }
      return order;
    }));
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
        {user.email === 'admin@sigell.com' && <AdminPanel />}
        <TaxiGrid onAssignUnit={handleAssignUnit} orders={orders} />
        <OrdersTable orders={orders} onAddOrder={handleAddOrder} />
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
