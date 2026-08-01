import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';

const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>;

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
      setInsumos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('API error:', err);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (actual, minimo) => {
    if (actual <= minimo * 0.5) return { label: 'Crítico', color: 'var(--red-text)', bg: 'var(--red-dim)' };
    if (actual <= minimo) return { label: 'Alerta', color: 'var(--amber-text)', bg: 'var(--amber-dim)' };
    return { label: 'OK', color: 'var(--green-text)', bg: 'var(--green-dim)' };
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
        const updated = await api.insumos.update(currentInsumo.id, currentInsumo).catch(() => currentInsumo);
        setInsumos(insumos.map(i => i.id === currentInsumo.id ? updated : i));
      } else {
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
    <div className="flex-col h-full animate-slide-up" style={{ gap: '1.25rem', padding: '0.5rem' }}>
      <div className="flex flex-col-mobile justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2rem' }}>🥩</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>Gestión de Insumos</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2 w-full-mobile"
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <PlusIcon /> Nuevo Insumo
        </button>
      </div>
      
      <div className="card flex-col gap-4" style={{ padding: 0 }}>
        <div className="p-3">
          <div className="flex items-center" style={{ position: 'relative', maxWidth: '400px' }}>
            <div style={{ position: 'absolute', left: '1rem', color: 'var(--muted)' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar insumos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Unidad</th>
                <th>Cont. Envase</th>
                <th>Costo Prom.</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="empty-state">Cargando insumos...</td>
                </tr>
              ) : filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">No se encontraron insumos.</td>
                </tr>
              ) : (
                filteredInsumos.map((ins) => {
                  const status = getStockStatus(ins.stock_actual, ins.stock_minimo);
                  return (
                    <tr key={ins.id}>
                      <td style={{ fontWeight: 600 }}>{ins.nombre}</td>
                      <td>{ins.unidad}</td>
                      <td>{ins.contenido_envase} {ins.unidad}</td>
                      <td className="mono font-bold">{formatCLP(ins.costo_promedio)}</td>
                      <td className="mono">{ins.stock_actual}</td>
                      <td className="mono">{ins.stock_minimo}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: status.bg, color: status.color, fontSize: '0.8rem' }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => handleOpenModal(ins)}
                            className="secondary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            onClick={() => handleDelete(ins.id)}
                            className="danger ghost" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
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
        <div className="modal-overlay">
          <div className="modal-content flex-col gap-4" style={{ maxWidth: '480px' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                {currentInsumo.id ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h2>
              <button onClick={handleCloseModal} className="ghost" style={{ padding: '0.2rem' }}>
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-col gap-3">
              <div className="form-group mb-0">
                <label>Nombre del Insumo *</label>
                <input 
                  type="text" required
                  value={currentInsumo.nombre}
                  onChange={e => setCurrentInsumo({...currentInsumo, nombre: e.target.value})}
                  placeholder="Ej. Carne Molida 10%..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Unidad de Medida</label>
                  <select 
                    required
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
                <div className="form-group mb-0">
                  <label>Cont. Envase</label>
                  <input 
                    type="number" step="0.01" required
                    value={currentInsumo.contenido_envase}
                    onChange={e => setCurrentInsumo({...currentInsumo, contenido_envase: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label>Costo Promedio (CLP)</label>
                <input 
                  type="number" required
                  value={currentInsumo.costo_promedio}
                  onChange={e => setCurrentInsumo({...currentInsumo, costo_promedio: parseInt(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label>Stock Actual</label>
                  <input 
                    type="number" step="0.01" required
                    value={currentInsumo.stock_actual}
                    onChange={e => setCurrentInsumo({...currentInsumo, stock_actual: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group mb-0">
                  <label>Stock Mínimo</label>
                  <input 
                    type="number" step="0.01" required
                    value={currentInsumo.stock_minimo}
                    onChange={e => setCurrentInsumo({...currentInsumo, stock_minimo: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={handleCloseModal} className="secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="primary flex-1">
                  {currentInsumo.id ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
