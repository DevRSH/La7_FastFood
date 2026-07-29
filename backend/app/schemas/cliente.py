from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ClienteCreate(BaseModel):
    nombre: str
    telefono: str
    direccion: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    puntos_acumulados: Optional[int] = None

class ClienteResponse(BaseModel):
    id: int
    nombre: str
    telefono: str
    direccion: Optional[str] = None
    puntos_acumulados: int
    puntos_canjeados: int
    total_compras: int
    total_gastado: int
    primera_compra: Optional[datetime] = None
    ultima_compra: Optional[datetime] = None
    activo: bool
    model_config = ConfigDict(from_attributes=True)

class MovimientoPuntosResponse(BaseModel):
    id: int
    cliente_id: int
    venta_id: Optional[int] = None
    tipo: str
    puntos: int
    saldo_resultante: int
    descripcion: Optional[str] = None
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)
