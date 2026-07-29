import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

// SVG Icons
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>;

// Default local state in case API fails
const defaultInsumos = [
  { id: 1, nombre: 'Pan de Hamburguesa', unidad: 'un', contenido_envase: 12, costo_promedio: 2400, stock_actual: 48, stock_minimo: 24 },
  { id: 2, nombre: 'Carne Angus 150g', unidad: 'kg', contenido_envase: 5, costo_promedio: 45000, stock_actual: 15, stock_minimo: 10 },
  { id: 3, nombre: 'Queso Cheddar', unidad: 'kg', contenido_envase: 2, costo_promedio: 12000, stock_actual: 1, stock_minimo: 3 },
  { id: 4, nombre: 'Salsa BBQ', unidad: 'lt', contenido_envase: 1, costo_promedio: 3500, stock_actual: 0.5, stock_minimo: 1 },
];

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInsumo, setCurrentInsumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const data = await api.insumos.getAll();
      setInsumos(Array.isArray(data) ? data : defaultInsumos);
    } catch (err) {
      console.warn('API error, using local state:', err);
      setInsumos(defaultInsumos);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (actual, minimo) => {
    if (actual <= minimo * 0.5) return { label: 'Crítico', color: '#ff4d4f', bg: '#331313', borderColor: '#821f1f' }; // Rojo
    if (actual <= minimo) return { label: 'Alerta', color: '#faad14', bg: '#332913', borderColor: '#825f1f' }; // Amarillo
    return { label: 'OK', color: '#52c41a', bg: '#133318', borderColor: '#1f822a' }; // Verde
  };

  const filteredInsumos = insumos.filter(ins => 
    ins.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (insumo = null) => {
    setCurrentInsumo(insumo || { 
      nombre: '', unidad: 'kg', contenido_envase: '', costo_promedio: '', stock_actual: '', stock_minimo: '' 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentInsumo(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentInsumo.id) {
        // Update
        const updated = await api.insumos.update(currentInsumo.id, currentInsumo).catch(() => currentInsumo);
        setInsumos(insumos.map(i => i.id === currentInsumo.id ? updated : i));
      } else {
        // Create
        const created = await api.insumos.create(currentInsumo).catch(() => ({ ...currentInsumo, id: Date.now() }));
        setInsumos([...insumos, created]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este insumo?')) {
      try {
        await api.insumos.delete(id).catch(() => null);
        setInsumos(insumos.filter(i => i.id !== id));
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }
  };

  return (
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.5rem', padding: '1rem' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>🥩</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>Gestión de Insumos</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <PlusIcon /> Nuevo Insumo
        </button>
      </div>
      
      <div className="card flex-col" style={{ gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        <div className="flex items-center" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', color: 'var(--muted)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar insumos por nombre..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%', maxWidth: '400px' }}
          />
        </div>

        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <th style={{ padding: '1rem' }}>Nombre</th>
                <th style={{ padding: '1rem' }}>Unidad</th>
                <th style={{ padding: '1rem' }}>Cont. Envase</th>
                <th style={{ padding: '1rem' }}>Costo Prom.</th>
                <th style={{ padding: '1rem' }}>Stock Actual</th>
                <th style={{ padding: '1rem' }}>Stock Mín.</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                    Cargando insumos...
                  </td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                    No se encontraron insumos.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((ins) => {
                  const status = getStockStatus(ins.stock_actual, ins.stock_minimo);
                  return (
                    <tr key={ins.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text)' }}>{ins.nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>{ins.unidad}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>{ins.contenido_envase} {ins.unidad}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{formatCLP(ins.costo_promedio)}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{ins.stock_actual}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{ins.stock_minimo}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          backgroundColor: status.bg,
                          color: status.color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          border: `1px solid ${status.borderColor}`
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenModal(ins)}
                            className="btn" 
                            style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--primary)' }}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            onClick={() => handleDelete(ins.id)}
                            className="btn" 
                            style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: '#ff4d4f' }}
                          >
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
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {currentInsumo.id ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-col" style={{ gap: '1rem' }}>
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Nombre</label>
                <input 
                  type="text" className="input" required
                  value={currentInsumo.nombre}
                  onChange={e => setCurrentInsumo({...currentInsumo, nombre: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-col gap-1" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Unidad</label>
                  <select 
                    className="input" required
                    value={currentInsumo.unidad}
                    onChange={e => setCurrentInsumo({...currentInsumo, unidad: e.target.value})}
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="lt">Litros (lt)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="un">Unidades (un)</option>
                  </select>
                </div>
                <div className="flex-col gap-1" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Cont. Envase</label>
                  <input 
                    type="number" step="0.01" className="input" required
                    value={currentInsumo.contenido_envase}
                    onChange={e => setCurrentInsumo({...currentInsumo, contenido_envase: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Costo Promedio (CLP)</label>
                <input 
                  type="number" className="input" required
                  value={currentInsumo.costo_promedio}
                  onChange={e => setCurrentInsumo({...currentInsumo, costo_promedio: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-col gap-1" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Stock Actual</label>
                  <input 
                    type="number" step="0.01" className="input" required
                    value={currentInsumo.stock_actual}
                    onChange={e => setCurrentInsumo({...currentInsumo, stock_actual: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="flex-col gap-1" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Stock Mínimo</label>
                  <input 
                    type="number" step="0.01" className="input" required
                    value={currentInsumo.stock_minimo}
                    onChange={e => setCurrentInsumo({...currentInsumo, stock_minimo: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3" style={{ marginTop: '1.5rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentInsumo.id ? 'Guardar Cambios' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
