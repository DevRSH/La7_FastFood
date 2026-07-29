from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CompraInsumoBase(BaseModel):
    insumo_id: int
    cantidad: float
    precio_total: int
    proveedor: Optional[str] = None
    nota: Optional[str] = None

class CompraInsumoCreate(CompraInsumoBase):
    pass

class CompraInsumoResponse(CompraInsumoBase):
    id: int
    precio_unitario: int
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)
