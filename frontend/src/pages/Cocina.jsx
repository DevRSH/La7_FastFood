import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, AlertTriangle, Flame, RefreshCw, Volume2, VolumeX } from 'lucide-react';

export default function Cocina() {
  const [comandas, setComandas] = useState([]);
  const [activeFilter, setActiveFilter] = useState('TODAS'); // 'TODAS' | 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO'
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cargar comandas desde localStorage / estado compartido
  const loadComandas = () => {
    try {
      const stored = localStorage.getItem('la7_comandas_cocina');
      if (stored) {
        setComandas(JSON.parse(stored));
      } else {
        setComandas([]);
      }
    } catch (e) {
      console.error('Error cargando comandas de cocina:', e);
      setComandas([]);
    }
  };

  useEffect(() => {
    loadComandas();

    // Actualizar reloj cada segundo para cálculo de temporizadores en vivo
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    // Polling ligero para detectar comandas nuevas del POS
    const pollInterval = setInterval(() => {
      loadComandas();
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, []);

  const updateEstadoComanda = (id, nuevoEstado) => {
    const updated = comandas.map(c => (c.id === id ? { ...c, estado_cocina: nuevoEstado } : c));
    setComandas(updated);
    localStorage.setItem('la7_comandas_cocina', JSON.stringify(updated));
  };

  const clearEntregados = () => {
    if (window.confirm('¿Limpiar comandas entregadas de la pantalla?')) {
      const active = comandas.filter(c => c.estado_cocina !== 'ENTREGADO');
      setComandas(active);
      localStorage.setItem('la7_comandas_cocina', JSON.stringify(active));
    }
  };

  // Cálculo de tiempo transcurrido en minutos
  const getElapsedMinutes = (fechaStr) => {
    if (!fechaStr) return 0;
    const start = new Date(fechaStr).getTime();
    const elapsedMs = Math.max(0, currentTime - start);
    return Math.floor(elapsedMs / 60000);
  };

  // Semáforo de tiempo de espera KDS
  const getTimerBadge = (mins) => {
    if (mins >= 10) {
      return {
        label: `${mins} min - ALERTA DEMORA`,
        bg: 'var(--red)',
        color: '#ffffff',
        isAlert: true
      };
    }
    if (mins >= 5) {
      return {
        label: `${mins} min - En espera`,
        bg: 'var(--amber)',
        color: '#000000',
        isAlert: false
      };
    }
    return {
      label: `${mins} min`,
      bg: 'var(--green)',
      color: '#ffffff',
      isAlert: false
    };
  };

  const filteredComandas = comandas.filter(c => {
    if (c.estado_cocina === 'ENTREGADO') return false;
    if (activeFilter === 'TODAS') return true;
    return c.estado_cocina === activeFilter;
  });

  const pendientesCount = comandas.filter(c => c.estado_cocina === 'PENDIENTE').length;
  const enPrepCount = comandas.filter(c => c.estado_cocina === 'EN_PREPARACION').length;
  const listosCount = comandas.filter(c => c.estado_cocina === 'LISTO').length;

  return (
    <div className="flex-col gap-5 animate-slide-up pb-10" style={{ padding: '0.5rem', color: 'var(--text)' }}>
      
      {/* Header Responsivo KDS */}
      <div className="flex flex-col-mobile justify-between items-start md:items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div style={{ padding: '0.6rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: 'var(--radius-sm)' }}>
            <ChefHat size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Monitor de Cocina (KDS)</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Comandanero digital en tiempo real para preparación y despacho en plancha.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full-mobile">
          <button className="secondary flex items-center gap-2" onClick={loadComandas} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
            <RefreshCw size={16} /> Actualizar
          </button>
          <button className="danger ghost flex items-center gap-2" onClick={clearEntregados} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
            🧹 Limpiar Entregados
          </button>
        </div>
      </div>

      {/* KPI Counters Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-3 flex items-center justify-between" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>PENDIENTES</p>
            <p className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber)' }}>{pendientesCount}</p>
          </div>
          <Clock size={24} style={{ color: 'var(--amber)' }} />
        </div>

        <div className="card p-3 flex items-center justify-between" style={{ borderLeft: '4px solid var(--cyan)' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>EN PREPARACIÓN</p>
            <p className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)' }}>{enPrepCount}</p>
          </div>
          <Flame size={24} style={{ color: 'var(--cyan)' }} />
        </div>

        <div className="card p-3 flex items-center justify-between" style={{ borderLeft: '4px solid var(--green)' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>LISTOS PARA SERVIR</p>
            <p className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)' }}>{listosCount}</p>
          </div>
          <CheckCircle size={24} style={{ color: 'var(--green)' }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap" style={{ borderBottom: '2px solid var(--border-light)' }}>
        {[
          { key: 'TODAS', label: `Todas (${pendientesCount + enPrepCount + listosCount})` },
          { key: 'PENDIENTE', label: `🔥 Pendientes (${pendientesCount})` },
          { key: 'EN_PREPARACION', label: `🍳 En Preparación (${enPrepCount})` },
          { key: 'LISTO', label: `✅ Listos (${listosCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            className={activeFilter === tab.key ? 'primary' : 'ghost'}
            onClick={() => setActiveFilter(tab.key)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de Comandas KDS */}
      {filteredComandas.length === 0 ? (
        <div className="card text-center p-12 flex-col items-center gap-3">
          <ChefHat size={48} style={{ color: 'var(--muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sin comandas activas en cocina</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Las comandas que se ingresen desde el POS aparecerán automáticamente en esta pantalla.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComandas.map(comanda => {
            const mins = getElapsedMinutes(comanda.fecha);
            const badge = getTimerBadge(mins);

            return (
              <div 
                key={comanda.id} 
                className="card flex-col justify-between gap-3 animate-slide-up"
                style={{ 
                  backgroundColor: comanda.estado_cocina === 'EN_PREPARACION' ? 'var(--surface-2)' : 'var(--surface-1)',
                  borderTop: `5px solid ${badge.bg}`,
                  boxShadow: badge.isAlert ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              >
                {/* Header Ticket */}
                <div className="flex justify-between items-start border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>
                  <div>
                    <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                      {comanda.ticket_num || `#T-${comanda.id}`}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge info" style={{ fontSize: '0.7rem' }}>{comanda.canal || 'Local'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{comanda.cliente}</span>
                    </div>
                  </div>

                  {/* Reloj con Semáforo */}
                  <span 
                    className="badge mono font-bold flex items-center gap-1"
                    style={{ 
                      backgroundColor: badge.bg, 
                      color: badge.color, 
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.6rem',
                      animation: badge.isAlert ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    <Clock size={14} />
                    {badge.label}
                  </span>
                </div>

                {/* Lista de Ítems / Productos */}
                <div className="flex-col gap-2 my-2" style={{ minHeight: '80px' }}>
                  {(comanda.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-dashed pb-1" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-baseline gap-2">
                        <span className="mono font-bold" style={{ fontSize: '1.1rem', color: 'var(--cyan)' }}>
                          {item.cantidad}x
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.producto}</span>
                      </div>
                      {item.modificadores && item.modificadores.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--amber)', textAlign: 'right' }}>
                          {item.modificadores.map(m => m.nombre || m).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Acciones Táctiles de Estado */}
                <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border-light)' }}>
                  {comanda.estado_cocina === 'PENDIENTE' && (
                    <button 
                      className="primary w-full flex items-center justify-center gap-2" 
                      style={{ padding: '0.75rem', backgroundColor: 'var(--amber)', color: '#000', fontWeight: 800 }}
                      onClick={() => updateEstadoComanda(comanda.id, 'EN_PREPARACION')}
                    >
                      <Flame size={18} /> Iniciar Preparación
                    </button>
                  )}

                  {comanda.estado_cocina === 'EN_PREPARACION' && (
                    <button 
                      className="primary w-full flex items-center justify-center gap-2" 
                      style={{ padding: '0.75rem', backgroundColor: 'var(--green)', fontWeight: 800 }}
                      onClick={() => updateEstadoComanda(comanda.id, 'LISTO')}
                    >
                      <CheckCircle size={18} /> Marcar como Listo
                    </button>
                  )}

                  {comanda.estado_cocina === 'LISTO' && (
                    <button 
                      className="secondary w-full flex items-center justify-center gap-2" 
                      style={{ padding: '0.75rem', fontWeight: 800 }}
                      onClick={() => updateEstadoComanda(comanda.id, 'ENTREGADO')}
                    >
                      🍽️ Entregado / Servido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
