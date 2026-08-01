import React, { useState } from 'react';
import { formatCLP } from '../api/client';
import { 
  FileText, Printer, X, TrendingUp, DollarSign, 
  ShieldCheck, AlertCircle, Building2, Layers, CheckCircle2, PieChart, Award
} from 'lucide-react';

const DEFAULT_REPORT_DATA = {
  desglose_tributario: {
    ventas_brutas: 0,
    ventas_netas: 0,
    iva_debito_fiscal: 0,
    cogs_bruto: 0,
    cogs_neto: 0,
    iva_credito_cogs: 0,
    opex_afecto_bruto: 0,
    opex_afecto_neto: 0,
    iva_credito_opex: 0,
    opex_exento: 0,
    opex_fijo_neto_total: 0,
    estimacion_iva_f29_a_pagar: 0
  },
  margen_ebitda: {
    margen_bruto_clp: 0,
    margen_bruto_porcentaje: 0.0,
    ebitda_clp: 0,
    ebitda_porcentaje: 0.0,
    ticket_promedio_neto: 0,
    transacciones_totales: 0
  },
  punto_equilibrio: {
    pe_neto_clp: 0,
    pe_bruto_clp: 0,
    pe_unidades_mes: 0,
    pe_unidades_dia: 0,
    promociones_diarias_requeridas: 0
  },
  programas_chile_elegibles: [
    { nombre: 'SERCOTEC Capital Semilla / Abeja', subsidio: '$3.500.000 CLP', coaporte: '10%-20%', enfoque: 'Emprendimientos no formalizados. Financiamiento de equipamiento inox, habilitación y formalización.' },
    { nombre: 'SERCOTEC Digitaliza tu Almacén / Pyme', subsidio: '$3.000.000 CLP', coaporte: '0%-10%', enfoque: 'Negocios formalizados. Adquisición de hardware POS táctil, balanzas, software y marketing digital.' },
    { nombre: 'CORFO Semilla Inicia / Expande', subsidio: '$15.000.000 - $25.000.000 CLP', coaporte: '15%-25%', enfoque: 'Proyectos con innovación en modelo de servicio (Delivery propio PWA) y alta escalabilidad.' },
    { nombre: 'FOSIS Emprendamos Semilla / Avanza', subsidio: '$400.000 - $900.000 CLP', coaporte: '0%', enfoque: 'Autoempleo familiar, consolidación de cocina y equipamiento básico de producción.' }
  ],
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
  capital_trabajo_inventario: 0,
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
    programas_chile_elegibles: DEFAULT_REPORT_DATA.programas_chile_elegibles,
    costos_formalizacion_chile: data?.costos_formalizacion_chile || DEFAULT_REPORT_DATA.costos_formalizacion_chile,
    plan_inversion_sugerido: data?.plan_inversion_sugerido || DEFAULT_REPORT_DATA.plan_inversion_sugerido,
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    desglose_tributario: dt,
    margen_ebitda: me,
    punto_equilibrio: pe,
    programas_chile_elegibles: programas,
    costos_formalizacion_chile: costosChile,
    plan_inversion_sugerido: planInversion,
    total_formalizacion_estimado: totalFormalizacion,
    capital_trabajo_inventario: capitalTrabajo,
    regimen_tributario_sugerido: regimen
  } = safeData;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
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

      <div className="card printable-report modal-content flex-col gap-5" style={{ maxWidth: '920px' }}>
        
        {/* Header no-print controls */}
        <div className="flex justify-between items-center border-b pb-3 no-print" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="badge warning" style={{ fontSize: '0.8rem' }}>🇨🇱 Fondos Chile (SERCOTEC / CORFO / FOSIS)</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Dossier de Evaluación e Inversión</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="primary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <Printer size={16} /> Exportar PDF
            </button>
            <button onClick={onClose} className="ghost" style={{ padding: '0.3rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Encabezado Oficial Imprimible */}
        <div className="flex-col gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col-mobile justify-between items-start gap-2">
            <div>
              <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: '1.3rem' }}>LA 7 FASTFOOD</span>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.1rem' }}>Informe Técnico de Formalización y Viabilidad Operativa</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Estructurado para postulaciones a fondos estatales de fomento y evaluación bancaria microempresa.</p>
            </div>
            <div className="text-right flex-col items-end">
              <span className="badge info mb-1">Estado: Emprendimiento Gastronómico Familiar</span>
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Régimen: {regimen}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (no-print) */}
        <div className="flex flex-wrap gap-1 p-1 no-print" style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)' }}>
          <button onClick={() => setActiveTab('traccion')} className={activeTab === 'traccion' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <TrendingUp size={14} /> 1. Tracción Financiera
          </button>
          <button onClick={() => setActiveTab('tributario')} className={activeTab === 'tributario' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <DollarSign size={14} /> 2. Simulación SII (IVA)
          </button>
          <button onClick={() => setActiveTab('sanitario')} className={activeTab === 'sanitario' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <ShieldCheck size={14} /> 3. Costos SEREMI & Legal
          </button>
          <button onClick={() => setActiveTab('equilibrio')} className={activeTab === 'equilibrio' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <PieChart size={14} /> 4. Punto de Equilibrio
          </button>
          <button onClick={() => setActiveTab('fondos')} className={activeTab === 'fondos' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <Award size={14} /> 5. Fondos Concursables
          </button>
          <button onClick={() => setActiveTab('inversion')} className={activeTab === 'inversion' ? 'primary' : 'ghost'} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
            <Layers size={14} /> 6. Plan de Inversión
          </button>
        </div>

        {/* TAB 1: TRACCIÓN FINANCIERA & OPERATIVA */}
        {(activeTab === 'traccion' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <TrendingUp size={18} /> 1. Métricas de Tracción Financiera Operativa (Pre y Post Formalización)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card card-print p-3 flex-col gap-1">
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>VENTAS BRUTAS</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{formatCLP(dt.ventas_brutas)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--green)' }}>Con IVA 19% cobrado</span>
              </div>
              <div className="card card-print p-3 flex-col gap-1">
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>VENTAS NETAS</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan)' }}>{formatCLP(dt.ventas_netas)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Base imponible</span>
              </div>
              <div className="card card-print p-3 flex-col gap-1">
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>MARGEN BRUTO</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber)' }}>{formatCLP(me.margen_bruto_clp)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--amber-text)', fontWeight: 700 }}>{me.margen_bruto_porcentaje}% de venta neta</span>
              </div>
              <div className="card card-print p-3 flex-col gap-1">
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>EBITDA OPERATIVO</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>{formatCLP(me.ebitda_clp)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--green-text)', fontWeight: 700 }}>{me.ebitda_porcentaje}% sobre ventas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <div className="card card-print p-3 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Indicadores de Operación Diaria</h4>
                <div className="flex justify-between border-b pb-1" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
                  <span>Ticket Promedio Neto:</span>
                  <span className="mono font-bold">{formatCLP(me.ticket_promedio_neto)}</span>
                </div>
                <div className="flex justify-between border-b pb-1" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
                  <span>Transacciones Evaluadas:</span>
                  <span className="mono font-bold">{me.transacciones_totales} pedidos</span>
                </div>
                <div className="flex justify-between pt-1" style={{ fontSize: '0.85rem' }}>
                  <span>Capital de Trabajo en Inventario:</span>
                  <span className="mono font-bold" style={{ color: 'var(--cyan)' }}>{formatCLP(capitalTrabajo)}</span>
                </div>
              </div>

              <div className="card card-print p-3 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Estructura Operativa de Costos</h4>
                <div className="flex justify-between border-b pb-1" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
                  <span>Costo Directo Insumos (COGS Neto):</span>
                  <span className="mono font-bold" style={{ color: 'var(--red)' }}>{formatCLP(dt.cogs_neto)}</span>
                </div>
                <div className="flex justify-between border-b pb-1" style={{ borderColor: 'var(--border-light)', fontSize: '0.85rem' }}>
                  <span>Gastos Fijos Afectos a IVA (Neto):</span>
                  <span className="mono font-bold">{formatCLP(dt.opex_afecto_neto)}</span>
                </div>
                <div className="flex justify-between pt-1" style={{ fontSize: '0.85rem' }}>
                  <span>Gastos Fijos Exentos (Arriendo/Sueldos):</span>
                  <span className="mono font-bold">{formatCLP(dt.opex_exento)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESGLOSE TRIBUTARIO SII (CHILE) */}
        {(activeTab === 'tributario' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <DollarSign size={18} /> 2. Simulación Tributaria SII Chile (IVA 19% & Régimen ProPyme 14 D3)
            </h3>
            
            <div className="card card-print p-3 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div className="flex justify-between items-center border-b pb-1" style={{ borderColor: 'var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Concepto Tributario (Formulario F29 Mensual)</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }} className="mono">Monto Estimado CLP</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span>(+) IVA Débito Fiscal Generado (19% sobre Ventas Brutas)</span>
                <span className="mono font-bold" style={{ color: 'var(--red)' }}>{formatCLP(dt.iva_debito_fiscal)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span>(-) IVA Crédito Fiscal por Compras de Insumos & Packaging</span>
                <span className="mono font-bold" style={{ color: 'var(--green)' }}>-{formatCLP(dt.iva_credito_cogs)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span>(-) IVA Crédito Fiscal por Gastos Generales Operativos</span>
                <span className="mono font-bold" style={{ color: 'var(--green)' }}>-{formatCLP(dt.iva_credito_opex)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold" style={{ borderColor: 'var(--border)', fontSize: '0.95rem' }}>
                <span>(=) ESTIMACIÓN IVA NETO A PAGAR AL SII (F29):</span>
                <span className="mono" style={{ color: 'var(--amber)', fontSize: '1.1rem' }}>{formatCLP(dt.estimacion_iva_f29_a_pagar)}</span>
              </div>
            </div>

            <div className="p-3 card card-print flex items-start gap-3" style={{ backgroundColor: 'var(--cyan-dim)', border: '1px solid #bae6fd' }}>
              <ShieldCheck size={22} style={{ color: 'var(--cyan)', marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                <strong style={{ color: 'var(--cyan-text)' }}>Recomendación Tributaria de Formalización:</strong> Régimen **ProPyme General (Art. 14 D3 de la LIR)**. Permite deducción inmediata del 100% de la inversión en maquinaria gastronómica y stock inicial.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COSTOS DE FORMALIZACIÓN SANITARIA Y LEGAL CHILE */}
        {(activeTab === 'sanitario' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
                <Building2 size={18} /> 3. Matriz Sanitaria & Presupuesto de Formalización en Chile
              </h3>
              <span className="mono font-bold" style={{ fontSize: '1rem', color: 'var(--amber)' }}>Total: {formatCLP(totalFormalizacion)}</span>
            </div>

            <div className="table-container card-print">
              <table>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Trámite / Requisito</th>
                    <th>Organismo</th>
                    <th>Costo (CLP)</th>
                    <th>Plazo</th>
                    <th>Exigencia Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {costosChile.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{item.etapa}</td>
                      <td style={{ fontWeight: 600 }}>{item.concepto}</td>
                      <td style={{ fontSize: '0.8rem' }}>{item.organismo}</td>
                      <td className="mono font-bold" style={{ color: 'var(--green)' }}>{formatCLP(item.costo_estimado_clp)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{item.plazo_dias} días</td>
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
          <div className="flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <PieChart size={18} /> 4. Análisis de Punto de Equilibrio Operativo (PE)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="card card-print p-3 flex-col gap-1" style={{ borderLeft: '4px solid var(--purple)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>VENTA MÍNIMA NETAS/MES</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{formatCLP(pe.pe_neto_clp)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Para EBITDA = $0</span>
              </div>
              <div className="card card-print p-3 flex-col gap-1" style={{ borderLeft: '4px solid var(--cyan)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>COMBOS MÍNIMOS AL MES</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan)' }}>{pe.pe_unidades_mes} unidades</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--cyan-text)' }}>Basado en ticket neto</span>
              </div>
              <div className="card card-print p-3 flex-col gap-1" style={{ borderLeft: '4px solid var(--green)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>META DIARIA DE CAJA</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>{pe.pe_unidades_dia} combos/día</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--green-text)' }}>26 días operativos</span>
              </div>
            </div>

            <div className="card card-print p-3 flex-col gap-2" style={{ backgroundColor: 'var(--surface-2)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }} className="flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} /> Conclusión de Viabilidad Financiera
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Con la estructura actual de costos de <strong>La 7 FastFood</strong>, el negocio alcanza su punto de equilibrio vendiendo solo <strong>{pe.pe_unidades_dia} combos diarios</strong>. Toda venta adicional genera un margen bruto limpio del <strong>{me.margen_bruto_porcentaje}%</strong>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: PROGRAMAS FONDOS CONCURSABLES CHILE */}
        {(activeTab === 'fondos' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <Award size={18} /> 5. Matriz de Elegibilidad para Fondos de Fomento Productivo (Chile)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {programas.map((prog, idx) => (
                <div key={idx} className="card card-print p-3 flex-col gap-1" style={{ backgroundColor: 'var(--surface-2)', borderLeft: '4px solid var(--cyan)' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prog.nombre}</span>
                    <span className="badge success" style={{ fontSize: '0.75rem' }}>Subsidio: {prog.subsidio}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{prog.enfoque}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Cofinanciamiento requerido: {prog.coaporte}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PLAN DE INVERSIÓN SUGERIDO ($6M) */}
        {(activeTab === 'inversion' || window.matchMedia('print').matches) && (
          <div className="flex-col gap-3">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }} className="flex items-center gap-2">
              <Layers size={18} /> 6. Plan de Inversión Presupuestario Sugerido ($6.000.000 CLP)
            </h3>

            <div className="table-container card-print">
              <table>
                <thead>
                  <tr>
                    <th>Categoría</th>
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
                      <td style={{ fontSize: '0.8rem' }}>{item.concepto}</td>
                      <td className="mono font-bold" style={{ color: 'var(--green)' }}>{formatCLP(item.monto_clp)}</td>
                      <td className="mono font-bold">{item.porcentaje}%</td>
                      <td><span className="badge info" style={{ fontSize: '0.7rem' }}>{item.fuente}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-3 card card-print" style={{ backgroundColor: 'var(--surface-3)' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>PRESUPUESTO TOTAL DEL PROYECTO:</span>
              <span className="mono font-bold text-lg" style={{ color: 'var(--amber)', fontSize: '1.25rem' }}>{formatCLP(6000000)} CLP</span>
            </div>
          </div>
        )}

        {/* Footer no-print */}
        <div className="flex justify-end gap-2 pt-3 border-t no-print" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="secondary" style={{ fontSize: '0.85rem' }}>Cerrar</button>
          <button onClick={handlePrint} className="primary flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
