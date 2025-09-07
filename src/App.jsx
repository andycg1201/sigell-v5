import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaxisProvider, useTaxis } from './contexts/TaxisContext';
import { createAdminUser } from './firebase/auth';
import Login from './components/Login';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import TaxiGrid from './components/TaxiGrid';
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
        <TaxiGrid />
      </main>
    </div>
  );
};

// Componente raíz
const App = () => {
  return (
    <AuthProvider>
      <TaxisProvider>
        <SystemInitializer />
        <AppContent />
      </TaxisProvider>
    </AuthProvider>
  );
};

export default App;
