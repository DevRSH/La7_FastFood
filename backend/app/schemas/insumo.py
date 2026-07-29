from pydantic import BaseModel, ConfigDict
from typing import Optional

class InsumoBase(BaseModel):
    nombre: str
    unidad: str
    contenido_envase: float
    costo_promedio: int
    stock_actual: float = 0.0
    stock_minimo: float = 0.0
    dias_alerta: int = 7
    activo: bool = True

class InsumoCreate(InsumoBase):
    pass

class InsumoUpdate(BaseModel):
    nombre: Optional[str] = None
    unidad: Optional[str] = None
    contenido_envase: Optional[float] = None
    costo_promedio: Optional[int] = None
    stock_actual: Optional[float] = None
    stock_minimo: Optional[float] = None
    dias_alerta: Optional[int] = None
    activo: Optional[bool] = None

class InsumoResponse(InsumoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
