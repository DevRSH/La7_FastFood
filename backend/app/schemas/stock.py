from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class MovimientoStockBase(BaseModel):
    insumo_id: int
    tipo: str
    cantidad: float
    costo_unitario: int
    stock_resultante: float
    referencia_id: Optional[int] = None
    referencia_tipo: Optional[str] = None
    nota: Optional[str] = None

class MovimientoStockCreate(MovimientoStockBase):
    pass

class MovimientoStockResponse(MovimientoStockBase):
    id: int
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)

class AjusteStockCreate(BaseModel):
    insumo_id: int
    nuevo_stock: float
    nota: Optional[str] = None

class ValorizadoResponse(BaseModel):
    total_valorizado: int
    total_insumos: int
    insumos_bajo_stock: int
