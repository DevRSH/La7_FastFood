import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

const mockClientes = [];
const mockRecompensas = [];

export default function Clientes() {
  const [activeTab, setActiveTab] = useState('directorio'); // 'directorio' | 'recompensas'
  const [clientes, setClientes] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [clienteModal, setClienteModal] = useState({ isOpen: false, data: null });
  const [historialModal, setHistorialModal] = useState({ isOpen: false, cliente: null, history: null });
  const [recompensaModal, setRecompensaModal] = useState({ isOpen: false, data: null });

  // Form states
  const [clienteForm, setClienteForm] = useState({ nombre: '', telefono: '', direccion: '', puntos_acumulados: 0 });
  const [recompensaForm, setRecompensaForm] = useState({ nombre: '', costo_puntos: 50, descripcion: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clientsData = await api.clientes.getAll().catch(() => []);
      setClientes(Array.isArray(clientsData) ? clientsData : []);

      const rewardsData = await api.recompensas.getAll().catch(() => []);
      setRecompensas(Array.isArray(rewardsData) ? rewardsData : []);
    } catch (err) {
      console.error('Error cargando datos de clientes:', err);
    }
  };

  const filteredClientes = clientes.filter(c => 
    (c.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.telefono || '').includes(search) ||
    (c.direccion || '').toLowerCase().includes(search.toLowerCase())
  );

  // --- CRUD CLIENTES ---
  const handleOpenClienteModal = (cliente = null) => {
    if (cliente) {
      setClienteModal({ isOpen: true, data: cliente });
      setClienteForm({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        puntos_acumulados: cliente.puntos_acumulados || cliente.puntos || 0
      });
    } else {
      setClienteModal({ isOpen: true, data: null });
      setClienteForm({ nombre: '', telefono: '+569', direccion: '', puntos_acumulados: 0 });
    }
  };

  const handleSaveCliente = async (e) => {
    e.preventDefault();
    if (!clienteForm.nombre.trim() || !clienteForm.telefono.trim()) {
      alert('El Nombre y Teléfono son obligatorios.');
      return;
    }

    try {
      if (clienteModal.data) {
        // Update existing
        await api.clientes.update(clienteModal.data.id, clienteForm).catch(() => {});
        setClientes(clientes.map(c => c.id === clienteModal.data.id ? { ...c, ...clienteForm } : c));
      } else {
        // Create new
        const created = await api.clientes.create(clienteForm).catch(() => ({
          id: Date.now(),
          ...clienteForm,
          total_gastado: 0,
          total_compras: 0,
          ultima_compra: 'Nunca'
        }));
        setClientes([...clientes, created]);
      }
      setClienteModal({ isOpen: false, data: null });
    } catch (err) {
      console.error(err);
      alert('Error guardando el cliente.');
    }
  };

  const handleDeleteCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    try {
      await api.clientes.delete(id).catch(() => {});
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // --- HISTORIAL & PUNTOS ---
  const openHistorial = async (cliente) => {
    try {
      const history = await api.clientes.getHistorial(cliente.id).catch(() => ([
        { fecha: new Date().toISOString(), descripcion: 'Compra en POS #T-0012', puntos: 45, saldo_resultante: (cliente.puntos_acumulados || 0) },
        { fecha: new Date().toISOString(), descripcion: 'Bonus Registro Cliente', puntos: 100, saldo_resultante: 100 },
      ]));
      setHistorialModal({ isOpen: true, cliente, history: Array.isArray(history) ? history : [] });
    } catch (err) {
      console.error(err);
    }
  };

  // --- RECOMPENSAS CRUD ---
  const handleOpenRecompensaModal = (rec = null) => {
    if (rec) {
      setRecompensaModal({ isOpen: true, data: rec });
      setRecompensaForm({
        nombre: rec.nombre || '',
        costo_puntos: rec.costo_puntos || rec.puntos || 50,
        descripcion: rec.descripcion || ''
      });
    } else {
      setRecompensaModal({ isOpen: true, data: null });
      setRecompensaForm({ nombre: '', costo_puntos: 50, descripcion: '' });
    }
  };

  const handleSaveRecompensa = async (e) => {
    e.preventDefault();
    if (!recompensaForm.nombre.trim()) return;

    try {
      if (recompensaModal.data) {
        await api.recompensas.update(recompensaModal.data.id, recompensaForm).catch(() => {});
        setRecompensas(recompensas.map(r => r.id === recompensaModal.data.id ? { ...r, ...recompensaForm } : r));
      } else {
        const created = await api.recompensas.create(recompensaForm).catch(() => ({ id: Date.now(), ...recompensaForm }));
        setRecompensas([...recompensas, created]);
      }
      setRecompensaModal({ isOpen: false, data: null });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecompensa = async (id) => {
    if (!window.confirm('¿Eliminar esta recompensa del catálogo?')) return;
    try {
      await api.recompensas.delete(id).catch(() => {});
      setRecompensas(recompensas.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-col animate-slide-up" style={{ gap: '1.5rem', width: '100%' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>👥</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Directorio & Mantenedor de Clientes</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Gestión de teléfonos, direcciones, fidelización y puntos acumulados</p>
          </div>
        </div>

        {activeTab === 'directorio' ? (
          <button className="primary flex items-center gap-2" style={{ padding: '0.75rem 1.5rem' }} onClick={() => handleOpenClienteModal()}>
            ➕ Nuevo Cliente
          </button>
        ) : (
          <button className="primary flex items-center gap-2" style={{ padding: '0.75rem 1.5rem' }} onClick={() => handleOpenRecompensaModal()}>
            🎁 Nueva Recompensa
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        <button
          className={activeTab === 'directorio' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('directorio')}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)' }}
        >
          👤 Directorio de Clientes ({clientes.length})
        </button>
        <button
          className={activeTab === 'recompensas' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('recompensas')}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)' }}
        >
          ⭐ Catálogo de Recompensas ({recompensas.length})
        </button>
      </div>

      {/* TAB 1: DIRECTORIO DE CLIENTES */}
      {activeTab === 'directorio' && (
        <div className="card flex-col gap-4" style={{ width: '100%' }}>
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, teléfono (+569...) o dirección..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: '450px', padding: '0.65rem 1rem' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Mostrando <strong>{filteredClientes.length}</strong> clientes registrados
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Celular / Teléfono</th>
                  <th>Dirección de Despacho</th>
                  <th style={{ textAlign: 'center' }}>Puntaje Acumulado</th>
                  <th style={{ textAlign: 'right' }}>Total Gastado</th>
                  <th style={{ textAlign: 'center' }}>Compras</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(c => {
                  const pts = c.puntos_acumulados ?? c.puntos ?? 0;
                  const gastado = c.total_gastado ?? c.totalGastado ?? 0;
                  const nCompras = c.total_compras ?? c.compras ?? 0;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--cyan)' }}>{c.telefono}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {c.direccion || <span style={{ color: 'var(--muted)', italic: 'true' }}>Sin dirección registrada</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge warning" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                          ⭐ {pts} pts
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCLP(gastado)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{nCompras}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }} title="Ver Historial" onClick={() => openHistorial(c)}>
                            📜 Historial
                          </button>
                          <button className="secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }} title="Editar Cliente" onClick={() => handleOpenClienteModal(c)}>
                            ✏️ Editar
                          </button>
                          <button className="danger" style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }} title="Eliminar Cliente" onClick={() => handleDeleteCliente(c.id)}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClientes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">No se encontraron clientes con el criterio de búsqueda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO DE RECOMPENSAS */}
      {activeTab === 'recompensas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ width: '100%' }}>
          {recompensas.map(r => {
            const cost = r.costo_puntos ?? r.puntos ?? 0;
            return (
              <div key={r.id} className="card flex-col justify-between gap-3 p-4" style={{ border: '1px solid var(--border)' }}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{r.nombre}</h3>
                    <span className="badge warning" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                      ⭐ {cost} pts
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.descripcion}</p>
                </div>
                
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <button className="secondary flex-1" onClick={() => handleOpenRecompensaModal(r)}>
                    ✏️ Editar
                  </button>
                  <button className="danger flex-1" onClick={() => handleDeleteRecompensa(r.id)}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {clienteModal.isOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '450px', padding: '1.75rem', margin: 'auto 0' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {clienteModal.data ? '✏️ Editar Cliente' : '➕ Registrar Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSaveCliente} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre Completo del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={clienteForm.nombre}
                  onChange={e => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Celular / Teléfono *</label>
                <input
                  type="text"
                  required
                  placeholder="+56912345678"
                  value={clienteForm.telefono}
                  onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Dirección de Despacho (Delivery)</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Providencia 1234, Depto 402"
                  value={clienteForm.direccion}
                  onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Puntaje Acumulado ⭐</label>
                <input
                  type="number"
                  min="0"
                  value={clienteForm.puntos_acumulados}
                  onChange={e => setClienteForm({ ...clienteForm, puntos_acumulados: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setClienteModal({ isOpen: false, data: null })}>
                  Cancelar
                </button>
                <button type="submit" className="primary flex-1">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE PUNTOS & COMPRAS */}
      {historialModal.isOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '550px', padding: '1.75rem', margin: 'auto 0' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Historial: {historialModal.cliente?.nombre}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  📞 {historialModal.cliente?.telefono} {historialModal.cliente?.direccion && `| 📍 ${historialModal.cliente.direccion}`}
                </p>
              </div>
              <span className="badge warning" style={{ fontSize: '1rem', fontWeight: 800 }}>
                ⭐ {historialModal.cliente?.puntos_acumulados || historialModal.cliente?.puntos || 0} pts
              </span>
            </div>

            <div className="flex-col gap-2 overflow-y-auto" style={{ maxHeight: '350px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Movimientos de Puntos y Compras</h4>
              {historialModal.history?.map((mov, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded card" style={{ background: 'var(--surface-2)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{mov.descripcion || 'Movimiento de Puntos'}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(mov.fecha || Date.now()).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                  <span className="mono" style={{ fontWeight: 800, color: mov.puntos >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {mov.puntos >= 0 ? `+${mov.puntos}` : mov.puntos} pts
                  </span>
                </div>
              ))}
              {(!historialModal.history || historialModal.history.length === 0) && (
                <div className="empty-state">No hay movimientos registrados para este cliente.</div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="primary" onClick={() => setHistorialModal({ isOpen: false, cliente: null, history: null })}>
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR RECOMPENSA */}
      {recompensaModal.isOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '450px', padding: '1.75rem', margin: 'auto 0' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {recompensaModal.data ? '✏️ Editar Recompensa' : '🎁 Nueva Recompensa'}
            </h2>
            <form onSubmit={handleSaveRecompensa} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre de la Recompensa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bebida 350ml Gratis"
                  value={recompensaForm.nombre}
                  onChange={e => setRecompensaForm({ ...recompensaForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Costo en Puntos (pts) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={recompensaForm.costo_puntos}
                  onChange={e => setRecompensaForm({ ...recompensaForm, costo_puntos: Number(e.target.value) })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Descripción / Condiciones</label>
                <textarea
                  rows="3"
                  placeholder="Ej: Canjeable por cualquier bebida en lata..."
                  value={recompensaForm.descripcion}
                  onChange={e => setRecompensaForm({ ...recompensaForm, descripcion: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setRecompensaModal({ isOpen: false, data: null })}>
                  Cancelar
                </button>
                <button type="submit" className="primary flex-1">
                  Guardar Recompensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
