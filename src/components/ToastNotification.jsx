import React, { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ message, type = 'error', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Mostrar toast
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Ocultar toast después de la duración
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`toast-notification ${type} ${isLeaving ? 'leaving' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'error' && '⚠️'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
          {type === 'success' && '✅'}
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;

