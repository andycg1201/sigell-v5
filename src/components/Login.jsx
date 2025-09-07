import React, { useState } from 'react';
import { login } from '../firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError('Credenciales incorrectas');
      console.error('Error de login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Sistema de Control de Taxis</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p><strong>Credenciales por defecto:</strong></p>
          <p>Email: admin@sigell.com</p>
          <p>Contraseña: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
