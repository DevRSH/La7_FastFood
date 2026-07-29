import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

// SVG Icons
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;

const ICONOS = ['🥤','🍺','🧃','🧋','☕','🍵','🫖','🥛','🧉','🍾','🍕','🍔','🌭','🥪','🥙','🧆','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🥟','🫔','🌮','🌯','🥗','🧀','🥞','🍰','🧁','🍩','🍪','🍫','🍬','🍭','🍡','🍦','🍧','🍨','🍏','🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥝','🍅','🧂','🫒','🍿','🥜','🫘','🍫'];

const LS = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return fallback;
  },
  set: (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }
};

export default function Productos() {
  const [productos, setProductosState] = useState(() => LS.get('la7_productos_directos', []));
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

  // Wrapper que persiste en localStorage automáticamente
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
      const data = await api.productos.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setProductos(data);
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
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>🛒</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Productos de Reventa</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Bebidas, snacks y productos que se venden directamente sin elaboración propia</p>
          </div>
        </div>
        <button className="primary flex items-center gap-2" onClick={() => handleOpenModal()} style={{ padding: '0.75rem 1.5rem' }}>
          <PlusIcon /> Agregar Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
        <div className="flex gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              className={filterCat === cat ? 'primary' : 'ghost'}
              onClick={() => setFilterCat(cat)}
              style={{ padding: '0.5rem 1rem', borderRadius: '2rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card flex-col gap-4" style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
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
                      <p style={{ fontSize: '0.875rem' }}>Agrega tus bebidas, snacks o productos que vendes sin elaborar.</p>
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
                      <td style={{ fontSize: '1.75rem', textAlign: 'center', width: '60px' }}>{prod.icono || '📦'}</td>
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
                            padding: '0.25rem 0.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            backgroundColor: prod.activo !== false ? 'var(--green-glow)' : 'var(--surface-3)',
                            color: prod.activo !== false ? 'var(--green)' : 'var(--muted)'
                          }}
                        >
                          {prod.activo !== false ? '✓ Activo' : '✕ Inactivo'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenModal(prod)}>
                            <EditIcon /> Editar
                          </button>
                          <button className="danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(prod.id)}>
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
          <div className="flex gap-4 flex-wrap" style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{productos.length}</strong> productos registrados
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--green)' }}>{productos.filter(p => p.activo !== false).length}</strong> activos
            </span>
            {productos.filter(p => p.stock_actual != null && p.stock_minimo != null && p.stock_actual <= p.stock_minimo).length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--red)' }}>
                ⚠️ <strong>{productos.filter(p => p.stock_actual != null && p.stock_minimo != null && p.stock_actual <= p.stock_minimo).length}</strong> con stock bajo
              </span>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {editingId ? 'Editar Producto' : 'Nuevo Producto de Reventa'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '-0.5rem' }}>
              Para bebidas, snacks y productos que vendes sin elaborar (compras ya listos para vender).
            </p>

            <form onSubmit={handleSave} className="flex-col gap-4">
              {/* Ícono + Nombre */}
              <div className="flex items-end gap-3">
                <div className="form-group" style={{ width: '80px', flexShrink: 0 }}>
                  <label>Ícono</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    style={{ fontSize: '2rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', cursor: 'pointer', width: '100%' }}
                  >
                    {form.icono}
                  </button>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nombre del Producto *</label>
                  <input type="text" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Coca Cola 500ml, Jugo Watts..." />
                </div>
              </div>

              {/* Icon Picker */}
              {showIconPicker && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {ICONOS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { setForm({ ...form, icono: icon }); setShowIconPicker(false); }}
                      style={{ fontSize: '1.5rem', background: form.icono === icon ? 'var(--cyan-glow)' : 'transparent', border: '1px solid transparent', borderRadius: '6px', padding: '0.2rem', cursor: 'pointer' }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Categoría</label>
                  <input type="text" list="cats-list" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Ej. Bebidas, Snacks..." />
                  <datalist id="cats-list">
                    {Array.from(new Set(productos.map(p => p.categoria).filter(Boolean))).map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Precio de Venta ($) *</label>
                  <input type="number" required min="1" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="1500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Costo Directo ($)</label>
                  <input type="number" min="0" value={form.costo_directo} onChange={e => setForm({ ...form, costo_directo: e.target.value })} placeholder="800" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem', display: 'block' }}>Lo que pagas al proveedor por unidad</span>
                </div>
                <div className="form-group">
                  <label>Margen Estimado</label>
                  <div style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1.1rem', color: (() => { const m = form.precio && form.costo_directo ? ((form.precio - form.costo_directo) / form.precio) * 100 : null; return m == null ? 'var(--muted)' : m >= 30 ? 'var(--green)' : m >= 15 ? '#f59e0b' : 'var(--red)'; })() }}>
                    {form.precio && form.costo_directo ? `${(((form.precio - form.costo_directo) / form.precio) * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input type="number" min="0" step="0.1" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} placeholder="24" />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo (alerta)</label>
                  <input type="number" min="0" step="0.1" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} placeholder="6" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo-check" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="activo-check" style={{ cursor: 'pointer', userSelect: 'none' }}>Producto activo (visible en el POS)</label>
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary">{editingId ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
