// Utilidades para manejo de foco automático
// Función para enfocar automáticamente el campo de teléfono después de cualquier acción

export const focusTelefonoField = () => {
  // Buscar el campo de teléfono en OrderForm
  const orderFormTelefono = document.getElementById('cliente');
  if (orderFormTelefono) {
    orderFormTelefono.focus();
    return;
  }

  // Buscar el campo de teléfono en OrdersTable (fila fija)
  const ordersTableTelefono = document.querySelector('input[type="tel"][placeholder="Teléfono"]');
  if (ordersTableTelefono) {
    ordersTableTelefono.focus();
    return;
  }

  // Si no encuentra ningún campo, log para debug
  console.log('No se encontró campo de teléfono para enfocar');
};

// Función para enfocar con un pequeño delay (útil después de operaciones async)
export const focusTelefonoFieldDelayed = (delay = 100) => {
  setTimeout(() => {
    focusTelefonoField();
  }, delay);
};

// Función para enfocar al cargar la página o regresar a la pestaña
export const setupAutoFocusOnLoad = () => {
  // Enfocar cuando se carga la página
  const handlePageLoad = () => {
    // Delay para asegurar que todos los componentes estén renderizados
    setTimeout(() => {
      focusTelefonoField();
    }, 500);
  };

  // Enfocar cuando se regresa a la pestaña (desde otra pestaña o aplicación)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Delay para asegurar que la pestaña esté completamente activa
      setTimeout(() => {
        focusTelefonoField();
      }, 200);
    }
  };

  // Enfocar cuando se regresa a la ventana (desde otra aplicación)
  const handleFocus = () => {
    setTimeout(() => {
      focusTelefonoField();
    }, 200);
  };

  // Agregar event listeners
  window.addEventListener('load', handlePageLoad);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  // Función de limpieza (opcional, para remover listeners si es necesario)
  return () => {
    window.removeEventListener('load', handlePageLoad);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
};
