from pydantic import BaseModel, ConfigDict
from typing import Optional

class RecompensaCreate(BaseModel):
    nombre: str
    tipo: str  # PRODUCTO_GRATIS, DESCUENTO_FIJO, DESCUENTO_PCT
    costo_puntos: int
    producto_id: Optional[int] = None
    valor_descuento: int = 0
    activa: bool = True

class RecompensaResponse(BaseModel):
    id: int
    nombre: str
    tipo: str
    costo_puntos: int
    producto_id: Optional[int] = None
    valor_descuento: int
    activa: bool
    model_config = ConfigDict(from_attributes=True)
