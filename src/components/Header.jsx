import React from 'react';
import { logout } from '../firebase/auth';
import { useCierre } from '../contexts/CierreContext';
import AdminPanel from './AdminPanel';

const Header = ({ user }) => {
  const { estadoCierre } = useCierre();
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>🚕 Sigell</h1>
          <div className="system-status">
            <span className={`status-indicator ${estadoCierre.necesitaCierre ? 'pending' : 'ok'}`}>
              {estadoCierre.necesitaCierre ? '⚠️ Cierre Pendiente' : '✅ Sistema Al Día'}
            </span>
            {estadoCierre.necesitaCierre && (
              <span className="status-detail">
                Último cierre: {estadoCierre.ultimoCierre}
              </span>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.email || 'Usuario'}</span>
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="admin-button"
              title="Panel Administrativo"
            >
              ⚙️ Administración
            </button>
            <button onClick={handleLogout} className="signout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Panel Administrativo */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <style jsx>{`
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-left h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .system-status {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-indicator {
          font-size: 0.9rem;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .status-indicator.pending {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }

        .status-indicator.ok {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
        }

        .status-detail {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-name {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .admin-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .admin-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .signout-button {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #dc3545;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .signout-button:hover {
          background: rgba(220, 53, 69, 0.3);
          border-color: rgba(220, 53, 69, 0.5);
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 15px;
          }

          .header-left {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .user-info {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
