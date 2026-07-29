from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ModificadorDetalleCreate(BaseModel):
    modificador_id: int
    precio_adicional: int = 0

class DetalleVentaCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: int
    modificadores: List[ModificadorDetalleCreate] = []

class VentaCreate(BaseModel):
    cliente_id: Optional[int] = None
    medio_pago: str = "efectivo"
    canal: str = "local"
    monto_recibido: int = 0
    puntos_canjeados: int = 0
    descuento_fidelizacion: int = 0
    detalles: List[DetalleVentaCreate]

class ModificadorDetalleResponse(BaseModel):
    id: int
    modificador_id: int
    precio_adicional: int
    model_config = ConfigDict(from_attributes=True)

class DetalleVentaResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: int
    costo_unitario_snapshot: int
    utilidad_unitaria_snapshot: int
    modificadores: List[ModificadorDetalleResponse] = []
    model_config = ConfigDict(from_attributes=True)

class VentaResponse(BaseModel):
    id: int
    numero_ticket: str
    cliente_id: Optional[int] = None
    total: int
    costo_total_snapshot: int
    utilidad_snapshot: int
    medio_pago: str
    canal: str
    monto_recibido: int
    vuelto: int
    puntos_ganados: int
    puntos_canjeados: int
    descuento_fidelizacion: int
    anulada: bool
    fecha: datetime
    detalles: List[DetalleVentaResponse] = []
    model_config = ConfigDict(from_attributes=True)
