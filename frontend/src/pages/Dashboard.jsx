import React, { useState, useEffect } from 'react';
import { api, formatCLP } from '../api/client';
import ReporteFormalizacionModal from '../components/ReporteFormalizacionModal';
import { FileText, TrendingUp, DollarSign, Award, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState({ ventasTotales: 0, utilidadReal: 0, margenPromedio: 0, ticketPromedio: 0 });
  const [timeline, setTimeline] = useState([
    { day: 'Lun', sales: 0 }, { day: 'Mar', sales: 0 },
    { day: 'Mié', sales: 0 }, { day: 'Jue', sales: 0 },
    { day: 'Vie', sales: 0 }, { day: 'Sáb', sales: 0 },
    { day: 'Dom', sales: 0 }
  ]);
  const [productMargins, setProductMargins] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loyaltySummary, setLoyaltySummary] = useState({ totalClients: 0, pointsIssued: 0, redemptionRate: 0 });
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [corfoData, setCorfoData] = useState(null);
  const [loadingCorfo, setLoadingCorfo] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar ventas reales desde API y localStorage local
        const [apiSales, localSalesRaw, insumosData, clientsData, fichasData] = await Promise.all([
          api.ventas.getAll().catch(() => []),
          Promise.resolve(JSON.parse(localStorage.getItem('la7_ventas_locales') || '[]')),
          api.insumos.getAll().catch(() => []),
          api.clientes.getAll().catch(() => []),
          api.fichas.getAll().catch(() => [])
        ]);

        // Combinar ventas reales
        const mergedMap = new Map();
        (apiSales || []).forEach(v => mergedMap.set(v.id || v.numero_ticket, v));
        (localSalesRaw || []).forEach(v => {
          if (!mergedMap.has(v.id || v.numero_ticket)) mergedMap.set(v.id || v.numero_ticket, v);
        });

        const completedVentas = Array.from(mergedMap.values()).filter(v => (v.estado || 'Completada') === 'Completada' && !v.anulada);

        let totalVentas = 0;
        let totalQty = completedVentas.length;
        
        completedVentas.forEach(v => {
          totalVentas += Number(v.total || 0);
        });

        const ticketProm = totalQty > 0 ? Math.round(totalVentas / totalQty) : 0;
        const estUtilidad = Math.round(totalVentas * 0.60); // Est 60% margen bruto de contribución

        setKpis({
          ventasTotales: totalVentas,
          utilidadReal: estUtilidad,
          margenPromedio: totalQty > 0 ? 60 : 0,
          ticketPromedio: ticketProm
        });

        // Timeline dinámica por días
        const daysMap = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' };
        const salesByDay = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };

        completedVentas.forEach(v => {
          if (v.fecha) {
            const d = new Date(v.fecha).getDay();
            const dayName = daysMap[d];
            if (dayName) salesByDay[dayName] += Number(v.total || 0);
          }
        });

        setTimeline([
          { day: 'Lun', sales: salesByDay.Lun },
          { day: 'Mar', sales: salesByDay.Mar },
          { day: 'Mié', sales: salesByDay.Mié },
          { day: 'Jue', sales: salesByDay.Jue },
          { day: 'Vie', sales: salesByDay.Vie },
          { day: 'Sáb', sales: salesByDay.Sáb },
          { day: 'Dom', sales: salesByDay.Dom }
        ]);

        // Alertas de Stock Reales
        if (Array.isArray(insumosData)) {
          const alerts = insumosData
            .filter(i => i.stock_actual <= i.stock_minimo)
            .map(i => ({ item: i.nombre, current: i.stock_actual, min: i.stock_minimo }));
          setStockAlerts(alerts);
        }

        // Clientes Reales
        if (Array.isArray(clientsData)) {
          let totalPts = 0;
          clientsData.forEach(c => totalPts += Number(c.puntos_acumulados || c.puntos || 0));
          setLoyaltySummary({
            totalClients: clientsData.length,
            pointsIssued: totalPts,
            redemptionRate: clientsData.length > 0 ? 100 : 0
          });
        }

        // Márgenes Reales de Fichas Técnicas
        if (Array.isArray(fichasData) && fichasData.length > 0) {
          const margins = fichasData.map(f => {
            const costo = Number(f.costo_total || 0);
            const precio = Number(f.precio_venta || 0);
            const mg = precio > 0 ? Math.round(((precio - costo) / precio) * 100) : 0;
            return { name: f.nombre, margin: mg };
          });
          setProductMargins(margins);
        } else {
          setProductMargins([]);
        }

      } catch (err) {
        console.error('Error cargando métricas dinámicas del dashboard:', err);
      }
    };
    loadData();
  }, []);

  const openExportModal = async () => {
    setIsExportModalOpen(true);
    setLoadingCorfo(true);
    try {
      const data = await api.dashboard.getCorfoReportCompleto().catch(async () => {
        return await api.dashboard.getCorfoReport().catch(() => ({}));
      });
      setCorfoData(data || {});
    } catch (err) {
      console.error('Error al obtener informe CORFO:', err);
      setCorfoData({});
    } finally {
      setLoadingCorfo(false);
    }
  };

  const getMarginColor = (margin) => {
    if (margin >= 60) return 'var(--green)';
    if (margin >= 40) return 'var(--amber)';
    return 'var(--red)';
  };

  const maxSales = Math.max(...(timeline.map(t => t.sales) || [0]), 1);

  return (
    <div className="flex-col gap-6 animate-slide-up pb-10" style={{ padding: '0.5rem', color: 'var(--text)' }}>
      
      {/* Header Responsivo */}
      <header className="flex flex-col-mobile justify-between items-start md:items-center gap-3">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Panel de Control & Indicadores</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vista consolidada del rendimiento operativo y comercial del negocio.</p>
        </div>
        <button 
          onClick={openExportModal}
          className="primary flex items-center justify-center gap-2 w-full-mobile"
          style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}
        >
          <FileText size={18} />
          📜 Informe Formalización CORFO / SERCOTEC
        </button>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas Totales (Bruto)', value: formatCLP(kpis.ventasTotales), icon: <DollarSign size={22} />, color: 'var(--cyan)' },
          { label: 'Utilidad Real Estimada', value: formatCLP(kpis.utilidadReal), icon: <TrendingUp size={22} />, color: 'var(--green)' },
          { label: 'Margen Promedio', value: `${kpis.margenPromedio}%`, icon: <Award size={22} />, color: 'var(--amber)' },
          { label: 'Ticket Promedio', value: formatCLP(kpis.ticketPromedio), icon: <FileText size={22} />, color: 'var(--purple)' }
        ].map((kpi, idx) => (
          <div key={idx} className="card flex items-center gap-3">
            <div style={{ padding: '0.75rem', background: 'var(--surface-3)', color: kpi.color, borderRadius: 'var(--radius-sm)' }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</p>
              <p className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Timeline */}
        <div className="card lg:col-span-2 flex-col gap-4">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Evolución de Ventas Semanales</h3>
          <div className="flex items-end gap-2 mt-4" style={{ height: '200px', paddingBottom: '0.5rem' }}>
            {timeline.map((t, idx) => (
              <div key={idx} className="flex-col items-center flex-1 gap-2" style={{ height: '100%' }}>
                <div className="w-full flex-1 flex items-end">
                  <div 
                    style={{ 
                      width: '100%', 
                      background: 'linear-gradient(to top, var(--cyan-glow), var(--cyan))', 
                      height: `${(t.sales / maxSales) * 100}%`,
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 0.4s ease'
                    }} 
                    title={formatCLP(t.sales)}
                  ></div>
                </div>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty & Alerts */}
        <div className="flex-col gap-6">
          <div className="card flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }} className="flex items-center gap-2">
              ⭐ Programa de Lealtad
            </h3>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
              <span>Clientes Registrados:</span>
              <span className="mono font-bold">{loyaltySummary.totalClients}</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
              <span>Puntos Emitidos:</span>
              <span className="mono font-bold" style={{ color: 'var(--amber)' }}>{loyaltySummary.pointsIssued} pts</span>
            </div>
          </div>
          
          <div className="card flex-col gap-3" style={{ borderLeft: '4px solid var(--red)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--red)' }} className="flex items-center gap-2">
              <AlertTriangle size={18} /> Alertas de Inventario
            </h3>
            {stockAlerts.length === 0 ? <p className="empty-state">Stock suficiente en todos los insumos.</p> : (
              <div className="flex-col gap-2">
                {stockAlerts.map((alert, i) => (
                  <div key={i} className="flex justify-between text-xs p-2 rounded" style={{ backgroundColor: 'var(--red-dim)', color: 'var(--red-text)' }}>
                    <span>{alert.item}</span>
                    <span className="mono font-bold">{alert.current} / min {alert.min}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Margins */}
      <div className="card flex-col gap-4">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Márgenes de Contribución por Ficha Técnica</h3>
        {productMargins.length === 0 ? (
          <p className="empty-state">No hay fichas técnicas creadas para calcular márgenes.</p>
        ) : (
          <div className="flex-col gap-3">
            {productMargins.map((prod, idx) => (
              <div key={idx} className="flex flex-col-mobile items-start md:items-center gap-2 text-xs md:text-sm">
                <div style={{ width: '200px', fontWeight: 600 }}>{prod.name}</div>
                <div className="flex-1 w-full" style={{ backgroundColor: 'var(--surface-3)', height: '10px', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(prod.margin, 0)}%`, 
                    background: getMarginColor(prod.margin),
                    height: '100%',
                    borderRadius: '999px'
                  }}></div>
                </div>
                <div className="mono font-bold" style={{ minWidth: '50px', textAlign: 'right', color: getMarginColor(prod.margin) }}>
                  {prod.margin}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CORFO / SERCOTEC Report Modal */}
      {isExportModalOpen && (
        loadingCorfo ? (
          <div className="modal-overlay">
            <div className="modal-content flex-col items-center gap-4 p-8 text-center" style={{ maxWidth: '360px' }}>
              <div className="animate-spin" style={{ fontSize: '2rem' }}>🌀</div>
              <p style={{ fontWeight: 600 }}>Generando Informe Financiero CORFO / SERCOTEC...</p>
            </div>
          </div>
        ) : (
          <ReporteFormalizacionModal 
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            data={corfoData}
          />
        )
      )}
    </div>
  );
}
