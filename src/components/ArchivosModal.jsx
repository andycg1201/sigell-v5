import React, { useState, useEffect } from 'react';
import { useCierre } from '../contexts/CierreContext';

const ArchivosModal = ({ isOpen, onClose }) => {
  const { 
    fechasArchivadas, 
    pedidosArchivados, 
    obtenerFechasArchivadas, 
    obtenerPedidosArchivados 
  } = useCierre();
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [filtroPedidos, setFiltroPedidos] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // todos, asignados, no-asignados

  // Cargar fechas archivadas solo cuando se abre el modal
  useEffect(() => {
    if (isOpen && fechasArchivadas.length === 0) {
      console.log('Modal abierto, cargando fechas archivadas...');
      obtenerFechasArchivadas();
    }
  }, [isOpen, obtenerFechasArchivadas, fechasArchivadas.length]);

  // Cargar pedidos cuando se selecciona una fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      setCargando(true);
      obtenerPedidosArchivados(fechaSeleccionada)
        .finally(() => setCargando(false));
    }
  }, [fechaSeleccionada, obtenerPedidosArchivados]);

  // Filtrar pedidos según criterios
  const pedidosFiltrados = React.useMemo(() => {
    if (!pedidosArchivados || pedidosArchivados.length === 0) return [];
    
    let filtrados = pedidosArchivados;
    
    // Filtrar por tipo
    if (tipoFiltro === 'asignados') {
      filtrados = filtrados.filter(pedido => pedido.unidad);
    } else if (tipoFiltro === 'no-asignados') {
      filtrados = filtrados.filter(pedido => !pedido.unidad);
    }
    
    // Filtrar por texto
    if (filtroPedidos.trim()) {
      const busqueda = filtroPedidos.toLowerCase();
      filtrados = filtrados.filter(pedido => 
        pedido.cliente?.toLowerCase().includes(busqueda) ||
        pedido.domicilio?.toLowerCase().includes(busqueda) ||
        pedido.unidad?.toString().includes(busqueda) ||
        pedido.observaciones?.toLowerCase().includes(busqueda)
      );
    }
    
    return filtrados;
  }, [pedidosArchivados, tipoFiltro, filtroPedidos]);

  // Exportar a CSV
  const exportarCSV = () => {
    if (!pedidosFiltrados.length) {
      alert('No hay pedidos para exportar');
      return;
    }

    const headers = [
      'ID',
      'Cliente',
      'Dirección',
      'Unidad',
      'Estado',
      'Hora Pedido',
      'Hora Asignación',
      'Observaciones',
      'QSE',
      'B67',
      'CONF',
      'Tipo'
    ];

    const csvContent = [
      headers.join(','),
      ...pedidosFiltrados.map(pedido => {
        // Estructura real de los pedidos archivados
        const cliente = pedido.cliente || '';
        const direccion = pedido.domicilio || pedido.direccion || '';
        const unidad = pedido.unidad || 'Sin asignar';
        const horaPedido = pedido.hora || '';
        const horaAsignacion = pedido.horaAsignacion || '';
        const observaciones = pedido.observaciones || '';
        const qse = pedido.qse ? 'Sí' : 'No';
        const b67 = pedido.b67 ? 'Sí' : 'No';
        const conf = pedido.conf ? 'Sí' : 'No';
        const estado = unidad !== 'Sin asignar' ? 'Asignado' : 'Pendiente';
        const tipo = !pedido.hora ? 'Salida de Base' : 'Pedido Normal';
        
        return [
          pedido.id || '',
          `"${cliente}"`,
          `"${direccion}"`,
          unidad,
          estado,
          horaPedido,
          horaAsignacion,
          `"${observaciones}"`,
          qse,
          b67,
          conf,
          tipo
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${fechaSeleccionada}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a JSON
  const exportarJSON = () => {
    if (!pedidosFiltrados.length) {
      alert('No hay pedidos para exportar');
      return;
    }

    const data = {
      fecha: fechaSeleccionada,
      totalPedidos: pedidosFiltrados.length,
      filtros: {
        tipo: tipoFiltro,
        busqueda: filtroPedidos
      },
      pedidos: pedidosFiltrados
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${fechaSeleccionada}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="archivos-modal">
        <div className="modal-header">
          <h3>📁 Pedidos Archivados</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Selector de fecha */}
          <div className="fecha-selector">
            <label>Seleccionar Fecha:</label>
            <select 
              value={fechaSeleccionada} 
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="fecha-select"
            >
              <option value="">-- Seleccionar fecha --</option>
              {fechasArchivadas.map(fecha => (
                <option key={fecha.fecha} value={fecha.fecha}>
                  {fecha.fecha} ({fecha.totalPedidos} pedidos)
                </option>
              ))}
            </select>
          </div>

          {fechaSeleccionada && (
            <>
              {/* Filtros */}
              <div className="filtros-section">
                <div className="filtro-tipo">
                  <label>Tipo:</label>
                  <select 
                    value={tipoFiltro} 
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="filtro-select"
                  >
                    <option value="todos">Todos los pedidos</option>
                    <option value="asignados">Solo asignados</option>
                    <option value="no-asignados">Solo no asignados</option>
                  </select>
                </div>

                <div className="filtro-busqueda">
                  <label>Buscar:</label>
                  <input
                    type="text"
                    value={filtroPedidos}
                    onChange={(e) => setFiltroPedidos(e.target.value)}
                    placeholder="Dirección, unidad, observaciones..."
                    className="busqueda-input"
                  />
                </div>
              </div>

              {/* Botones de exportación */}
              <div className="export-buttons">
                <button 
                  onClick={exportarCSV}
                  disabled={!pedidosFiltrados.length}
                  className="btn-export-csv"
                >
                  📊 Exportar CSV
                </button>
                <button 
                  onClick={exportarJSON}
                  disabled={!pedidosFiltrados.length}
                  className="btn-export-json"
                >
                  📄 Exportar JSON
                </button>
              </div>

              {/* Lista de pedidos */}
              <div className="pedidos-lista">
                <div className="lista-header">
                  <h4>
                    {cargando ? 'Cargando...' : `${pedidosFiltrados.length} pedidos encontrados`}
                  </h4>
                </div>

                {cargando ? (
                  <div className="loading">🔄 Cargando pedidos...</div>
                ) : (
                  <div className="pedidos-container">
                    {pedidosFiltrados.map((pedido, index) => {
                      // Estructura real de los pedidos archivados
                      const direccion = pedido.domicilio || pedido.direccion || 'Sin dirección';
                      const unidad = pedido.unidad;
                      const horaPedido = pedido.hora;
                      const horaAsignacion = pedido.horaAsignacion;
                      const observaciones = pedido.observaciones;
                      const cliente = pedido.cliente;
                      const qse = pedido.qse;
                      const b67 = pedido.b67;
                      const conf = pedido.conf;
                      const estado = unidad ? 'Asignado' : 'Pendiente';
                      const esSalidaBase = !pedido.hora; // Salida de base si no tiene hora
                      
                      return (
                        <div key={pedido.id || index} className="pedido-item">
                          <div className="pedido-info">
                            <div className="pedido-id">#{pedido.id || index + 1}</div>
                            <div className="pedido-cliente">
                              <strong>Cliente:</strong> {cliente || 'Sin cliente'}
                            </div>
                            <div className="pedido-direccion">
                              <strong>Dirección:</strong> {direccion}
                            </div>
                            <div className="pedido-unidad">
                              <strong>Unidad:</strong> {unidad ? `${unidad}` : 'Sin asignar'}
                            </div>
                            <div className="pedido-hora">
                              {horaPedido && <span><strong>Hora pedido:</strong> {horaPedido}</span>}
                              {horaAsignacion && <span><strong> | Asignado:</strong> {horaAsignacion}</span>}
                              {esSalidaBase && <span className="salida-base"> (SALIDA DE BASE)</span>}
                            </div>
                            {observaciones && (
                              <div className="pedido-observaciones">
                                <strong>Obs:</strong> {observaciones}
                              </div>
                            )}
                            <div className="pedido-flags">
                              {qse && <span className="flag qse">QSE</span>}
                              {b67 && <span className="flag b67">B67</span>}
                              {conf && <span className="flag conf">CONF</span>}
                            </div>
                            <div className="pedido-estado-texto">
                              <strong>Estado:</strong> {estado}
                            </div>
                          </div>
                          <div className={`pedido-estado ${unidad ? 'asignado' : 'pendiente'}`}>
                            {unidad ? '✅' : '⏳'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivosModal;
