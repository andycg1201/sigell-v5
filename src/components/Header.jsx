import React from 'react';
import { logout } from '../firebase/auth';

const Header = ({ user }) => {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return now.toLocaleString('es-EC', options);
  };

  const [dateTime, setDateTime] = React.useState(getCurrentDateTime());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getCurrentDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1>Sistema de Control de Taxis</h1>
        <p>{dateTime}</p>
      </div>
      <div className="header-right">
        <div className="user-info">
          Usuario: {user?.email} ({user?.email === 'admin@sigell.com' ? 'ADMIN' : 'OPERADOR'})
        </div>
        <button onClick={handleLogout} className="signout-button">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;
