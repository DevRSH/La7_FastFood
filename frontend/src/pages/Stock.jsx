import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';
import { 
  Package, ArrowDownUp, ShoppingCart, AlertTriangle, 
  CheckCircle2, TrendingDown, Clock, Save,
  AlertCircle, History, Box, DollarSign, X
} from 'lucide-react';

const MOCK_INSUMOS = [];
const MOCK_MOVIMIENTOS = [];

export default function Stock() {
  const [activeTab, setActiveTab] = useState('estado');
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [selectedInsumoAjuste, setSelectedInsumoAjuste] = useState(null);
  const [ajusteForm, setAjusteForm] = useState({ cantidad: '', motivo: '' });

  const [compraForm, setCompraForm] = useState({
    insumoId: '',
    cantidad: '',
    montoTotal: '',
    proveedor: '',
    notas: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insumosData, movsData] = await Promise.all([
        api.insumos.getAll().catch(() => []),
        api.stock.movimientos().catch(() => [])
      ]);
      setInsumos(Array.isArray(insumosData) ? insumosData : []);
      setMovimientos(Array.isArray(movsData) ? movsData : []);
    } catch (error) {
      console.error('Error fetching stock data', error);
      setInsumos([]);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularKPIs = () => {
    let valorTotal = 0;
    let alertas = 0;
    
    insumos.forEach(insumo => {
      valorTotal += (insumo.stock_actual * insumo.costo_promedio);
      if (insumo.stock_actual <= insumo.stock_minimo) {
        alertas++;
      }
    });

    return { valorTotal, alertas, totalInsumos: insumos.length };
  };

  const kpis = calcularKPIs();

  const getStockStatus = (actual, minimo) => {
    if (actual === 0 || actual < minimo * 0.5) return { label: 'Crítico', badgeClass: 'danger', icon: <AlertTriangle size={16} /> };
    if (actual <= minimo) return { label: 'Alerta', badgeClass: 'warning', icon: <AlertCircle size={16} /> };
    return { label: 'OK', badgeClass: 'success', icon: <CheckCircle2 size={16} /> };
  };

  const handleAjusteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.stock.ajustar({
        insumo_id: selectedInsumoAjuste.id,
        cantidad: Number(ajusteForm.cantidad),
        notas: ajusteForm.motivo
      }).catch(() => {});
      setShowAjusteModal(false);
      setAjusteForm({ cantidad: '', motivo: '' });
      fetchData();
    } catch (error) {
      console.error('Error al ajustar', error);
    }
  };

  const handleCompraSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.compras.create({
        insumo_id: compraForm.insumoId,
        cantidad: Number(compraForm.cantidad),
        monto_total: Number(compraForm.montoTotal),
        proveedor: compraForm.proveedor,
        notas: compraForm.notas
      }).catch(() => {});
      setCompraForm({ insumoId: '', cantidad: '', montoTotal: '', proveedor: '', notas: '' });
      setActiveTab('movimientos');
      fetchData();
    } catch (error) {
      console.error('Error registrar compra', error);
    }
  };

  const selectedInsumoCompra = insumos.find(i => i.id.toString() === compraForm.insumoId);
  const qtyCompra = Number(compraForm.cantidad) || 0;
  const montoCompra = Number(compraForm.montoTotal) || 0;
  
  let newCPP = 0;
  if (selectedInsumoCompra && qtyCompra > 0 && montoCompra > 0) {
    const valorActual = selectedInsumoCompra.stock_actual * selectedInsumoCompra.costo_promedio;
    const nuevoValorTotal = valorActual + montoCompra;
    const nuevoStock = selectedInsumoCompra.stock_actual + qtyCompra;
    newCPP = nuevoValorTotal / nuevoStock;
  }

  return (
    <div className="flex-col h-full animate-slide-up gap-4 pb-20">
      <div className="flex items-center gap-3">
        <span style={{ fontSize: '2rem' }}>📦</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Inventario y Control de Stock</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div style={{ padding: '0.75rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: 'var(--radius-sm)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Valorizado Total</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{formatCLP(kpis.valorTotal)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ padding: '0.75rem', background: 'var(--surface-3)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <Box size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Insumos Registrados</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.totalInsumos}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ padding: '0.75rem', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>En Alerta Crítica</p>
            <p className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red)' }}>{kpis.alertas}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1" style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', width: 'fit-content', marginTop: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('estado')}
          className={activeTab === 'estado' ? 'primary' : 'ghost'}
        >
          <Package size={18} />
          Estado de Stock
        </button>
        <button
          onClick={() => setActiveTab('compra')}
          className={activeTab === 'compra' ? 'primary' : 'ghost'}
        >
          <ShoppingCart size={18} />
          Registrar Compra
        </button>
        <button
          onClick={() => setActiveTab('movimientos')}
          className={activeTab === 'movimientos' ? 'primary' : 'ghost'}
        >
          <History size={18} />
          Historial
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="mt-2 flex-1">
        {activeTab === 'estado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insumos.map((insumo) => {
              const status = getStockStatus(insumo.stock_actual, insumo.stock_minimo);
              const percent = Math.min((insumo.stock_actual / (insumo.stock_minimo * 2)) * 100, 100);
              
              return (
                <div key={insumo.id} className="card flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{insumo.nombre}</h3>
                      <p className="mono" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>CPP: {formatCLP(insumo.costo_promedio)}</p>
                    </div>
                    <span className={`badge ${status.badgeClass}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1" style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Stock Actual</span>
                      <span className="mono" style={{ fontWeight: 700 }}>{insumo.stock_actual} {insumo.unidad_medida}</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--surface-3)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          borderRadius: '999px', 
                          transition: 'width 0.4s ease',
                          width: `${percent}%`, 
                          backgroundColor: percent < 25 ? 'var(--red)' : percent < 50 ? 'var(--amber)' : 'var(--cyan)' 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 mono" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                      <span>Mínimo: {insumo.stock_minimo}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSelectedInsumoAjuste(insumo); setShowAjusteModal(true); }}
                    className="secondary w-full mt-2"
                  >
                    <ArrowDownUp size={16} />
                    Ajustar Stock
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'compra' && (
          <div className="card flex-col gap-4" style={{ maxWidth: '900px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="flex items-center gap-2">
              <ShoppingCart style={{ color: 'var(--cyan)' }} /> Registro de Compra a Proveedor
            </h2>
            
            <form onSubmit={handleCompraSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex-col gap-3">
                <div className="form-group mb-0">
                  <label>Insumo Comprado *</label>
                  <select 
                    required
                    value={compraForm.insumoId} 
                    onChange={e => setCompraForm({...compraForm, insumoId: e.target.value})}
                  >
                    <option value="">Seleccione un insumo...</option>
                    {insumos.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="form-group mb-0">
                    <label>Cantidad Recibida *</label>
                    <input 
                      type="number" required min="0.01" step="0.01"
                      className="mono"
                      value={compraForm.cantidad}
                      onChange={e => setCompraForm({...compraForm, cantidad: e.target.value})}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label>Monto Total ($) *</label>
                    <input 
                      type="number" required min="1"
                      className="mono"
                      value={compraForm.montoTotal}
                      onChange={e => setCompraForm({...compraForm, montoTotal: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group mb-0 mt-2">
                  <label>Proveedor (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="Ej: Distribuidora Central"
                    value={compraForm.proveedor}
                    onChange={e => setCompraForm({...compraForm, proveedor: e.target.value})}
                  />
                </div>
                
                <div className="form-group mb-0 mt-2">
                  <label>Notas / Factura</label>
                  <textarea 
                    rows="2"
                    placeholder="Ej: Factura #1042"
                    value={compraForm.notas}
                    onChange={e => setCompraForm({...compraForm, notas: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {/* Live CPP Preview Box */}
              <div className="card flex-col justify-between p-5" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
                  <TrendingDown size={20} /> Impacto en Costos (CPP)
                </h3>
                
                {selectedInsumoCompra ? (
                  <div className="flex-col gap-3 my-4">
                    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>CPP Actual:</span>
                      <span className="mono font-bold">{formatCLP(selectedInsumoCompra.costo_promedio)}</span>
                    </div>
                    {qtyCompra > 0 && montoCompra > 0 ? (
                      <>
                        <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Costo Unitario Compra:</span>
                          <span className="mono font-bold" style={{ color: 'var(--amber)' }}>
                            {formatCLP(montoCompra / qtyCompra)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span style={{ fontWeight: 700 }}>NUEVO CPP PROYECTADO:</span>
                          <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: newCPP > selectedInsumoCompra.costo_promedio ? 'var(--red)' : 'var(--green)' }}>
                            {formatCLP(newCPP)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="empty-state text-sm" style={{ padding: '1rem 0' }}>Ingrese cantidad y monto total para calcular el nuevo Costo Promedio Ponderado.</p>
                    )}
                  </div>
                ) : (
                  <div className="empty-state text-sm">
                    <Box size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    <p>Seleccione un insumo para ver la proyección de costos.</p>
                  </div>
                )}
                
                <button type="submit" className="primary w-full mt-4" style={{ padding: '0.9rem' }}>
                  <Save size={20} />
                  Registrar Compra y Actualizar Stock
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'movimientos' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Final</th>
                    <th>Referencia / Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => {
                    const dateObj = new Date(mov.fecha);
                    return (
                      <tr key={mov.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: 'var(--muted)' }} />
                            <span style={{ fontSize: '0.85rem' }}>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{mov.insumo_nombre}</td>
                        <td>
                          <span className={`badge ${
                            mov.tipo === 'ENTRADA' ? 'success' : 
                            mov.tipo === 'SALIDA' ? 'danger' : 'warning'
                          }`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: 700 }}>
                          <span style={{ color: mov.cantidad > 0 ? 'var(--green)' : 'var(--red)' }}>
                            {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: 800 }}>{mov.stock_resultante}</td>
                        <td>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mov.referencia}</p>
                            {mov.notas && <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{mov.notas}</p>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-state">No hay movimientos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajuste Stock */}
      {showAjusteModal && selectedInsumoAjuste && (
        <div className="modal-overlay">
          <div className="card flex-col gap-4" style={{ width: '420px' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }} className="flex items-center gap-2">
                <ArrowDownUp size={20} style={{ color: 'var(--cyan)' }}/> Ajuste Manual de Stock
              </h3>
              <button onClick={() => setShowAjusteModal(false)} className="ghost" style={{ padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAjusteSubmit} className="flex-col gap-3">
              <div className="p-3 card" style={{ backgroundColor: 'var(--cyan-dim)', border: '1px solid #bae6fd' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--cyan-text)', fontWeight: 600 }}>Insumo Seleccionado</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{selectedInsumoAjuste.nombre}</p>
                <div className="flex justify-between mt-1 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Stock Actual:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{selectedInsumoAjuste.stock_actual} {selectedInsumoAjuste.unidad_medida}</span>
                </div>
              </div>

              <div className="form-group mb-0">
                <label>Cantidad a Ajustar (Usar "-" para mermas/salidas)</label>
                <input 
                  type="number" required step="0.01" className="mono"
                  value={ajusteForm.cantidad}
                  onChange={e => setAjusteForm({...ajusteForm, cantidad: e.target.value})}
                  placeholder="Ej: -5 o 10"
                />
              </div>

              <div className="form-group mb-0">
                <label>Motivo del Ajuste *</label>
                <input 
                  type="text" required
                  value={ajusteForm.motivo}
                  onChange={e => setAjusteForm({...ajusteForm, motivo: e.target.value})}
                  placeholder="Ej: Merma, Desecho, Conteo físico"
                />
              </div>

              <div className="flex justify-between gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setShowAjusteModal(false)} className="secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="primary flex-1">
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
