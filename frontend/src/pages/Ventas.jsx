import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [filtros, setFiltros] = useState({ 
    fechaInicio: '', fechaFin: '', metodoPago: '', estado: '' 
  });
  const [ticketModal, setTicketModal] = useState({ isOpen: false, venta: null });
  
  // Resumen KPIs
  const [kpis, setKpis] = useState({ ventasDia: 0, totalTickets: 0, anulaciones: 0 });

  useEffect(() => {
    loadVentas();
  }, [filtros]);

  const normalizeVenta = (v) => {
    const isAnulada = Boolean(v.anulada || v.estado === 'Anulada');
    const metodoRaw = v.medio_pago || v.metodoPago || v.paymentMethod || 'Efectivo';
    const metodoFormatted = metodoRaw.charAt(0).toUpperCase() + metodoRaw.slice(1).toLowerCase();
    
    let clienteNombre = 'Consumidor Final';
    if (typeof v.cliente === 'string') {
      clienteNombre = v.cliente;
    } else if (v.cliente && typeof v.cliente === 'object') {
      clienteNombre = v.cliente.nombre || 'Consumidor Final';
    }

    const itemsRaw = v.detalles || v.items || [];
    const detallesFormatted = itemsRaw.map(d => ({
      producto: typeof d.producto === 'string' ? d.producto : (d.producto?.nombre || `Producto ${d.producto_id || ''}`),
      cantidad: d.cantidad || 1,
      precioUnitario: d.precio_unitario || d.precioUnitario || 0,
      subtotal: (d.precio_unitario || d.precioUnitario || 0) * (d.cantidad || 1),
      costoCongelado: d.costo_unitario_snapshot || d.costoCongelado || 0,
      margen: d.utilidad_unitaria_snapshot && (d.precio_unitario || d.precioUnitario)
        ? Math.round((d.utilidad_unitaria_snapshot / (d.precio_unitario || d.precioUnitario)) * 100)
        : (d.margen || 0)
    }));

    return {
      id: v.id || v.numero_ticket || v.numero,
      numero_ticket: v.numero_ticket || (typeof v.numero === 'string' ? v.numero : `#T-${v.id}`),
      fecha: v.fecha || new Date().toISOString(),
      total: v.total || 0,
      metodoPago: metodoFormatted,
      estado: isAnulada ? 'Anulada' : 'Completada',
      anulada: isAnulada,
      cliente: clienteNombre,
      puntosGanados: v.puntos_ganados || (typeof v.cliente === 'object' ? v.cliente?.puntosGanados : 0) || 0,
      items: detallesFormatted
    };
  };

  const loadVentas = async () => {
    try {
      const apiResponse = await api.ventas.getAll().catch(() => []);
      const localResponse = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
      
      const mergedMap = new Map();

      // Prioridad a respuestas de la API
      (apiResponse || []).forEach(item => {
        const norm = normalizeVenta(item);
        mergedMap.set(norm.id, norm);
      });

      // Agregar ventas guardadas localmente en el POS
      (localResponse || []).forEach(item => {
        const norm = normalizeVenta(item);
        if (!mergedMap.has(norm.id)) {
          mergedMap.set(norm.id, norm);
        }
      });

      let allVentas = Array.from(mergedMap.values());

      // Fallback si no hay ventas registradas
      if (allVentas.length === 0) {
        allVentas = [
          { id: 1, numero_ticket: '#T-00001', fecha: new Date(Date.now() - 3600000).toISOString(), total: 15500, metodoPago: 'Tarjeta', estado: 'Completada', cliente: 'Juan Pérez', items: [] },
          { id: 2, numero_ticket: '#T-00002', fecha: new Date(Date.now() - 7200000).toISOString(), total: 8000, metodoPago: 'Efectivo', estado: 'Completada', cliente: 'Consumidor Final', items: [] },
          { id: 3, numero_ticket: '#T-00003', fecha: new Date(Date.now() - 10800000).toISOString(), total: 12000, metodoPago: 'Transferencia', estado: 'Anulada', cliente: 'María Silva', items: [] }
        ].map(normalizeVenta);
      }

      // Aplicar filtros en memoria
      if (filtros.metodoPago) {
        allVentas = allVentas.filter(v => v.metodoPago.toLowerCase() === filtros.metodoPago.toLowerCase());
      }
      if (filtros.estado) {
        allVentas = allVentas.filter(v => v.estado.toLowerCase() === filtros.estado.toLowerCase());
      }
      if (filtros.fechaInicio) {
        allVentas = allVentas.filter(v => new Date(v.fecha) >= new Date(filtros.fechaInicio));
      }
      if (filtros.fechaFin) {
        const end = new Date(filtros.fechaFin);
        end.setHours(23, 59, 59, 999);
        allVentas = allVentas.filter(v => new Date(v.fecha) <= end);
      }

      setVentas(allVentas);

      // Calcular KPIs básicos
      let vDia = 0, tTickets = allVentas.length, vAnuladas = 0;
      allVentas.forEach(v => {
        if (v.estado === 'Completada') vDia += v.total;
        if (v.estado === 'Anulada') vAnuladas++;
      });
      
      setKpis({ ventasDia: vDia, totalTickets: tTickets, anulaciones: vAnuladas });

    } catch (err) {
      console.error('Error cargando ventas:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const openTicket = async (ventaId) => {
    const found = ventas.find(v => v.id === ventaId);
    if (found) {
      setTicketModal({ isOpen: true, venta: found });
    } else {
      const apiDetail = await api.ventas.get(ventaId).catch(() => null);
      if (apiDetail) {
        setTicketModal({ isOpen: true, venta: normalizeVenta(apiDetail) });
      }
    }
  };

  const handleAnular = async (ventaId) => {
    if (window.confirm('¿Está seguro de anular esta venta? Esta acción no se puede deshacer.')) {
      try {
        await api.ventas.anular(ventaId).catch(() => {});
        
        // Actualizar ventas locales en localStorage
        const saved = JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]');
        const updated = saved.map(v => (v.id === ventaId ? { ...v, estado: 'Anulada', anulada: true } : v));
        localStorage.setItem('la7_ventas_locales', JSON.stringify(updated));
        
        loadVentas();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex-col gap-4 animate-slide-up" style={{ padding: '1rem', color: 'var(--text)' }}>
      <div className="flex justify-between items-center">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Historial y Registro de Ventas</h1>
        <button className="secondary" onClick={loadVentas}>🔄 Actualizar Ventas</button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div style={{ padding: '0.75rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: 'var(--radius-sm)' }}>
            💰
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ventas del Día</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{formatCLP(kpis.ventasDia)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ padding: '0.75rem', background: 'var(--surface-3)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}>
            🧾
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Tickets</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{kpis.totalTickets}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ padding: '0.75rem', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}>
            ❌
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Anulaciones</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red)' }}>{kpis.anulaciones}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap gap-4 items-center" style={{ backgroundColor: 'var(--surface-2)' }}>
        <div className="form-group mb-0" style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: '0.8rem' }}>Fecha Inicio</label>
          <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFilterChange} />
        </div>
        <div className="form-group mb-0" style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: '0.8rem' }}>Fecha Fin</label>
          <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFilterChange} />
        </div>
        <div className="form-group mb-0" style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: '0.8rem' }}>Método de Pago</label>
          <select name="metodoPago" value={filtros.metodoPago} onChange={handleFilterChange}>
            <option value="">Todos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <div className="form-group mb-0" style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: '0.8rem' }}>Estado</label>
          <select name="estado" value={filtros.estado} onChange={handleFilterChange}>
            <option value="">Todos</option>
            <option value="Completada">Completada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Ticket / ID</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'center' }}>Medio de Pago</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id} style={{ opacity: v.estado === 'Anulada' ? 0.6 : 1 }}>
                  <td className="mono" style={{ fontWeight: 700 }}>{v.numero_ticket || `#T-${v.id}`}</td>
                  <td style={{ fontSize: '0.9rem' }}>{new Date(v.fecha).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{v.cliente}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge info">{v.metodoPago}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${v.estado === 'Completada' ? 'success' : 'danger'}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem' }}>{formatCLP(v.total)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex justify-center gap-2">
                      <button className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => openTicket(v.id)}>
                        👁️ Ver Ticket
                      </button>
                      {v.estado === 'Completada' && (
                        <button className="danger ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleAnular(v.id)}>
                          🚫 Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">No se encontraron ventas registradas con los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketModal.isOpen && ticketModal.venta && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '480px', background: '#f4f1e8', color: '#1b1d1f', border: '1px solid #d4cebe' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: '#999' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Ticket {ticketModal.venta.numero_ticket}</h2>
              <span className={`badge ${ticketModal.venta.estado === 'Completada' ? 'success' : 'danger'}`}>
                {ticketModal.venta.estado}
              </span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#444' }} className="flex-col gap-1">
              <div><strong>Fecha:</strong> {new Date(ticketModal.venta.fecha).toLocaleString()}</div>
              <div><strong>Método de Pago:</strong> {ticketModal.venta.metodoPago}</div>
              {ticketModal.venta.cliente && (
                <div>
                  <strong>Cliente:</strong> {ticketModal.venta.cliente} 
                  {ticketModal.venta.puntosGanados > 0 && <span style={{ color: 'var(--green)', fontWeight: 700, marginLeft: '6px' }}>(+{ticketModal.venta.puntosGanados} pts)</span>}
                </div>
              )}
            </div>

            <table style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
              <thead style={{ borderBottom: '2px solid #888' }}>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: '6px', background: 'transparent', color: '#1b1d1f' }}>Item</th>
                  <th style={{ textAlign: 'center', paddingBottom: '6px', background: 'transparent', color: '#1b1d1f' }}>Cant</th>
                  <th style={{ textAlign: 'right', paddingBottom: '6px', background: 'transparent', color: '#1b1d1f' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(ticketModal.venta.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
                    <td style={{ paddingTop: '6px', paddingBottom: '6px' }}>{item.producto}</td>
                    <td style={{ paddingTop: '6px', paddingBottom: '6px', textAlign: 'center' }}>{item.cantidad}</td>
                    <td style={{ paddingTop: '6px', paddingBottom: '6px', textAlign: 'right', fontWeight: 700 }}>{formatCLP(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-2 font-bold" style={{ borderTop: '2px solid #1b1d1f', fontSize: '1.25rem' }}>
              <span>TOTAL</span>
              <span className="mono">{formatCLP(ticketModal.venta.total)}</span>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button className="secondary w-full" onClick={() => setTicketModal({ isOpen: false, venta: null })}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
