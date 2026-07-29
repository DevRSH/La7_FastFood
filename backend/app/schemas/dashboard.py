from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ResumenDashboard(BaseModel):
    ventas_totales: int
    costos_totales: int
    utilidad_total: int
    margen_promedio: float
    ticket_promedio: float
    cantidad_transacciones: int
    clientes_activos: int

class VentaDiaria(BaseModel):
    fecha: Optional[str]
    total: int
    costo: int
    utilidad: int
    transacciones: int

class ProductoTop(BaseModel):
    id: int
    nombre: str
    unidades_vendidas: int
    ingresos_generados: int

class UtilidadProducto(BaseModel):
    id: int
    nombre: str
    margen_porcentaje: float
    participacion_ventas: float
    utilidad_total: int

class MetricasFidelizacion(BaseModel):
    total_clientes: int
    puntos_emitidos: int
    puntos_canjeados: int
    tasa_redencion_porcentaje: float

class CostoFormalizacionItemDTO(BaseModel):
    etapa: str
    concepto: str
    organismo: str
    costo_estimado_clp: int
    plazo_dias: int
    requisitos: str

class PlanInversionItemDTO(BaseModel):
    categoria: str
    concepto: str
    monto_clp: int
    porcentaje: float
    fuente: str

class DesgloseTributarioDTO(BaseModel):
    ventas_brutas: int
    ventas_netas: int
    iva_debito_fiscal: int
    cogs_bruto: int
    cogs_neto: int
    iva_credito_cogs: int
    opex_afecto_bruto: int
    opex_afecto_neto: int
    iva_credito_opex: int
    opex_exento: int
    opex_fijo_neto_total: int
    estimacion_iva_f29_a_pagar: int

class MargenYEbitdaDTO(BaseModel):
    margen_bruto_clp: int
    margen_bruto_porcentaje: float
    ebitda_clp: int
    ebitda_porcentaje: float
    ticket_promedio_neto: float
    transacciones_totales: int

class PuntoEquilibrioDTO(BaseModel):
    pe_neto_clp: int
    pe_bruto_clp: int
    pe_unidades_mes: int
    pe_unidades_dia: int
    promociones_diarias_requeridas: int

class ReporteFormalizacionCompleto(BaseModel):
    desglose_tributario: DesgloseTributarioDTO
    margen_ebitda: MargenYEbitdaDTO
    punto_equilibrio: PuntoEquilibrioDTO
    costos_formalizacion_chile: List[CostoFormalizacionItemDTO]
    plan_inversion_sugerido: List[PlanInversionItemDTO]
    total_formalizacion_estimado: int
    capital_trabajo_inventario: int
    regimen_tributario_sugerido: str

class ReporteFormalizacion(BaseModel):
    ventas_netas: int
    costo_bienes_vendidos: int
    margen_bruto: int
    costos_fijos_estimados: int
    ebitda: int
    capital_trabajo: int

