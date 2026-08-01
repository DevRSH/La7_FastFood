from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.venta import Venta, DetalleVenta
from app.models.producto import Producto, CategoriaProducto
from app.models.cliente import Cliente, MovimientoPuntos
from app.models.insumo import Insumo

def obtener_resumen_dashboard(db: Session, fecha_inicio: Optional[datetime] = None, fecha_fin: Optional[datetime] = None) -> Dict[str, Any]:
    query = db.query(
        func.sum(Venta.total).label("ventas_totales"),
        func.sum(Venta.costo_total_snapshot).label("costos_totales"),
        func.sum(Venta.utilidad_snapshot).label("utilidad_total"),
        func.count(Venta.id).label("cantidad_transacciones")
    ).filter(Venta.anulada == False)
    
    if fecha_inicio:
        query = query.filter(Venta.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Venta.fecha <= fecha_fin)
        
    res = query.first()
    
    ventas = res.ventas_totales or 0
    costos = res.costos_totales or 0
    utilidad = res.utilidad_total or 0
    tx = res.cantidad_transacciones or 0
    
    margen = (utilidad / ventas * 100) if ventas > 0 else 0.0
    ticket = (ventas / tx) if tx > 0 else 0.0
    
    # Clientes activos (compraron en el periodo)
    q_clientes = db.query(func.count(func.distinct(Venta.cliente_id))).filter(
        Venta.anulada == False,
        Venta.cliente_id.isnot(None)
    )
    if fecha_inicio:
        q_clientes = q_clientes.filter(Venta.fecha >= fecha_inicio)
    if fecha_fin:
        q_clientes = q_clientes.filter(Venta.fecha <= fecha_fin)
    
    clientes_activos = q_clientes.scalar() or 0
    
    return {
        "ventas_totales": ventas,
        "costos_totales": costos,
        "utilidad_total": utilidad,
        "margen_promedio": round(margen, 2),
        "ticket_promedio": round(ticket, 2),
        "cantidad_transacciones": tx,
        "clientes_activos": clientes_activos
    }

def obtener_ventas_diarias(db: Session, dias: int = 30) -> List[Dict[str, Any]]:
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    # Aggregation in Postgres/SQLite might differ, using func.date or string formatting
    # SQLite uses date(fecha), Postgres uses DATE(fecha). In SQLAlchemy, cast to Date.
    from sqlalchemy import cast, Date
    
    query = db.query(
        cast(Venta.fecha, Date).label("fecha"),
        func.sum(Venta.total).label("total"),
        func.sum(Venta.costo_total_snapshot).label("costo"),
        func.sum(Venta.utilidad_snapshot).label("utilidad"),
        func.count(Venta.id).label("transacciones")
    ).filter(
        Venta.anulada == False,
        Venta.fecha >= fecha_inicio
    ).group_by(
        cast(Venta.fecha, Date)
    ).order_by(
        cast(Venta.fecha, Date).asc()
    )
    
    resultados = query.all()
    return [
        {
            "fecha": r.fecha.strftime("%Y-%m-%d") if r.fecha else None,
            "total": r.total or 0,
            "costo": r.costo or 0,
            "utilidad": r.utilidad or 0,
            "transacciones": r.transacciones or 0
        }
        for r in resultados
    ]

def obtener_productos_top(db: Session) -> List[Dict[str, Any]]:
    query = db.query(
        Producto.id,
        Producto.nombre,
        func.sum(DetalleVenta.cantidad).label("unidades_vendidas"),
        func.sum(DetalleVenta.cantidad * DetalleVenta.precio_unitario).label("ingresos_generados")
    ).join(
        DetalleVenta, DetalleVenta.producto_id == Producto.id
    ).join(
        Venta, DetalleVenta.venta_id == Venta.id
    ).filter(
        Venta.anulada == False
    ).group_by(
        Producto.id, Producto.nombre
    ).order_by(
        desc("unidades_vendidas")
    ).limit(10)
    
    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "unidades_vendidas": r.unidades_vendidas,
            "ingresos_generados": r.ingresos_generados
        }
        for r in query.all()
    ]

