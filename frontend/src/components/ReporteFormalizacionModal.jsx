import React, { useState } from 'react';
import { formatCLP } from '../api/client';
import { 
  FileText, Printer, X, TrendingUp, DollarSign, 
  ShieldCheck, AlertCircle, Building2, Layers, CheckCircle2, PieChart
} from 'lucide-react';

const DEFAULT_REPORT_DATA = {
  desglose_tributario: {
    ventas_brutas: 6545000,
    ventas_netas: 5500000,
    iva_debito_fiscal: 1045000,
    cogs_bruto: 2290750,
    cogs_neto: 1925000,
    iva_credito_cogs: 365750,
    opex_afecto_bruto: 300000,
    opex_afecto_neto: 252101,
    iva_credito_opex: 47899,
    opex_exento: 1800000,
    opex_fijo_neto_total: 2052101,
    estimacion_iva_f29_a_pagar: 631351
  },
  margen_ebitda: {
    margen_bruto_clp: 3575000,
    margen_bruto_porcentaje: 65.0,
    ebitda_clp: 1522899,
    ebitda_porcentaje: 27.69,
    ticket_promedio_neto: 5500.0,
    transacciones_totales: 1000
  },
  punto_equilibrio: {
    pe_neto_clp: 3157078,
    pe_bruto_clp: 3756923,
    pe_unidades_mes: 574,
    pe_unidades_dia: 22,
    promociones_diarias_requeridas: 22
  },
  costos_formalizacion_chile: [
    { etapa: '1. Legal', concepto: 'Constitución SpA / EIRL en Tu Empresa en un Día', organismo: 'REEMP', costo_estimado_clp: 20000, plazo_dias: 2, requisitos: 'Firma Electrónica Avanzada (FEA)' },
    { etapa: '2. Tributario', concepto: 'Certificado Digital e-Token Boleta/Factura Electrónica SII', organismo: 'Proveedor Acepta/E-Cert', costo_estimado_clp: 18000, plazo_dias: 1, requisitos: 'RUT Representante Legal' },
    { etapa: '3. Sanitario', concepto: 'Arancel Solicitud Autorización Sanitaria N-01/2002', organismo: 'SEREMI de Salud', costo_estimado_clp: 85000, plazo_dias: 20, requisitos: 'Plano local, agua potable, BPM' },
    { etapa: '3. Sanitario', concepto: 'Trampa de Grasas Acero Inox 50L', organismo: 'Proveedor Gastronómico', costo_estimado_clp: 350000, plazo_dias: 1, requisitos: 'Exigencia normativa SEREMI' },
    { etapa: '3. Sanitario', concepto: 'Campana Inox, Extractor Techo y Ductos de Evacuación', organismo: 'Empresa Climatización', costo_estimado_clp: 950000, plazo_dias: 5, requisitos: 'Salida a 2m sobre cumbrera' },
    { etapa: '4. Municipal', concepto: 'Patente Comercial Definitiva Gastronómica', organismo: 'Ilustre Municipalidad', costo_estimado_clp: 80000, plazo_dias: 10, requisitos: 'Resolución Sanitaria Aprobada' }
  ],
  plan_inversion_sugerido: [
    { categoria: 'Equipamiento Gastronómico', concepto: 'Plancha, freidora doble 18L, visicooler 400L, congelador 300L, mesones inox y POS', monto_clp: 3300000, porcentaje: 55.0, fuente: 'Subsidio Concursable' },
    { categoria: 'Habilitación Sanitaria', concepto: 'Campana con extractor, trampa de grasa, extintor K, lavamanos pedal', monto_clp: 1500000, porcentaje: 25.0, fuente: 'Subsidio Concursable' },
    { categoria: 'Tramitación & Permisos', concepto: 'Arancel SEREMI, Firma Electrónica, Certificado SII, Patente Municipal', monto_clp: 600000, porcentaje: 10.0, fuente: 'Aporte Titular' },
    { categoria: 'Capital de Trabajo Inicial', concepto: 'Stock insumos alimenticios iniciales y packaging compostable', monto_clp: 600000, porcentaje: 10.0, fuente: 'Subsidio / Aporte Titular' }
  ],
  total_formalizacion_estimado: 1503000,
  capital_trabajo_inventario: 850000,
  regimen_tributario_sugerido: 'ProPyme General 14 D3 (Tasa 10%/25% sobre Utilidad Neta)'
};

