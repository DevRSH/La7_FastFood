from pydantic import BaseModel, ConfigDict
from typing import Optional

class UtensilioBase(BaseModel):
    nombre: str
    costo_compra: int
    vida_util_horas: float

class UtensilioCreate(UtensilioBase):
    pass

class UtensilioUpdate(BaseModel):
    nombre: Optional[str] = None
    costo_compra: Optional[int] = None
    vida_util_horas: Optional[float] = None

class UtensilioResponse(UtensilioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