def obtener_utilidad_por_producto(db: Session) -> List[Dict[str, Any]]:
    # Current margin based on last sales
    query = db.query(
        Producto.id,
        Producto.nombre,
        func.sum(DetalleVenta.cantidad).label("unidades_vendidas"),
        func.sum(DetalleVenta.cantidad * DetalleVenta.precio_unitario).label("ingresos"),
        func.sum(DetalleVenta.cantidad * DetalleVenta.utilidad_unitaria_snapshot).label("utilidad")
    ).join(
        DetalleVenta, DetalleVenta.producto_id == Producto.id
    ).join(
        Venta, DetalleVenta.venta_id == Venta.id
    ).filter(
        Venta.anulada == False
    ).group_by(
        Producto.id, Producto.nombre
    ).order_by(
        desc("utilidad")
    )
    
    resultados = query.all()
    total_ingresos = sum((r.ingresos or 0) for r in resultados)
    
    data = []
    for r in resultados:
        ing = r.ingresos or 0
        util = r.utilidad or 0
        margen = (util / ing * 100) if ing > 0 else 0
        share = (ing / total_ingresos * 100) if total_ingresos > 0 else 0
        data.append({
            "id": r.id,
            "nombre": r.nombre,
            "margen_porcentaje": round(margen, 2),
            "participacion_ventas": round(share, 2),
            "utilidad_total": util
        })
    return data

def obtener_metricas_fidelizacion(db: Session) -> Dict[str, Any]:
    total_clientes = db.query(func.count(Cliente.id)).scalar() or 0
    puntos_ganados = db.query(func.sum(MovimientoPuntos.puntos)).filter(MovimientoPuntos.puntos > 0, MovimientoPuntos.tipo == 'GANADOS').scalar() or 0
    puntos_canjeados = db.query(func.sum(MovimientoPuntos.puntos)).filter(MovimientoPuntos.tipo == 'CANJEADOS').scalar() or 0
    
    # Alternatively points can be summed from Cliente table
    # puntos_ganados = db.query(func.sum(Cliente.puntos_acumulados + Cliente.puntos_canjeados)).scalar() or 0
    # puntos_canjeados = db.query(func.sum(Cliente.puntos_canjeados)).scalar() or 0
    
    tasa = (puntos_canjeados / (puntos_ganados + puntos_canjeados) * 100) if (puntos_ganados + puntos_canjeados) > 0 else 0
    
    return {
        "total_clientes": total_clientes,
        "puntos_emitidos": puntos_ganados,
        "puntos_canjeados": puntos_canjeados,
        "tasa_redencion_porcentaje": round(tasa, 2)
    }

def obtener_reporte_formalizacion(db: Session) -> Dict[str, Any]:
    # Net Sales, COGS (Raw Materials + Packaging), Gross Margin, Estimated Fixed Costs, EBITDA, Working Capital (Stock Valuation).
    ventas = db.query(func.sum(Venta.total)).filter(Venta.anulada == False).scalar() or 0
    cogs = db.query(func.sum(Venta.costo_total_snapshot)).filter(Venta.anulada == False).scalar() or 0
    
    gross_margin = ventas - cogs
    fixed_costs = 0 # To be modeled if added in future
    ebitda = gross_margin - fixed_costs
    
    # Working capital from Insumos
    insumos = db.query(Insumo).all()
    working_capital = 0
    for i in insumos:
        if i.contenido_envase and i.contenido_envase > 0:
            working_capital += (i.stock_actual / i.contenido_envase) * i.costo_promedio
            
    return {
        "ventas_netas": ventas,
        "costo_bienes_vendidos": cogs,
        "margen_bruto": gross_margin,
        "costos_fijos_estimados": fixed_costs,
        "ebitda": ebitda,
        "capital_trabajo": int(working_capital)
    }