export default function ReporteFormalizacionModal({ isOpen, onClose, data }) {
  const [activeTab, setActiveTab] = useState('traccion');

  if (!isOpen) return null;

  const safeData = {
    ...DEFAULT_REPORT_DATA,
    ...(data || {}),
    desglose_tributario: { ...DEFAULT_REPORT_DATA.desglose_tributario, ...(data?.desglose_tributario || {}) },
    margen_ebitda: { ...DEFAULT_REPORT_DATA.margen_ebitda, ...(data?.margen_ebitda || {}) },
    punto_equilibrio: { ...DEFAULT_REPORT_DATA.punto_equilibrio, ...(data?.punto_equilibrio || {}) },
    costos_formalizacion_chile: data?.costos_formalizacion_chile || DEFAULT_REPORT_DATA.costos_formalizacion_chile,
    plan_inversion_sugerido: data?.plan_inversion_sugerido || DEFAULT_REPORT_DATA.plan_inversion_sugerido,
  };

  if (data && data.ventas_netas && !data.desglose_tributario) {
    safeData.desglose_tributario.ventas_netas = data.ventas_netas;
    safeData.desglose_tributario.ventas_brutas = Math.round(data.ventas_netas * 1.19);
    safeData.desglose_tributario.cogs_neto = data.costo_bienes_vendidos || safeData.desglose_tributario.cogs_neto;
    safeData.margen_ebitda.margen_bruto_clp = data.margen_bruto || (data.ventas_netas - (data.costo_bienes_vendidos || 0));
    safeData.margen_ebitda.ebitda_clp = data.ebitda || safeData.margen_ebitda.ebitda_clp;
    safeData.capital_trabajo_inventario = data.capital_trabajo || safeData.capital_trabajo_inventario;
  }

  const handlePrint = () => {
    window.print();
  };

  const {
    desglose_tributario: dt,
    margen_ebitda: me,
    punto_equilibrio: pe,
    costos_formalizacion_chile: costosChile,
    plan_inversion_sugerido: planInversion,
    total_formalizacion_estimado: totalFormalizacion,
    capital_trabajo_inventario: capitalTrabajo,
    regimen_tributario_sugerido: regimen
  } = safeData;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, overflowY: 'auto' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report, .printable-report * {
            visibility: visible;
          }
          .printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
          .card-print {
            border: 1px solid #ccc !important;
            background: #f9f9f9 !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="card printable-report flex-col gap-6" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        
        {/* Header no-print controls */}
        <div className="flex justify-between items-center border-b pb-3 no-print" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="badge warning" style={{ fontSize: '0.85rem' }}>🇨🇱 Chile CORFO / Sercotec</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Informe de Formalización y Evaluación de Inversión</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="primary flex items-center gap-2" style={{ padding: '0.5rem 1rem' }}>
              <Printer size={18} /> Imprimir / Exportar PDF
            </button>
            <button onClick={onClose} className="ghost" style={{ padding: '0.4rem' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Encabezado Oficial Imprimible */}
        <div className="flex-col gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: '1.4rem' }}>LA 7 FASTFOOD</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>Dossier de Evaluación de Inversión y Formalización</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estructurado para postulaciones a fondos estatales (CORFO / Sercotec) y evaluación bancaria Microempresa (BancoEstado / BCI).</p>
            </div>
            <div className="text-right flex-col items-end">
              <span className="badge info mb-1">Estado: Emprendimiento Informal en Transición</span>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Régimen Sugerido: {regimen}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (no-print) */}
        <div className="flex flex-wrap gap-2 p-1 no-print" style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)' }}>
          <button onClick={() => setActiveTab('traccion')} className={activeTab === 'traccion' ? 'primary' : 'ghost'} style={{ fontSize: '0.85rem' }}>
            <TrendingUp size={16} /> 1. Tracción Financiera
          </button>
          <button onClick={() => setActiveTab('tributario')} className={activeTab === 'tributario' ? 'primary' : 'ghost'} style={{ fontSize: '0.85rem' }}>
            <DollarSign size={16} /> 2. Desglose IVA (SII)
          </button>
          <button onClick={() => setActiveTab('sanitario')} className={activeTab === 'sanitario' ? 'primary' : 'ghost'} style={{ fontSize: '0.85rem' }}>
            <ShieldCheck size={16} /> 3. Costos SEREMI & Legal
          </button>
          <button onClick={() => setActiveTab('equilibrio')} className={activeTab === 'equilibrio' ? 'primary' : 'ghost'} style={{ fontSize: '0.85rem' }}>
            <PieChart size={16} /> 4. Punto de Equilibrio
          </button>
          <button onClick={() => setActiveTab('inversion')} className={activeTab === 'inversion' ? 'primary' : 'ghost'} style={{ fontSize: '0.85rem' }}>
            <Layers size={16} /> 5. Plan de Inversión ($6M)
          </button>
        </div>

        {/* TAB 1: TRACCIÓN FINANCIERA & OPERATIVA */}
        {(activeTab === 'traccion' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-4">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <TrendingUp size={20} /> 1. Métricas de Tracción Financiera Operativa (Pre y Post Formalización)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card card-print p-4 flex-col gap-1">
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>VENTAS BRUTAS</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{formatCLP(dt.ventas_brutas)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>Con IVA 19% cobrado</span>
              </div>
              <div className="card card-print p-4 flex-col gap-1">
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>VENTAS NETAS</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)' }}>{formatCLP(dt.ventas_netas)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sin IVA (Base imponible)</span>
              </div>
              <div className="card card-print p-4 flex-col gap-1">
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>MARGEN BRUTO</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber)' }}>{formatCLP(me.margen_bruto_clp)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--amber-text)', fontWeight: 700 }}>{me.margen_bruto_porcentaje}% de venta neta</span>
              </div>
              <div className="card card-print p-4 flex-col gap-1">
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>EBITDA OPERATIVO</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)' }}>{formatCLP(me.ebitda_clp)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--green-text)', fontWeight: 700 }}>{me.ebitda_porcentaje}% sobre ventas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="card card-print p-4 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Indicadores de Operación Diaria</h4>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.9rem' }}>
                  <span>Ticket Promedio Neto:</span>
                  <span className="mono font-bold">{formatCLP(me.ticket_promedio_neto)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.9rem' }}>
                  <span>Transacciones Evaluadas:</span>
                  <span className="mono font-bold">{me.transacciones_totales} pedidos</span>
                </div>
                <div className="flex justify-between pt-1" style={{ fontSize: '0.9rem' }}>
                  <span>Capital de Trabajo en Inventario:</span>
                  <span className="mono font-bold" style={{ color: 'var(--cyan)' }}>{formatCLP(capitalTrabajo)}</span>
                </div>
              </div>

              <div className="card card-print p-4 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Estructura Operativa de Costos</h4>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.9rem' }}>
                  <span>Costo Directo Insumos (COGS Neto):</span>
                  <span className="mono font-bold" style={{ color: 'var(--red)' }}>{formatCLP(dt.cogs_neto)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)', fontSize: '0.9rem' }}>
                  <span>Gastos Fijos Afectos a IVA (Neto):</span>
                  <span className="mono font-bold">{formatCLP(dt.opex_afecto_neto)}</span>
                </div>
                <div className="flex justify-between pt-1" style={{ fontSize: '0.9rem' }}>
                  <span>Gastos Fijos Exentos (Arriendo/Sueldos):</span>
                  <span className="mono font-bold">{formatCLP(dt.opex_exento)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESGLOSE TRIBUTARIO SII (CHILE) */}
        {(activeTab === 'tributario' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-4">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <DollarSign size={20} /> 2. Simulación Tributaria SII Chile (IVA 19% & Régimen ProPyme 14 D3)
            </h3>
            
            <div className="card card-print p-4 flex-col gap-3" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <span style={{ fontWeight: 700 }}>Concepto Tributario (Formulario F29 Mensual)</span>
                <span style={{ fontWeight: 700 }} className="mono">Monto Estimado CLP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>(+) IVA Débito Fiscal Generado (19% sobre Ventas Brutas)</span>
                <span className="mono font-bold" style={{ color: 'var(--red)' }}>{formatCLP(dt.iva_debito_fiscal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>(-) IVA Crédito Fiscal por Compras de Insumos & Packaging</span>
                <span className="mono font-bold" style={{ color: 'var(--green)' }}>-{formatCLP(dt.iva_credito_cogs)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>(-) IVA Crédito Fiscal por Gastos Generales Operativos</span>
                <span className="mono font-bold" style={{ color: 'var(--green)' }}>-{formatCLP(dt.iva_credito_opex)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold" style={{ borderColor: 'var(--border)', fontSize: '1.05rem' }}>
                <span>(=) ESTIMACIÓN IVA NETO A PAGAR AL SII (F29):</span>
                <span className="mono" style={{ color: 'var(--amber)', fontSize: '1.2rem' }}>{formatCLP(dt.estimacion_iva_f29_a_pagar)}</span>
              </div>
            </div>

            <div className="p-4 card card-print flex items-start gap-3" style={{ backgroundColor: 'var(--cyan-dim)', border: '1px solid #bae6fd' }}>
              <ShieldCheck size={24} style={{ color: 'var(--cyan)', marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                <strong style={{ color: 'var(--cyan-text)' }}>Recomendación Tributaria de Formalización:</strong> Régimen **ProPyme General (Art. 14 D3 de la LIR)**. Ofrece tasa reducida del Impuesto de Primera Categoría (10% al 25%) calculado exclusivamente sobre la utilidad neta real, con deducción inmediata del 100% de la inversión en maquinaria gastronómica y stock inicial.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COSTOS DE FORMALIZACIÓN SANITARIA Y LEGAL CHILE */}
        {(activeTab === 'sanitario' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
                <Building2 size={20} /> 3. Matriz Sanitaria & Presupuesto de Formalización en Chile
              </h3>
              <span className="mono font-bold" style={{ fontSize: '1.1rem', color: 'var(--amber)' }}>Total Estimado: {formatCLP(totalFormalizacion)}</span>
            </div>

            <div className="card card-print p-0" style={{ overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Trámite / Requisito</th>
                    <th>Organismo Acreditador</th>
                    <th>Costo (CLP)</th>
                    <th>Plazo Est.</th>
                    <th>Exigencia Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {costosChile.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{item.etapa}</td>
                      <td style={{ fontWeight: 600 }}>{item.concepto}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.organismo}</td>
                      <td className="mono font-bold" style={{ color: 'var(--green)' }}>{formatCLP(item.costo_estimado_clp)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.plazo_dias} días</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.requisitos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PUNTO DE EQUILIBRIO & VIABILIDAD */}
        {(activeTab === 'equilibrio' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-4">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <PieChart size={20} /> 4. Análisis de Punto de Equilibrio Operativo (PE)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card card-print p-4 flex-col gap-1" style={{ borderLeft: '4px solid var(--purple)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>VENTA MÍNIMA NETAS/MES</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{formatCLP(pe.pe_neto_clp)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Para EBITDA = $0</span>
              </div>
              <div className="card card-print p-4 flex-col gap-1" style={{ borderLeft: '4px solid var(--cyan)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>COMBOS MÍNIMOS AL MES</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)' }}>{pe.pe_unidades_mes} unidades</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cyan-text)' }}>Basado en ticket neto</span>
              </div>
              <div className="card card-print p-4 flex-col gap-1" style={{ borderLeft: '4px solid var(--green)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>META DIARIA DE CAJA</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)' }}>{pe.pe_unidades_dia} combos/día</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--green-text)' }}>26 días operativos</span>
              </div>
            </div>

            <div className="card card-print p-4 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }} className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: 'var(--green)' }} /> Conclusión de Viabilidad Financiera
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Con la estructura actual de costos de <strong>La 7 FastFood</strong>, el negocio alcanza su punto de equilibrio vendiendo solo <strong>{pe.pe_unidades_dia} combos diarios</strong>. Toda venta adicional sobre este umbral genera un margen neto limpio del <strong>{me.margen_bruto_porcentaje}%</strong> directamente atribuible al retorno del capital invertido.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: PLAN DE INVERSIÓN SUGERIDO ($6M) */}
        {(activeTab === 'inversion' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-4">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <Layers size={20} /> 5. Plan de Inversión Presupuestario Sugerido (Postulación Sercotec / CORFO)
            </h3>

            <div className="card card-print p-0" style={{ overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Categoría de Inversión</th>
                    <th>Detalle de Adquisiciones e Infraestructura</th>
                    <th>Monto (CLP)</th>
                    <th>% Total</th>
                    <th>Fuente Proyectada</th>
                  </tr>
                </thead>
                <tbody>
                  {planInversion.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{item.categoria}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.concepto}</td>
                      <td className="mono font-bold" style={{ color: 'var(--green)' }}>{formatCLP(item.monto_clp)}</td>
                      <td className="mono font-bold">{item.porcentaje}%</td>
                      <td><span className="badge info" style={{ fontSize: '0.75rem' }}>{item.fuente}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-4 card card-print" style={{ backgroundColor: 'var(--surface-3)' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>PRESUPUESTO TOTAL DEL PROYECTO DE FORMALIZACIÓN:</span>
              <span className="mono font-bold text-xl" style={{ color: 'var(--amber)', fontSize: '1.4rem' }}>{formatCLP(6000000)} CLP</span>
            </div>
          </div>
        )}

        {/* Footer no-print */}
        <div className="flex justify-end gap-3 pt-4 border-t no-print" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="secondary">Cerrar Informe</button>
          <button onClick={handlePrint} className="primary flex items-center gap-2">
            <Printer size={18} /> Imprimir / Exportar a PDF
          </button>
        </div>
      </div>
    </div>
  );
}
