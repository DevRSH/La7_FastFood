import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, formatCLP } from '../api/client';

// SVG Icons
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const ArrowLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const CopyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

// Sin datos de ejemplo — la app arranca limpia
const defaultFichas = [];
const mockInsumosCatalog = [];
const mockUtensiliosCatalog = [];

export default function FichasTecnicas() {
  const [view, setView] = useState('list'); // 'list' | 'wizard'
  const [fichas, setFichas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail Modal State
  const [selectedFicha, setSelectedFicha] = useState(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData());
  const [insumosCatalog, setInsumosCatalog] = useState([]);
  const [utensiliosCatalog, setUtensiliosCatalog] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fichasData = await api.fichas.getAll().catch(() => []);
      setFichas(Array.isArray(fichasData) ? fichasData : []);
      
      const insData = await api.insumos.getAll().catch(() => []);
      setInsumosCatalog(Array.isArray(insData) ? insData : []);

      const uteData = await api.utensilios.getAll().catch(() => []);
      setUtensiliosCatalog(Array.isArray(uteData) ? uteData : []);
    } catch (err) {
      console.error(err);
    }
  };

  function getInitialFormData() {
    return {
      nombre: '', categoria: 'Hamburguesas', rendimiento_lote: 1,
      insumos: [],
      mano_obra_min: 0, mano_obra_valor_hora: 3500,
      utensilios: [],
      packaging: [],
      reparto: 0, comision: 0, precio_venta: 0
    };
  }

  const handleStartWizard = (editRecipe = null) => {
    if (editRecipe) {
      setFormData({
        ...editRecipe,
        insumos: editRecipe.insumos ? [...editRecipe.insumos] : [],
        utensilios: editRecipe.utensilios ? [...editRecipe.utensilios] : [],
        packaging: editRecipe.packaging ? [...editRecipe.packaging] : []
      });
    } else {
      setFormData(getInitialFormData());
    }
    setStep(1);
    setSelectedFicha(null);
    setView('wizard');
  };

  const handleDuplicateRecipe = (recipe) => {
    setFormData({
      ...recipe,
      id: undefined,
      nombre: `${recipe.nombre} (Copia)`,
      insumos: recipe.insumos ? [...recipe.insumos] : [],
      utensilios: recipe.utensilios ? [...recipe.utensilios] : [],
      packaging: recipe.packaging ? [...recipe.packaging] : []
    });
    setStep(1);
    setSelectedFicha(null);
    setView('wizard');
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta ficha técnica / receta?')) return;
    try {
      await api.fichas.delete(id).catch(() => {});
      setFichas(fichas.filter(f => f.id !== id));
      if (selectedFicha && selectedFicha.id === id) {
        setSelectedFicha(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations for Sticky Receipt & Details
  const calcInsumosCost = (data = formData) => {
    if (!data.insumos) return 0;
    return data.insumos.reduce((acc, item) => {
      const unitCost = item.costo_unitario || (item.insumo ? (item.insumo.costo_promedio / (item.insumo.contenido_envase || 1)) : 0);
      const costConMerma = unitCost * (1 + (item.merma || 0) / 100);
      return acc + (costConMerma * item.cantidad);
    }, 0) / (data.rendimiento_lote || 1);
  };

  const calcManoObraCost = (data = formData) => {
    return (((data.mano_obra_min || 0) / 60) * (data.mano_obra_valor_hora || 3500)) / (data.rendimiento_lote || 1);
  };

  const calcPackagingCost = (data = formData) => {
    if (!data.packaging) return 0;
    return data.packaging.reduce((acc, item) => acc + ((item.costo || 0) * (item.cantidad || 1)), 0);
  };

  const calcUtensiliosCost = (data = formData) => {
    if (!data.utensilios) return 0;
    return data.utensilios.reduce((acc, item) => acc + ((item.costo_hora || 0) * (item.horas_uso || 0)), 0) / (data.rendimiento_lote || 1);
  };

  const computeTotals = (data = formData) => {
    const ins = calcInsumosCost(data);
    const mo = calcManoObraCost(data);
    const pack = calcPackagingCost(data);
    const ute = calcUtensiliosCost(data);
    const cTotal = ins + mo + pack + ute;
    const com = (data.precio_venta * ((data.comision || 0) / 100));
    const ganancia = data.precio_venta - cTotal - com;
    const mPct = data.precio_venta > 0 ? (ganancia / data.precio_venta) * 100 : 0;
    return { ins, mo, pack, ute, cTotal, com, ganancia, mPct };
  };

  const totals = computeTotals(formData);

  const handleSaveFicha = async () => {
    const newFicha = {
      ...formData,
      costo_total: totals.cTotal,
      margen: totals.mPct / 100,
    };
    try {
      if (formData.id) {
        const updated = await api.fichas.update(formData.id, newFicha).catch(() => ({ ...newFicha }));
        setFichas(fichas.map(f => f.id === formData.id ? updated : f));
      } else {
        const created = await api.fichas.create(newFicha).catch(() => ({ ...newFicha, id: Date.now() }));
        setFichas([...fichas, created]);
      }
      setView('list');
    } catch (e) {
      console.error(e);
      setFichas([...fichas, { ...newFicha, id: Date.now() }]);
      setView('list');
    }
  };

  if (view === 'wizard') {
    return (
      <div className="flex h-full animate-slide-up" style={{ gap: '1.5rem', padding: '1rem', overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div className="card flex-col" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('list')} className="btn secondary" style={{ padding: '0.5rem 0.75rem' }}>
              <ArrowLeftIcon /> Cancelar
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {formData.id ? 'Editar Ficha Técnica' : 'Nueva Ficha Técnica'} — Paso {step} de 6
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1,2,3,4,5,6].map(s => (
              <div key={s} style={{ 
                flex: 1, height: '6px', borderRadius: '3px', 
                backgroundColor: s <= step ? 'var(--cyan)' : 'var(--border)' 
              }} />
            ))}
          </div>

          {step === 1 && (
            <div className="flex-col gap-4">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1. Datos Generales de la Preparación</h3>
              <div className="form-group">
                <label>Nombre de la Preparación</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Empanada de Pino, Hamburguesa Doble..." />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option>Hamburguesas</option>
                  <option>Empanadas & Salado</option>
                  <option>Papas & Acompañamientos</option>
                  <option>Bebidas</option>
                  <option>Postres</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rendimiento del Lote Completo (Unidades)</label>
                <input type="number" min="1" value={formData.rendimiento_lote} onChange={e => setFormData({...formData, rendimiento_lote: Number(e.target.value) || 1})} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                  Ejemplo: Si preparas 12 empanadas de una vez, el rendimiento es 12. Los insumos se ingresan para el LOTE y el sistema divide por ti.
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>2. Insumos & Gramaje Real</h3>
                <button 
                  className="primary" style={{ padding: '0.5rem 1rem' }}
                  onClick={() => {
                    const sel = insumosCatalog[0];
                    if(sel) {
                      const cUnit = sel.costo_promedio / (sel.contenido_envase || 1);
                      setFormData({...formData, insumos: [...formData.insumos, { id: Date.now(), insumo_id: sel.id, nombre: sel.nombre, cantidad: 100, unidad: sel.unidad, costo_unitario: cUnit, merma: 0 }]});
                    }
                  }}
                >+ Agregar Insumo</button>
              </div>
              {formData.insumos.map((ins, idx) => (
                <div key={ins.id} className="flex items-end gap-3 p-3 card" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex-col gap-1" style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Insumo del Catálogo</label>
                    <select value={ins.insumo_id} onChange={e => {
                      const found = insumosCatalog.find(c => c.id == e.target.value);
                      if(found) {
                        const cUnit = found.costo_promedio / (found.contenido_envase || 1);
                        const newIns = [...formData.insumos];
                        newIns[idx] = { ...newIns[idx], insumo_id: found.id, nombre: found.nombre, unidad: found.unidad, costo_unitario: cUnit };
                        setFormData({...formData, insumos: newIns});
                      }
                    }}>
                      {insumosCatalog.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.unidad})</option>)}
                    </select>
                  </div>
                  <div className="flex-col gap-1" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Cantidad Usada en Lote ({ins.unidad})</label>
                    <input type="number" step="0.01" value={ins.cantidad} onChange={e => {
                      const newIns = [...formData.insumos];
                      newIns[idx].cantidad = Number(e.target.value);
                      setFormData({...formData, insumos: newIns});
                    }} />
                  </div>
                  <div className="flex-col gap-1" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Merma (%)</label>
                    <input type="number" value={ins.merma} onChange={e => {
                      const newIns = [...formData.insumos];
                      newIns[idx].merma = Number(e.target.value);
                      setFormData({...formData, insumos: newIns});
                    }} />
                  </div>
                  <button className="danger" style={{ padding: '0.65rem' }} onClick={() => {
                    const newIns = formData.insumos.filter((_, i) => i !== idx);
                    setFormData({...formData, insumos: newIns});
                  }}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex-col gap-4">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>3. Mano de Obra del Lote</h3>
              <div className="form-group">
                <label>Tiempo Total de Preparación (Minutos)</label>
                <input type="number" value={formData.mano_obra_min} onChange={e => setFormData({...formData, mano_obra_min: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Valor Hora del Personal ($/hr)</label>
                <input type="number" value={formData.mano_obra_valor_hora} onChange={e => setFormData({...formData, mano_obra_valor_hora: Number(e.target.value)})} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>4. Utensilios & Equipamiento Maestro</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Selecciona los equipos de tu catálogo maestro e indica cuántas horas se usan en este lote.</p>
                </div>
                <button 
                  className="primary" style={{ padding: '0.5rem 1rem' }}
                  onClick={() => {
                    const sel = utensiliosCatalog[0];
                    if (sel) {
                      const cph = sel.costo_compra / (sel.vida_util_horas || 1);
                      setFormData({
                        ...formData, 
                        utensilios: [...formData.utensilios, { 
                          id: Date.now(), 
                          utensilio_id: sel.id, 
                          nombre: sel.nombre, 
                          costo_hora: cph, 
                          horas_uso: 1 
                        }]
                      });
                    }
                  }}
                >+ Agregar Equipamiento</button>
              </div>

              {formData.utensilios.map((ut, idx) => (
                <div key={ut.id} className="flex items-end gap-3 p-3 card" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex-col gap-1" style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Equipo Maestro</label>
                    <select 
                      value={ut.utensilio_id || ''} 
                      onChange={e => {
                        const found = utensiliosCatalog.find(c => c.id == e.target.value);
                        if (found) {
                          const cph = found.costo_compra / (found.vida_util_horas || 1);
                          const arr = [...formData.utensilios];
                          arr[idx] = { ...arr[idx], utensilio_id: found.id, nombre: found.nombre, costo_hora: cph };
                          setFormData({ ...formData, utensilios: arr });
                        }
                      }}
                    >
                      {utensiliosCatalog.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({formatCLP(c.costo_compra / (c.vida_util_horas || 1))}/hr)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-col gap-1" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Depreciación / Hr</label>
                    <div className="mono p-2 text-center" style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 700 }}>
                      {formatCLP(ut.costo_hora)}
                    </div>
                  </div>

                  <div className="flex-col gap-1" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Horas Uso en Lote</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={ut.horas_uso} 
                      onChange={e => {
                        const arr = [...formData.utensilios]; 
                        arr[idx].horas_uso = Number(e.target.value); 
                        setFormData({ ...formData, utensilios: arr });
                      }} 
                    />
                  </div>

                  <button className="danger" style={{ padding: '0.65rem' }} onClick={() => {
                    const arr = formData.utensilios.filter((_, i) => i !== idx);
                    setFormData({ ...formData, utensilios: arr });
                  }}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>5. Packaging por Unidad Vendida</h3>
                <button 
                  className="primary" style={{ padding: '0.5rem 1rem' }}
                  onClick={() => {
                    setFormData({...formData, packaging: [...formData.packaging, { id: Date.now(), nombre: '', costo: 60, cantidad: 1 }]});
                  }}
                >+ Agregar Material</button>
              </div>
              {formData.packaging.map((pkg, idx) => (
                <div key={pkg.id} className="flex items-end gap-3 p-3 card" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex-col gap-1" style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Material</label>
                    <input type="text" value={pkg.nombre} onChange={e => {
                      const arr = [...formData.packaging]; arr[idx].nombre = e.target.value; setFormData({...formData, packaging: arr});
                    }} placeholder="Ej. Bolsa de papel, Caja..." />
                  </div>
                  <div className="flex-col gap-1" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Costo Unitario ($)</label>
                    <input type="number" value={pkg.costo} onChange={e => {
                      const arr = [...formData.packaging]; arr[idx].costo = Number(e.target.value); setFormData({...formData, packaging: arr});
                    }} />
                  </div>
                  <button className="danger" style={{ padding: '0.65rem' }} onClick={() => {
                    const arr = formData.packaging.filter((_, i) => i !== idx);
                    setFormData({...formData, packaging: arr});
                  }}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="flex-col gap-4">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>6. Comisiones & Precio de Venta</h3>
              <div className="form-group">
                <label>Comisión de Medio de Pago / Plataforma (%)</label>
                <input type="number" step="0.1" value={formData.comision} onChange={e => setFormData({...formData, comision: Number(e.target.value)})} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                  Ejemplo: 3.5% Transbank / Redelcom. (El despacho/delivery no es costo de la receta, se cobra al cliente en el POS).
                </span>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan)' }}>Precio de Venta al Público ($)</label>
                <input type="number" style={{ fontSize: '1.5rem', padding: '1rem', fontWeight: '800', color: 'var(--cyan)' }} value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: Number(e.target.value)})} />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="secondary" style={{ visibility: step === 1 ? 'hidden' : 'visible' }} onClick={() => setStep(s => s - 1)}>
              ← Paso Anterior
            </button>
            {step < 6 ? (
              <button className="primary" onClick={() => setStep(s => s + 1)}>
                Siguiente Paso →
              </button>
            ) : (
              <button className="primary" onClick={handleSaveFicha} style={{ backgroundColor: 'var(--green)' }}>
                Guardar Ficha Técnica
              </button>
            )}
          </div>
        </div>

        {/* Sticky Receipt Panel */}
        <div className="card flex-col" style={{ width: '350px', background: '#f4f1e8', border: '1px solid #d4cebe', borderRadius: '8px', padding: '1.5rem', flexShrink: 0, boxShadow: 'var(--shadow-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px dashed #999', paddingBottom: '1rem', marginBottom: '1rem', color: '#1b1d1f', textAlign: 'center', letterSpacing: '1px' }}>
            RESUMEN DE COSTOS (1 un.)
          </h3>
          
          <div className="flex-col gap-3" style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono', color: '#2b2d2f' }}>
            <div className="flex justify-between">
              <span>🍔 Insumos:</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(totals.ins)}</span>
            </div>
            <div className="flex justify-between">
              <span>👨‍🍳 Mano de Obra:</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(totals.mo)}</span>
            </div>
            <div className="flex justify-between">
              <span>🔪 Utensilios:</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(totals.ute)}</span>
            </div>
            <div className="flex justify-between">
              <span>📦 Packaging:</span>
              <span style={{ fontWeight: 600 }}>{formatCLP(totals.pack)}</span>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: '1px dashed #999', color: '#1b1d1f', fontWeight: 'bold' }}>
              <span>Costo Total:</span>
              <span>{formatCLP(totals.cTotal)}</span>
            </div>
            
            <div className="flex justify-between pt-4">
              <span>📈 Precio Venta:</span>
              <span style={{ color: '#1b1d1f', fontWeight: 'bold' }}>{formatCLP(formData.precio_venta)}</span>
            </div>
            <div className="flex justify-between" style={{ color: '#dc2626' }}>
              <span>📉 Comisión Tarjeta/App:</span>
              <span style={{ fontWeight: 600 }}>- {formatCLP(totals.com)}</span>
            </div>
            
            <div className="flex justify-between pt-4 mt-2" style={{ borderTop: '2px solid #333', fontSize: '1.1rem', color: '#1b1d1f', fontWeight: 'bold' }}>
              <span>Ganancia Neta:</span>
              <span style={{ color: totals.ganancia >= 0 ? '#16a34a' : '#dc2626' }}>{formatCLP(totals.ganancia)}</span>
            </div>
            
            <div className="flex justify-center mt-4">
              <span style={{
                padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem',
                backgroundColor: totals.mPct >= 30 ? '#dcfce7' : '#fee2e2',
                color: totals.mPct >= 30 ? '#15803d' : '#b91c1c',
                border: `1px dashed ${totals.mPct >= 30 ? '#16a34a' : '#dc2626'}`
              }}>
                Margen: {totals.mPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  const filtered = fichas.filter(f => f.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-col animate-slide-up" style={{ gap: '1.5rem', width: '100%' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>📋</span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Fichas Técnicas & Recetas</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Estructura de costos unitarios y margen de utilidad por producto</p>
          </div>
        </div>
        <button 
          onClick={() => handleStartWizard()}
          className="primary flex items-center gap-2"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <PlusIcon /> Crear Nueva Ficha Técnica
        </button>
      </div>
      
      <div className="card flex-col" style={{ gap: '1.5rem', width: '100%' }}>
        <div className="flex items-center" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', color: 'var(--muted)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar recetas por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem', maxWidth: '400px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Costo Directo</th>
                <th>Precio Venta</th>
                <th>Margen Real</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const t = computeTotals(f);
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700 }}>{f.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{f.categoria}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{formatCLP(t.cTotal)}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{formatCLP(f.precio_venta)}</td>
                    <td>
                      <span className={`badge ${t.mPct >= 30 ? 'success' : 'danger'}`}>
                        {t.mPct.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setSelectedFicha(f)}>
                          👁️ Ver Detalles
                        </button>
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} title="Editar receta" onClick={() => handleStartWizard(f)}>
                          <EditIcon />
                        </button>
                        <button className="secondary" style={{ padding: '0.4rem 0.8rem' }} title="Duplicar receta" onClick={() => handleDuplicateRecipe(f)}>
                          <CopyIcon />
                        </button>
                        <button className="danger" style={{ padding: '0.4rem 0.8rem' }} title="Eliminar receta" onClick={() => handleDeleteRecipe(f.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No hay fichas técnicas creadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLES DE FICHA TÉCNICA */}
      {selectedFicha && createPortal(
        <div className="modal-overlay">
          <div className="card flex-col gap-3" style={{ width: '95%', maxWidth: '920px', padding: '1.5rem 2rem', margin: 'auto 0' }}>
            <div className="flex justify-between items-start" style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <span className="badge info mb-1">{selectedFicha.categoria}</span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Ficha Técnica: {selectedFicha.nombre}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  Rendimiento del Lote: <strong>{selectedFicha.rendimiento_lote} unidades</strong> | Tiempo de Preparación: <strong>{selectedFicha.mano_obra_min} min</strong>
                </p>
              </div>
              <button className="secondary" onClick={() => setSelectedFicha(null)} style={{ padding: '0.4rem 0.8rem', fontWeight: 'bold' }}>✕ Cerrar</button>
            </div>

            {/* Content Sections */}
            {(() => {
              const st = computeTotals(selectedFicha);
              return (
                <div className="flex-col gap-3">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Costo Total / unidad</span>
                      <p className="mono" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCLP(st.cTotal)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Precio Venta Público</span>
                      <p className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyan)' }}>{formatCLP(selectedFicha.precio_venta)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Utilidad Neta / unidad</span>
                      <p className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: st.ganancia >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {formatCLP(st.ganancia)}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Margen Real de Ganancia</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${st.mPct >= 30 ? 'success' : 'danger'}`} style={{ fontSize: '1rem', fontWeight: 800, padding: '0.25rem 0.75rem' }}>
                          {st.mPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Insumos */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>🥩 Insumos & Receta (Lote)</h3>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>Insumo</th>
                          <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>Cant. Lote</th>
                          <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>% Merma</th>
                          <th style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>Costo Imputado Lote</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFicha.insumos?.map((i, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.4rem 0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>{i.nombre}</td>
                            <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} className="mono">{i.cantidad} {i.unidad}</td>
                            <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} className="mono">{i.merma}%</td>
                            <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }} className="mono">
                              {formatCLP((i.costo_unitario || 0) * (1 + (i.merma||0)/100) * i.cantidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Mano de obra & Equipamiento */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-2.5" style={{ background: 'var(--surface-2)', padding: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>👨‍🍳 Mano de Obra</h4>
                      <p style={{ fontSize: '0.8rem' }}>Tiempo: <strong className="mono">{selectedFicha.mano_obra_min} min</strong> | Valor Hora: <strong className="mono">{formatCLP(selectedFicha.mano_obra_valor_hora)}</strong></p>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.25rem' }}>Costo Lote: {formatCLP(st.mo * selectedFicha.rendimiento_lote)}</p>
                    </div>

                    <div className="card p-2.5" style={{ background: 'var(--surface-2)', padding: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>🔪 Equipamiento Utilizado</h4>
                      {selectedFicha.utensilios?.map((u, idx) => (
                        <p key={idx} style={{ fontSize: '0.8rem' }}>
                          • {u.nombre}: <strong className="mono">{u.horas_uso} hrs</strong> ({formatCLP(u.costo_hora)}/hr)
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: '1.5px solid var(--border)' }}>
                    <button className="danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleDeleteRecipe(selectedFicha.id)}>
                      <TrashIcon /> Eliminar Ficha
                    </button>
                    <div className="flex gap-2">
                      <button className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleDuplicateRecipe(selectedFicha)}>
                        <CopyIcon /> Duplicar Receta
                      </button>
                      <button className="primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleStartWizard(selectedFicha)}>
                        <EditIcon /> Editar Ficha
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