def obtener_reporte_formalizacion_completo(db: Session) -> Dict[str, Any]:
    """
    Genera el Informe Completo de Formalización y Evaluación Financiera
    ajustado a la normativa tributaria (IVA 19% / ProPyme) y sanitaria de Chile (CORFO / Sercotec / Bancos).
    """
    res_ventas = db.query(
        func.sum(Venta.total).label("total_ventas"),
        func.sum(Venta.costo_total_snapshot).label("total_cogs"),
        func.count(Venta.id).label("total_tx")
    ).filter(Venta.anulada == False).first()

    ventas_brutas_db = res_ventas.total_ventas or 0
    cogs_bruto_db = res_ventas.total_cogs or 0
    tx_total = res_ventas.total_tx or 0

    # Usar tracción real de la base de datos
    v_bruta = ventas_brutas_db
    cogs_bruto = cogs_bruto_db if cogs_bruto_db > 0 else (round(v_bruta * 0.35) if v_bruta > 0 else 0)
    tx_total = tx_total

    # 1. Desglose Tributario Chile (IVA 19%)
    v_neta = round(v_bruta / 1.19)
    iva_debito = v_bruta - v_neta

    cogs_neto = round(cogs_bruto / 1.19)
    iva_credito_cogs = cogs_bruto - cogs_neto

    opex_afecto_bruto = 300000 # Luz, gas comercial, internet comercial
    opex_afecto_neto = round(opex_afecto_bruto / 1.19)
    iva_credito_opex = opex_afecto_bruto - opex_afecto_neto

    opex_exento = 1800000 # Arriendo comercial, remuneraciones equipo, patente, contador
    opex_fijo_neto_total = opex_afecto_neto + opex_exento

    iva_credito_total = iva_credito_cogs + iva_credito_opex
    iva_f29 = max(0, iva_debito - iva_credito_total)

    # 2. Margen Bruto y EBITDA Operativo
    margen_bruto_clp = v_neta - cogs_neto
    pct_margen_bruto = round((margen_bruto_clp / v_neta * 100.0), 2) if v_neta > 0 else 0.0

    ebitda_clp = margen_bruto_clp - opex_fijo_neto_total
    pct_ebitda = round((ebitda_clp / v_neta * 100.0), 2) if v_neta > 0 else 0.0

    ticket_promedio_neto = round(v_neta / tx_total, 2) if tx_total > 0 else 0.0

    # 3. Punto de Equilibrio Operativo
    ratio_mb = (pct_margen_bruto / 100.0) if pct_margen_bruto > 0 else 0.60
    pe_neto = round(opex_fijo_neto_total / ratio_mb) if ratio_mb > 0 else 0
    pe_bruto = round(pe_neto * 1.19)

    contribucion_unitaria = ticket_promedio_neto * ratio_mb
    pe_unidades_mes = round(opex_fijo_neto_total / contribucion_unitaria) if contribucion_unitaria > 0 else 0
    pe_unidades_dia = round(pe_unidades_mes / 26) if pe_unidades_mes > 0 else 0

    # 4. Capital de Trabajo en Inventario Actual
    insumos = db.query(Insumo).all()
    working_capital = 0
    for i in insumos:
        if i.contenido_envase and i.contenido_envase > 0:
            working_capital += (i.stock_actual / i.contenido_envase) * i.costo_promedio
    capital_trabajo_clp = int(working_capital)

    # 5. Matriz Sanitaria & Legal Chile 2026
    costos_chile = [
        {
            "etapa": "1. Legal",
            "concepto": "Constitución SpA / EIRL en Registro de Empresas y Sociedades",
            "organismo": "REEMP (Tu Empresa en un Día)",
            "costo_estimado_clp": 20000,
            "plazo_dias": 2,
            "requisitos": "Firma Electrónica Avanzada (FEA) del Representante Legal"
        },
        {
            "etapa": "2. Tributario",
            "concepto": "Certificado Digital e-Token Boleta/Factura Electrónica SII",
            "organismo": "Proveedor Acreditado (E-Cert / Acepta)",
            "costo_estimado_clp": 18000,
            "plazo_dias": 1,
            "requisitos": "Inicio de Actividades en 1ª Categoría SII (Régimen ProPyme 14 D3)"
        },
        {
            "etapa": "3. Sanitario",
            "concepto": "Arancel Solicitud Autorización Sanitaria N-01/2002",
            "organismo": "SEREMI de Salud (Portal ASIST)",
            "costo_estimado_clp": 85000,
            "plazo_dias": 20,
            "requisitos": "Plano de arquitectura sanitaria, certificado agua potable/alcantarillado, BPM"
        },
        {
            "etapa": "3. Sanitario",
            "concepto": "Trampa de Grasas en Acero Inoxidable 50 Litros",
            "organismo": "Proveedor Gastronómico / SISS",
            "costo_estimado_clp": 350000,
            "plazo_dias": 1,
            "requisitos": "Exigencia normativa SEREMI para retención de aceites bajo lavaplatos"
        },
        {
            "etapa": "3. Sanitario",
            "concepto": "Campana Inox, Extractor Techo 1/2HP y Ductos de Evacuación",
            "organismo": "Empresa Climatización Gastronómica",
            "costo_estimado_clp": 950000,
            "plazo_dias": 5,
            "requisitos": "Inyección/Extracción mecánica con salida 2 metros sobre la cumbrera"
        },
        {
            "etapa": "4. Municipal",
            "concepto": "Patente Comercial Definitiva Gastronómica",
            "organismo": "Ilustre Municipalidad",
            "costo_estimado_clp": 80000,
            "plazo_dias": 10,
            "requisitos": "Resolución Sanitaria Aprobada + Uso de Suelo DOM Compatible"
        }
    ]

    total_formalizacion = sum(item["costo_estimado_clp"] for item in costos_chile)

    # 6. Plan de Inversión Recomendado ($6.000.000 CLP)
    plan_inversion = [
        {
            "categoria": "Equipamiento Gastronómico",
            "concepto": "Plancha churrasquera 80x50, freidora doble 18L, visicooler 400L, congelador 300L, mesones inox y POS",
            "monto_clp": 3300000,
            "porcentaje": 55.0,
            "fuente": "Subsidio Concursable (CORFO / Sercotec)"
        },
        {
            "categoria": "Habilitación Sanitaria",
            "concepto": "Campana con extractor, trampa de grasa inox 50L, extintor Clase K y lavamanos con pedal",
            "monto_clp": 1500000,
            "porcentaje": 25.0,
            "fuente": "Subsidio Concursable (CORFO / Sercotec)"
        },
        {
            "categoria": "Tramitación & Permisos",
            "concepto": "Arancel SEREMI, Firma Electrónica, Certificado SII, Arancel Municipal y Carpetas Técnicas",
            "monto_clp": 600000,
            "porcentaje": 10.0,
            "fuente": "Aporte Titular / Financiamiento Propio"
        },
        {
            "categoria": "Capital de Trabajo Inicial",
            "concepto": "Stock de insumos alimenticios críticos para 1-2 meses y packaging compostable",
            "monto_clp": 600000,
            "porcentaje": 10.0,
            "fuente": "Subsidio Concursable / Aporte Titular"
        }
    ]

    return {
        "desglose_tributario": {
            "ventas_brutas": v_bruta,
            "ventas_netas": v_neta,
            "iva_debito_fiscal": iva_debito,
            "cogs_bruto": cogs_bruto,
            "cogs_neto": cogs_neto,
            "iva_credito_cogs": iva_credito_cogs,
            "opex_afecto_bruto": opex_afecto_bruto,
            "opex_afecto_neto": opex_afecto_neto,
            "iva_credito_opex": iva_credito_opex,
            "opex_exento": opex_exento,
            "opex_fijo_neto_total": opex_fijo_neto_total,
            "estimacion_iva_f29_a_pagar": iva_f29
        },
        "margen_ebitda": {
            "margen_bruto_clp": margen_bruto_clp,
            "margen_bruto_porcentaje": pct_margen_bruto,
            "ebitda_clp": ebitda_clp,
            "ebitda_porcentaje": pct_ebitda,
            "ticket_promedio_neto": ticket_promedio_neto,
            "transacciones_totales": tx_total
        },
        "punto_equilibrio": {
            "pe_neto_clp": pe_neto,
            "pe_bruto_clp": pe_bruto,
            "pe_unidades_mes": pe_unidades_mes,
            "pe_unidades_dia": pe_unidades_dia,
            "promociones_diarias_requeridas": pe_unidades_dia
        },
        "costos_formalizacion_chile": costos_chile,
        "plan_inversion_sugerido": plan_inversion,
        "total_formalizacion_estimado": total_formalizacion,
        "capital_trabajo_inventario": capital_trabajo_clp,
        "regimen_tributario_sugerido": "ProPyme General 14 D3 (Tasa 10%/25% sobre Utilidad Neta)"
    }

