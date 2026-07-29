import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

// SVG Icons
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

// localStorage helpers
const LS = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return fallback;
  },
  set: (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }
};

const mockUtensilios = [];
const mockPackaging = [];
const mockCategorias = [
  { id: 1, nombre: 'Hamburguesas', color: '#0284c7', orden: 1 }
];

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('general');

  // Data lists — cargados desde localStorage, limpiando datos de desarrollo viejos
  const [utensilios, setUtensiliosState] = useState(() => {
    const DEV_NAMES = ['Horno Industrial 4 Bandejas','Freidora El\u00e9ctrica 10L','Plancha Churrasquera a Gas','Olla Inox 20L'];
    const stored = LS.get('la7_utensilios', null);
    if (stored && stored.length > 0 && stored.every(u => DEV_NAMES.includes(u.nombre))) {
      localStorage.removeItem('la7_utensilios');
      return [];
    }
    return stored || [];
  });
  const [packagingList, setPackagingState] = useState(() => {
    const DEV_NAMES = ['Bolsa de papel craft','Caja hamburguesa compostable','Servilletas (pack 2 un)','Vaso polipapel 500ml'];
    const stored = LS.get('la7_packaging', null);
    if (stored && stored.length > 0 && stored.every(p => DEV_NAMES.includes(p.nombre))) {
      localStorage.removeItem('la7_packaging');
      return [];
    }
    return stored || [];
  });
  const [categorias, setCategoriasState] = useState(() => {
    const DEV_NAMES = ['Hamburguesas','Empanadas & Salado','Papas & Acompa\u00f1amientos','Bebidas','Postres'];
    const stored = LS.get('la7_categorias', null);
    // Si tiene los 5 mocks de desarrollo, reemplazar por solo 1 ejemplo
    if (stored && stored.length === 5 && stored.every(c => DEV_NAMES.includes(c.nombre))) {
      const clean = [{ id: 1, nombre: 'Hamburguesas', color: '#0284c7', orden: 1 }];
      LS.set('la7_categorias', clean);
      return clean;
    }
    return stored || [{ id: 1, nombre: 'Hamburguesas', color: '#0284c7', orden: 1 }];
  });

  // Wrappers que persisten automáticamente
  const setUtensilios = (data) => { LS.set('la7_utensilios', data); setUtensiliosState(data); };
  const setPackagingList = (data) => { LS.set('la7_packaging', data); setPackagingState(data); };
  const setCategorias = (data) => { LS.set('la7_categorias', data); setCategoriasState(data); };

  // General Settings State
  const [generalConfig, setGeneralConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('la7_config');
      if (saved) return { nombre_negocio: 'La 7 FastFood', pin_acceso: '1234', valor_hora_trabajo: 3500, comision_plataforma_pct: 0, reparto_tipo: 'ninguno', reparto_valor: 0, ...JSON.parse(saved) };
    } catch (_) {}
    return { nombre_negocio: 'La 7 FastFood', pin_acceso: '1234', valor_hora_trabajo: 3500, comision_plataforma_pct: 0, reparto_tipo: 'ninguno', reparto_valor: 0 };
  });

  // Modal States
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
    // Intentar sincronizar con backend sin sobreescribir datos locales si la API falla
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const uData = await api.utensilios.getAll().catch(() => null);
      if (Array.isArray(uData) && uData.length > 0) setUtensilios(uData);

      const pData = await api.packaging.getAll().catch(() => null);
      if (Array.isArray(pData) && pData.length > 0) setPackagingList(pData);

      const catData = await api.config?.getCategorias?.().catch(() => null);
      if (Array.isArray(catData) && catData.length > 0) setCategorias(catData);

      const cData = await api.config?.get?.().catch(() => null);
      if (cData && typeof cData === 'object') {
        setGeneralConfig(prev => ({ ...prev, ...cData }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- UTENSILIOS CRUD ---
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

  // --- PACKAGING CRUD ---
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

  // --- CATEGORIAS CRUD ---
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

  // --- GENERAL CONFIG ---
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      await api.config?.update?.(generalConfig).catch(() => {});
      localStorage.setItem('la7_config', JSON.stringify(generalConfig));
      localStorage.setItem('la7_pin', generalConfig.pin_acceso);
      alert('✅ Parámetros de configuración guardados correctamente.');
    } catch (err) {
      console.error(err);
      localStorage.setItem('la7_config', JSON.stringify(generalConfig));
      alert('✅ Parámetros de configuración guardados en modo local.');
    }
  };

  const costoPorHoraCalculado = (costo, horas) => (horas > 0 ? costo / horas : 0);

  return (
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>⚙️</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Configuración del Sistema &amp; Parámetros</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Personaliza todos los datos del negocio, seguridad, tarifas y catálogos maestros</p>
          </div>
        </div>

        {activeTab === 'utensilios' && (
          <button onClick={() => handleOpenUtensilioModal()} className="primary">
            <PlusIcon /> Agregar Equipamiento
          </button>
        )}
        {activeTab === 'packaging' && (
          <button onClick={() => handleOpenPackagingModal()} className="primary">
            <PlusIcon /> Agregar Packaging
          </button>
        )}
        {activeTab === 'categorias' && (
          <button onClick={() => handleOpenCategoriaModal()} className="primary">
            <PlusIcon /> Agregar Categoría
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ borderBottom: '2px solid var(--border-light)' }}>
        <button
          className={activeTab === 'general' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('general')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '0.75rem 1.25rem' }}
        >
          ⚙️ Parámetros &amp; Seguridad
        </button>
        <button
          className={activeTab === 'utensilios' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('utensilios')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '0.75rem 1.25rem' }}
        >
          🔪 Equipamiento Maestro ({utensilios.length})
        </button>
        <button
          className={activeTab === 'packaging' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('packaging')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '0.75rem 1.25rem' }}
        >
          📦 Packaging Maestro ({packagingList.length})
        </button>
        <button
          className={activeTab === 'categorias' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('categorias')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '0.75rem 1.25rem' }}
        >
          🏷️ Categorías de Productos ({categorias.length})
        </button>
      </div>

      {/* TAB 1: GENERAL & SEGURIDAD */}
      {activeTab === 'general' && (
        <div className="card flex-col gap-6" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Personalización del Negocio &amp; Parámetros Base</h2>
          
          <form onSubmit={handleSaveGeneral} className="flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Nombre del Negocio / Local</label>
                <input
                  type="text"
                  value={generalConfig.nombre_negocio}
                  onChange={e => setGeneralConfig({ ...generalConfig, nombre_negocio: e.target.value })}
                />
              </div>

              <div className="form-group">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Valor Hora de Trabajo Personal ($/hr)</label>
                <input
                  type="number"
                  value={generalConfig.valor_hora_trabajo}
                  onChange={e => setGeneralConfig({ ...generalConfig, valor_hora_trabajo: Number(e.target.value) })}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                  Base para mano de obra en recetas.
                </span>
              </div>

              <div className="form-group">
                <label>Comisión Plataforma / Tarjeta (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={generalConfig.comision_plataforma_pct}
                  onChange={e => setGeneralConfig({ ...generalConfig, comision_plataforma_pct: Number(e.target.value) })}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                  Ej. 3.5% Transbank / Redelcom.
                </span>
              </div>
            </div>

            <div className="form-group">
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
              <div className="form-group">
                <label>Valor de Reparto ({generalConfig.reparto_tipo === 'fijo' ? '$' : '%'})</label>
                <input
                  type="number"
                  value={generalConfig.reparto_valor}
                  onChange={e => setGeneralConfig({ ...generalConfig, reparto_valor: Number(e.target.value) })}
                />
              </div>
            )}

            <button type="submit" className="primary" style={{ marginTop: '1rem', width: 'fit-content' }}>
              Guardar Todos los Parámetros
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: UTENSILIOS MAESTRO */}
      {activeTab === 'utensilios' && (
        <div className="card flex-col gap-4" style={{ flex: 1, overflow: 'hidden' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Catálogo Maestro de Equipamiento &amp; Utensilios</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Registra tus hornos, freidoras y planchas una sola vez. En cada receta solo seleccionas el equipo e indicas las horas de uso.</p>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
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
                        {formatCLP(costoPorHoraCalculado(u.costo_compra, u.vida_util_horas))} / hr
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenUtensilioModal(u)}>
                          <EditIcon /> Editar
                        </button>
                        <button className="danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDeleteUtensilio(u.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGING MAESTRO */}
      {activeTab === 'packaging' && (
        <div className="card flex-col gap-4" style={{ flex: 1, overflow: 'hidden' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Catálogo Maestro de Packaging &amp; Materiales</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Define bolsas, cajas y servilletas reutilizables para tus fichas técnicas.</p>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
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
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan)' }}>{formatCLP(p.costo_unitario)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenPackagingModal(p)}>
                          <EditIcon /> Editar
                        </button>
                        <button className="danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDeletePackaging(p.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORÍAS */}
      {activeTab === 'categorias' && (
        <div className="card flex-col gap-4" style={{ flex: 1, overflow: 'hidden' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Categorías de Productos</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Organiza la carta y la grilla de ventas en el POS.</p>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
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
                    <td className="mono" style={{ fontWeight: 700 }}>#{c.orden}</td>
                    <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: c.color, border: '1px solid var(--border)' }}></div>
                        <span className="mono" style={{ fontSize: '0.85rem' }}>{c.color}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenCategoriaModal(c)}>
                          <EditIcon /> Editar
                        </button>
                        <button className="danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDeleteCategoria(c.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES */}
      {isUtensilioModalOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingUtensilioId ? 'Editar Equipamiento' : 'Nuevo Equipamiento'}</h3>
            <form onSubmit={handleSaveUtensilio} className="flex-col gap-4">
              <div className="form-group">
                <label>Nombre del Equipo</label>
                <input type="text" required value={utensilioForm.nombre} onChange={e => setUtensilioForm({ ...utensilioForm, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Costo Compra ($)</label>
                  <input type="number" required min="0" value={utensilioForm.costo_compra} onChange={e => setUtensilioForm({ ...utensilioForm, costo_compra: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Vida Útil (Horas)</label>
                  <input type="number" required min="1" value={utensilioForm.vida_util_horas} onChange={e => setUtensilioForm({ ...utensilioForm, vida_util_horas: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="secondary" onClick={() => setIsUtensilioModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary">Guardar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPackagingModalOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingPackagingId ? 'Editar Packaging' : 'Nuevo Packaging'}</h3>
            <form onSubmit={handleSavePackaging} className="flex-col gap-4">
              <div className="form-group">
                <label>Nombre del Material</label>
                <input type="text" required value={packagingForm.nombre} onChange={e => setPackagingForm({ ...packagingForm, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Costo Unitario ($)</label>
                <input type="number" required min="0" value={packagingForm.costo_unitario} onChange={e => setPackagingForm({ ...packagingForm, costo_unitario: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="secondary" onClick={() => setIsPackagingModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary">Guardar Packaging</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoriaModalOpen && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingCategoriaId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <form onSubmit={handleSaveCategoria} className="flex-col gap-4">
              <div className="form-group">
                <label>Nombre de Categoría</label>
                <input type="text" required value={categoriaForm.nombre} onChange={e => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Color</label>
                  <input type="color" value={categoriaForm.color} onChange={e => setCategoriaForm({ ...categoriaForm, color: e.target.value })} style={{ height: '45px', padding: '2px' }} />
                </div>
                <div className="form-group">
                  <label>Orden</label>
                  <input type="number" value={categoriaForm.orden} onChange={e => setCategoriaForm({ ...categoriaForm, orden: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="secondary" onClick={() => setIsCategoriaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary">Guardar Categoría</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
