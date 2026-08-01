import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;

const ICONOS = ['🥤','🍺','🧃','🧋','☕','🍵','🫖','🥛','🧉','🍾','🍕','🍔','🌭','🥪','🥙','🧆','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🥟','🫔','🌮','🌯','🥗','🧀','🥞','🍰','🧁','🍩','🍪','🍫','🍬','🍭','🍡','🍦','🍧','🍨','🍏','🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥝','🍅','🧂','🫒','🍿','🥜','🫘','🍫'];

const LS = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed !== null && parsed !== undefined) return parsed;
      }
    } catch (_) {}
    return fallback;
  },
  set: (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  },
  has: (key) => localStorage.getItem(key) !== null
};

export default function Productos() {
  const [productos, setProductosState] = useState(() => LS.has('la7_productos_directos')
    ? LS.get('la7_productos_directos', [])
    : []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getBlankForm());
  const [showIconPicker, setShowIconPicker] = useState(false);

  function getBlankForm() {
    return { nombre: '', categoria: '', precio: '', costo_directo: '', icono: '📦', stock_actual: '', stock_minimo: '', activo: true };
  }

  const setProductos = (data) => {
    LS.set('la7_productos_directos', data);
    setProductosState(data);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      if (!LS.has('la7_productos_directos')) {
        const data = await api.productos.getAll();
        if (Array.isArray(data)) setProductos(data);
      }
    } catch (err) {
      console.warn('API no disponible, usando caché local:', err);
    } finally {
      setLoading(false);
    }
  };

  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))];

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'Todas' || p.categoria === filterCat;
    return matchSearch && matchCat;
  });

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingId(prod.id);
      setForm({ nombre: prod.nombre, categoria: prod.categoria || '', precio: prod.precio, costo_directo: prod.costo_directo ?? '', icono: prod.icono || '📦', stock_actual: prod.stock_actual ?? '', stock_minimo: prod.stock_minimo ?? '', activo: prod.activo ?? true });
    } else {
      setEditingId(null);
      setForm(getBlankForm());
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      precio: Number(form.precio),
      costo_directo: form.costo_directo !== '' ? Number(form.costo_directo) : null,
      stock_actual: form.stock_actual !== '' ? Number(form.stock_actual) : null,
      stock_minimo: form.stock_minimo !== '' ? Number(form.stock_minimo) : null,
    };
    try {
      if (editingId) {
        const updated = await api.productos.update(editingId, payload).catch(() => ({ ...payload, id: editingId }));
        setProductos(productos.map(p => p.id === editingId ? { ...updated, id: editingId } : p));
      } else {
        const created = await api.productos.create(payload).catch(() => ({ ...payload, id: Date.now() }));
        setProductos([...productos, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await api.productos.delete(id).catch(() => {});
      setProductos(productos.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleActivo = async (prod) => {
    const updated = { ...prod, activo: !prod.activo };
    try {
      await api.productos.update(prod.id, updated).catch(() => {});
      setProductos(productos.map(p => p.id === prod.id ? updated : p));
    } catch (err) { console.error(err); }
  };

  const margen = (prod) => {
    if (!prod.costo_directo || prod.precio <= 0) return null;
    return ((prod.precio - prod.costo_directo) / prod.precio) * 100;
  };

  return (
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.25rem', padding: '0.5rem' }}>
      {/* Header */}
      <div className="flex flex-col-mobile justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>🛒</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Productos de Reventa</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Bebidas, snacks y productos de venta directa</p>
          </div>
        </div>
        <button className="primary flex items-center gap-2 w-full-mobile" onClick={() => handleOpenModal()} style={{ padding: '0.75rem 1.25rem' }}>
          <PlusIcon /> Agregar Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              className={filterCat === cat ? 'primary' : 'ghost'}
              onClick={() => setFilterCat(cat)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card flex-col gap-4" style={{ flex: 1, padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio Venta</th>
                <th>Costo Directo</th>
                <th>Margen</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="empty-state">Cargando productos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="flex-col items-center gap-3" style={{ color: 'var(--muted)' }}>
                      <span style={{ fontSize: '3rem' }}>🛒</span>
                      <p style={{ fontSize: '1rem', fontWeight: 600 }}>No hay productos de reventa registrados</p>
                      <button className="primary" onClick={() => handleOpenModal()} style={{ marginTop: '0.5rem' }}>
                        <PlusIcon /> Agregar primer producto
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(prod => {
                  const m = margen(prod);
                  const stockBajo = prod.stock_actual != null && prod.stock_minimo != null && prod.stock_actual <= prod.stock_minimo;
                  return (
                    <tr key={prod.id} style={{ opacity: prod.activo === false ? 0.5 : 1 }}>
                      <td style={{ fontSize: '1.5rem', textAlign: 'center', width: '50px' }}>{prod.icono || '📦'}</td>
                      <td style={{ fontWeight: 700 }}>{prod.nombre}</td>
                      <td>
                        {prod.categoria ? (
                          <span className="badge info">{prod.categoria}</span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan)' }}>{formatCLP(prod.precio)}</td>
                      <td className="mono">
                        {prod.costo_directo != null ? formatCLP(prod.costo_directo) : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td>
                        {m != null ? (
                          <span className={`badge ${m >= 30 ? 'success' : m >= 15 ? 'warning' : 'danger'}`}>
                            {m.toFixed(1)}%
                          </span>
                        ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td>
                        {prod.stock_actual != null ? (
                          <span className={`badge ${stockBajo ? 'danger' : 'success'}`}>
                            {prod.stock_actual} {stockBajo ? '⚠️' : ''}
                          </span>
                        ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleActivo(prod)}
                          style={{
                            padding: '0.2rem 0.6rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            backgroundColor: prod.activo !== false ? 'var(--green-dim)' : 'var(--surface-3)',
                            color: prod.activo !== false ? 'var(--green-text)' : 'var(--muted)'
                          }}
                        >
                          {prod.activo !== false ? '✓ Activo' : '✕ Inactivo'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-1">
                          <button className="secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleOpenModal(prod)}>
                            <EditIcon />
                          </button>
                          <button className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(prod.id)}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Stats footer */}
        {productos.length > 0 && (
          <div className="flex gap-4 flex-wrap p-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{productos.length}</strong> productos
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--green)' }}>{productos.filter(p => p.activo !== false).length}</strong> activos
            </span>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-3" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {editingId ? 'Editar Producto' : 'Nuevo Producto de Reventa'}
            </h3>

            <form onSubmit={handleSave} className="flex-col gap-3">
              <div className="flex items-end gap-3">
                <div className="form-group mb-0" style={{ width: '70px', flexShrink: 0 }}>
                  <label>Ícono</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    style={{ fontSize: '1.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.4rem', cursor: 'pointer', width: '100%' }}
                  >
                    {form.icono}
                  </button>
                </div>
                <div className="form-group mb-0" style={{ flex: 1 }}>
                  <label>Nombre del Producto *</label>
                  <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Coca Cola 500ml..." />
                </div>
              </div>

              {showIconPicker && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {ICONOS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { setForm({ ...form, icono: icon }); setShowIconPicker(false); }}
                      style={{ fontSize: '1.3rem', background: form.icono === icon ? 'var(--cyan-glow)' : 'transparent', border: '1px solid transparent', borderRadius: '4px', padding: '0.2rem', cursor: 'pointer' }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Categoría</label>
                  <input type="text" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Ej. Bebidas..." />
                </div>
                <div className="form-group mb-0">
                  <label>Precio Venta ($) *</label>
                  <input type="number" required min="1" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="1500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Costo Directo ($)</label>
                  <input type="number" min="0" value={form.costo_directo} onChange={e => setForm({ ...form, costo_directo: e.target.value })} placeholder="800" />
                </div>
                <div className="form-group mb-0">
                  <label>Stock Actual</label>
                  <input type="number" min="0" step="0.1" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} placeholder="24" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input type="checkbox" id="activo-check" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ width: '18px', height: '18px', minHeight: 'auto' }} />
                <label htmlFor="activo-check" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Producto activo (visible en POS)</label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary flex-1">{editingId ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
