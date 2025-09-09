import React, { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaxisProvider, useTaxis } from './contexts/TaxisContext';
import { BasesProvider } from './contexts/BasesContext';
import { SelectionProvider } from './contexts/SelectionContext';
import { NovedadesProvider } from './contexts/NovedadesContext';
import { CierreProvider } from './contexts/CierreContext';
import { createAdminUser } from './firebase/auth';
import { subscribeToOrders, updateOrder, addOrder } from './firebase/orders';
import { incrementTaxiCounter, decrementTaxiCounter } from './firebase/taxis';
import Login from './components/Login';
import Header from './components/Header';
import TaxiGrid from './components/TaxiGrid';
import OrdersTable from './components/OrdersTable';
import ToastNotification from './components/ToastNotification';
import { focusTelefonoFieldDelayed, setupAutoFocusOnLoad } from './utils/focusUtils';
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
  const [toast, setToast] = useState(null);
  const telefonoRef = useRef(null);

  // Función para mostrar toast
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  // Función para enfocar el campo teléfono
  const focusTelefono = () => {
    if (telefonoRef.current) {
      setTimeout(() => {
        telefonoRef.current.focus();
        telefonoRef.current.select();
      }, 100);
    }
  };

  // Cargar pedidos desde Firebase
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToOrders((ordersData) => {
        setOrders(ordersData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Configurar auto-foco al cargar la página y regresar a la pestaña
  useEffect(() => {
    if (user) {
      // Focus inicial al cargar
      focusTelefono();

      // Listener para cuando la ventana recupera el foco
      const handleWindowFocus = () => {
        focusTelefono();
      };

      // Listener para cuando la pestaña se vuelve visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          focusTelefono();
        }
      };

      // Agregar event listeners
      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup anterior
      const cleanup = setupAutoFocusOnLoad();

      return () => {
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (cleanup) cleanup();
      };
    }
  }, [user]);

  const handleAddOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    focusTelefono(); // Auto-focus después de agregar pedido
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
      focusTelefono(); // Auto-focus después de eliminar pedido
    } catch (error) {
      console.error('Error manejando contadores al eliminar pedido:', error);
      // Aún así eliminar el pedido del estado local
      setOrders(prev => prev.filter(order => order.id !== orderId));
      focusTelefono(); // Auto-focus después de eliminar pedido (incluso con error)
    }
  };

  const handleUpdateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
    focusTelefono(); // Auto-focus después de actualizar pedido
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

      // No agregar manualmente al estado local - el listener de Firebase se encargará
      console.log('Pedido desde base creado exitosamente:', newOrder);
      
      // Enfocar automáticamente el campo de teléfono
      focusTelefono();
      
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

      // Enfocar automáticamente el campo de teléfono
      focusTelefono();
      
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
        <TaxiGrid onAssignUnit={handleAssignUnit} orders={orders} onCreateBaseOrder={handleCreateBaseOrder} onShowToast={showToast} />
        <OrdersTable orders={orders} onAddOrder={handleAddOrder} onDeleteOrder={handleDeleteOrder} onUpdateOrder={handleUpdateOrder} telefonoRef={telefonoRef} />
      </main>
      
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Componente raíz
const App = () => {
  return (
    <AuthProvider>
      <BasesProvider>
        <NovedadesProvider>
          <CierreProvider>
            <SystemInitializer />
            <TaxisProvider>
              <SelectionProvider>
                <AppContent />
              </SelectionProvider>
            </TaxisProvider>
          </CierreProvider>
        </NovedadesProvider>
      </BasesProvider>
    </AuthProvider>
  );
};

export default App;
