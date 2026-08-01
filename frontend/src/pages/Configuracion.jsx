import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

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

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('general');

  const [utensilios, setUtensiliosState] = useState(() => {
    if (LS.has('la7_utensilios')) {
      const stored = LS.get('la7_utensilios', []);
      const DEV_NAMES = ['Horno Industrial 4 Bandejas','Freidora Eléctrica 10L','Plancha Churrasquera a Gas','Olla Inox 20L'];
      if (stored.length > 0 && stored.every(u => DEV_NAMES.includes(u.nombre))) {
        LS.set('la7_utensilios', []);
        return [];
      }
      return stored;
    }
    return [];
  });
  
  const [packagingList, setPackagingState] = useState(() => {
    if (LS.has('la7_packaging')) {
      const stored = LS.get('la7_packaging', []);
      const DEV_NAMES = ['Bolsa de papel craft','Caja hamburguesa compostable','Servilletas (pack 2 un)','Vaso polipapel 500ml'];
      if (stored.length > 0 && stored.every(p => DEV_NAMES.includes(p.nombre))) {
        LS.set('la7_packaging', []);
        return [];
      }
      return stored;
    }
    return [];
  });

  const [categorias, setCategoriasState] = useState(() => {
    if (LS.has('la7_categorias')) {
      const stored = LS.get('la7_categorias', []);
      const DEV_NAMES = ['Hamburguesas','Empanadas & Salado','Papas & Acompañamientos','Bebidas','Postres'];
      if (stored.length === 5 && stored.every(c => DEV_NAMES.includes(c.nombre))) {
        const clean = [];
        LS.set('la7_categorias', clean);
        return clean;
      }
      return stored;
    }
    return [];
  });

  const setUtensilios = (data) => { LS.set('la7_utensilios', data); setUtensiliosState(data); };
  const setPackagingList = (data) => { LS.set('la7_packaging', data); setPackagingState(data); };
  const setCategorias = (data) => { LS.set('la7_categorias', data); setCategoriasState(data); };

  const [generalConfig, setGeneralConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('la7_config');
      if (saved) return { nombre_negocio: 'La 7 FastFood', pin_acceso: '1234', valor_hora_trabajo: 3500, comision_plataforma_pct: 0, reparto_tipo: 'ninguno', reparto_valor: 0, ...JSON.parse(saved) };
    } catch (_) {}
    return { nombre_negocio: 'La 7 FastFood', pin_acceso: '1234', valor_hora_trabajo: 3500, comision_plataforma_pct: 0, reparto_tipo: 'ninguno', reparto_valor: 0 };
  });

  const [isUtensilioModalOpen, setIsUtensilioModalOpen] = useState(false);
  const [editingUtensilioId, setEditingUtensilioId] = useState(null);
  const [utensilioForm, setUtensilioForm] = useState({ nombre: '', costo_compra: 0, vida_util_horas: 1000 });

  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false);
  const [editingPackagingId, setEditingPackagingId] = useState(null);
  const [packagingForm, setPackagingForm] = useState({ nombre: '', costo_unitario: 0 });

  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', color: '#0284c7', orden: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!LS.has('la7_utensilios')) {
        const uData = await api.utensilios.getAll().catch(() => null);
        if (Array.isArray(uData)) setUtensilios(uData);
      }

      if (!LS.has('la7_packaging')) {
        const pData = await api.packaging.getAll().catch(() => null);
        if (Array.isArray(pData)) setPackagingList(pData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenUtensilioModal = (ut = null) => {
    if (ut) {
      setEditingUtensilioId(ut.id);
      setUtensilioForm({ nombre: ut.nombre, costo_compra: ut.costo_compra, vida_util_horas: ut.vida_util_horas });
    } else {
      setEditingUtensilioId(null);
      setUtensilioForm({ nombre: '', costo_compra: 0, vida_util_horas: 1000 });
    }
    setIsUtensilioModalOpen(true);
  };

  const handleSaveUtensilio = async (e) => {
    e.preventDefault();
    if (!utensilioForm.nombre.trim()) return;
    try {
      if (editingUtensilioId) {
        const updated = await api.utensilios.update(editingUtensilioId, utensilioForm).catch(() => ({ ...utensilioForm, id: editingUtensilioId }));
        setUtensilios(utensilios.map(u => u.id === editingUtensilioId ? updated : u));
      } else {
        const created = await api.utensilios.create(utensilioForm).catch(() => ({ ...utensilioForm, id: Date.now() }));
        setUtensilios([...utensilios, created]);
      }
      setIsUtensilioModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteUtensilio = async (id) => {
    if (!window.confirm('¿Eliminar este equipo del catálogo maestro?')) return;
    try {
      await api.utensilios.delete(id).catch(() => {});
      setUtensilios(utensilios.filter(u => u.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleOpenPackagingModal = (p = null) => {
    if (p) {
      setEditingPackagingId(p.id);
      setPackagingForm({ nombre: p.nombre, costo_unitario: p.costo_unitario });
    } else {
      setEditingPackagingId(null);
      setPackagingForm({ nombre: '', costo_unitario: 0 });
    }
    setIsPackagingModalOpen(true);
  };

  const handleSavePackaging = async (e) => {
    e.preventDefault();
    if (!packagingForm.nombre.trim()) return;
    try {
      if (editingPackagingId) {
        const updated = await api.packaging.update(editingPackagingId, packagingForm).catch(() => ({ ...packagingForm, id: editingPackagingId }));
        setPackagingList(packagingList.map(p => p.id === editingPackagingId ? updated : p));
      } else {
        const created = await api.packaging.create(packagingForm).catch(() => ({ ...packagingForm, id: Date.now() }));
        setPackagingList([...packagingList, created]);
      }
      setIsPackagingModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleDeletePackaging = async (id) => {
    if (!window.confirm('¿Eliminar este material de empaque?')) return;
    try {
      await api.packaging.delete(id).catch(() => {});
      setPackagingList(packagingList.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleOpenCategoriaModal = (cat = null) => {
    if (cat) {
      setEditingCategoriaId(cat.id);
      setCategoriaForm({ nombre: cat.nombre, color: cat.color, orden: cat.orden });
    } else {
      setEditingCategoriaId(null);
      setCategoriaForm({ nombre: '', color: '#0284c7', orden: categorias.length + 1 });
    }
    setIsCategoriaModalOpen(true);
  };

  const handleSaveCategoria = async (e) => {
    e.preventDefault();
    if (!categoriaForm.nombre.trim()) return;
    if (editingCategoriaId) {
      setCategorias(categorias.map(c => c.id === editingCategoriaId ? { ...categoriaForm, id: editingCategoriaId } : c));
    } else {
      setCategorias([...categorias, { ...categoriaForm, id: Date.now() }]);
    }
    setIsCategoriaModalOpen(false);
  };

  const handleDeleteCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    setCategorias(categorias.filter(c => c.id !== id));
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      await api.config?.update?.(generalConfig).catch(() => {});
      localStorage.setItem('la7_config', JSON.stringify(generalConfig));
      localStorage.setItem('la7_pin', generalConfig.pin_acceso);
      alert('✅ Parámetros de configuración guardados correctamente.');
    } catch (err) {
      localStorage.setItem('la7_config', JSON.stringify(generalConfig));
      alert('✅ Parámetros de configuración guardados en modo local.');
    }
  };

  const costoPorHoraCalculado = (costo, horas) => (horas > 0 ? costo / horas : 0);

  return (
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.25rem', padding: '0.5rem' }}>
      {/* Header */}
      <div className="flex flex-col-mobile justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>⚙️</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Configuración & Parámetros</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Datos del local, seguridad, tarifas y catálogos maestros</p>
          </div>
        </div>

        {activeTab === 'utensilios' && (
          <button onClick={() => handleOpenUtensilioModal()} className="primary w-full-mobile" style={{ padding: '0.65rem 1rem' }}>
            <PlusIcon /> Agregar Equipamiento
          </button>
        )}
        {activeTab === 'packaging' && (
          <button onClick={() => handleOpenPackagingModal()} className="primary w-full-mobile" style={{ padding: '0.65rem 1rem' }}>
            <PlusIcon /> Agregar Packaging
          </button>
        )}
        {activeTab === 'categorias' && (
          <button onClick={() => handleOpenCategoriaModal()} className="primary w-full-mobile" style={{ padding: '0.65rem 1rem' }}>
            <PlusIcon /> Agregar Categoría
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" style={{ borderBottom: '2px solid var(--border-light)' }}>
        <button
          className={activeTab === 'general' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('general')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          ⚙️ Parámetros & Seguridad
        </button>
        <button
          className={activeTab === 'utensilios' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('utensilios')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          🔪 Equipamiento ({utensilios.length})
        </button>
        <button
          className={activeTab === 'packaging' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('packaging')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          📦 Packaging ({packagingList.length})
        </button>
        <button
          className={activeTab === 'categorias' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('categorias')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          🏷️ Categorías ({categorias.length})
        </button>
      </div>

      {/* TAB 1: GENERAL & SEGURIDAD */}
      {activeTab === 'general' && (
        <div className="card flex-col gap-4" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Personalización del Negocio & Parámetros Base</h2>
          
          <form onSubmit={handleSaveGeneral} className="flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label>Nombre del Negocio / Local</label>
                <input
                  type="text"
                  value={generalConfig.nombre_negocio}
                  onChange={e => setGeneralConfig({ ...generalConfig, nombre_negocio: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label>PIN de Acceso a la App (4 dígitos)</label>
                <input
                  type="password"
                  maxLength={4}
                  className="mono"
                  style={{ letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700 }}
                  value={generalConfig.pin_acceso}
                  onChange={e => setGeneralConfig({ ...generalConfig, pin_acceso: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label>Valor Hora de Trabajo Personal ($/hr)</label>
                <input
                  type="number"
                  value={generalConfig.valor_hora_trabajo}
                  onChange={e => setGeneralConfig({ ...generalConfig, valor_hora_trabajo: Number(e.target.value) })}
                />
              </div>

              <div className="form-group mb-0">
                <label>Comisión Plataforma / Tarjeta (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={generalConfig.comision_plataforma_pct}
                  onChange={e => setGeneralConfig({ ...generalConfig, comision_plataforma_pct: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label>Tipo de Costo de Reparto Predeterminado</label>
              <select
                value={generalConfig.reparto_tipo}
                onChange={e => setGeneralConfig({ ...generalConfig, reparto_tipo: e.target.value })}
              >
                <option value="ninguno">Sin costo de reparto</option>
                <option value="fijo">Monto Fijo por Pedido ($)</option>
                <option value="porcentaje">% sobre Precio de Venta</option>
              </select>
            </div>

            {generalConfig.reparto_tipo !== 'ninguno' && (
              <div className="form-group mb-0">
                <label>Valor de Reparto ({generalConfig.reparto_tipo === 'fijo' ? '$' : '%'})</label>
                <input
                  type="number"
                  value={generalConfig.reparto_valor}
                  onChange={e => setGeneralConfig({ ...generalConfig, reparto_valor: Number(e.target.value) })}
                />
              </div>
            )}

            <button type="submit" className="primary w-full-mobile mt-2" style={{ width: 'fit-content', padding: '0.75rem 1.25rem' }}>
              Guardar Parámetros
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: UTENSILIOS MAESTRO */}
      {activeTab === 'utensilios' && (
        <div className="card flex-col gap-4" style={{ flex: 1, padding: 0 }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Catálogo Maestro de Equipamiento & Utensilios</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Equipo / Utensilio</th>
                  <th>Costo de Compra</th>
                  <th>Vida Útil Estimada</th>
                  <th>Depreciación / Hora</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {utensilios.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.nombre}</td>
                    <td className="mono">{formatCLP(u.costo_compra)}</td>
                    <td className="mono">{u.vida_util_horas.toLocaleString()} hrs</td>
                    <td>
                      <span className="badge info mono">
                        {formatCLP(costoPorHoraCalculado(u.costo_compra, u.vida_util_horas))}/hr
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button className="secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleOpenUtensilioModal(u)}>
                          <EditIcon />
                        </button>
                        <button className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeleteUtensilio(u.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {utensilios.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">No hay equipos registrados en el catálogo maestro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGING MAESTRO */}
      {activeTab === 'packaging' && (
        <div className="card flex-col gap-4" style={{ flex: 1, padding: 0 }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Catálogo Maestro de Packaging & Materiales</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Material de Empaque</th>
                  <th>Costo Unitario ($)</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {packagingList.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                    <td className="mono font-bold" style={{ color: 'var(--cyan)' }}>{formatCLP(p.costo_unitario)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button className="secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleOpenPackagingModal(p)}>
                          <EditIcon />
                        </button>
                        <button className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeletePackaging(p.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packagingList.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-state">No hay materiales de packaging registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORÍAS */}
      {activeTab === 'categorias' && (
        <div className="card flex-col gap-4" style={{ flex: 1, padding: 0 }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Categorías de Productos</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Nombre Categoría</th>
                  <th>Color de Etiqueta</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(c => (
                  <tr key={c.id}>
                    <td className="mono font-bold">#{c.orden}</td>
                    <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c.color, border: '1px solid var(--border)' }}></div>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>{c.color}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button className="secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleOpenCategoriaModal(c)}>
                          <EditIcon />
                        </button>
                        <button className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeleteCategoria(c.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">No hay categorías registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES */}
      {isUtensilioModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingUtensilioId ? 'Editar Equipamiento' : 'Nuevo Equipamiento'}</h3>
            <form onSubmit={handleSaveUtensilio} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre del Equipo</label>
                <input type="text" required value={utensilioForm.nombre} onChange={e => setUtensilioForm({ ...utensilioForm, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Costo Compra ($)</label>
                  <input type="number" required min="0" value={utensilioForm.costo_compra} onChange={e => setUtensilioForm({ ...utensilioForm, costo_compra: Number(e.target.value) })} />
                </div>
                <div className="form-group mb-0">
                  <label>Vida Útil (Horas)</label>
                  <input type="number" required min="1" value={utensilioForm.vida_util_horas} onChange={e => setUtensilioForm({ ...utensilioForm, vida_util_horas: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setIsUtensilioModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPackagingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingPackagingId ? 'Editar Packaging' : 'Nuevo Packaging'}</h3>
            <form onSubmit={handleSavePackaging} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre del Material</label>
                <input type="text" required value={packagingForm.nombre} onChange={e => setPackagingForm({ ...packagingForm, nombre: e.target.value })} />
              </div>
              <div className="form-group mb-0">
                <label>Costo Unitario ($)</label>
                <input type="number" required min="0" value={packagingForm.costo_unitario} onChange={e => setPackagingForm({ ...packagingForm, costo_unitario: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setIsPackagingModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoriaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingCategoriaId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <form onSubmit={handleSaveCategoria} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre de Categoría</label>
                <input type="text" required value={categoriaForm.nombre} onChange={e => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Color</label>
                  <input type="color" value={categoriaForm.color} onChange={e => setCategoriaForm({ ...categoriaForm, color: e.target.value })} style={{ height: '40px', padding: '2px' }} />
                </div>
                <div className="form-group mb-0">
                  <label>Orden</label>
                  <input type="number" value={categoriaForm.orden} onChange={e => setCategoriaForm({ ...categoriaForm, orden: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="secondary flex-1" onClick={() => setIsCategoriaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
