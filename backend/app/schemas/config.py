from pydantic import BaseModel, ConfigDict
from typing import Optional

class ConfigBase(BaseModel):
    valor_hora_trabajo: int
    comision_plataforma_pct: float
    reparto_tipo: str
    reparto_valor: int
    moneda: str = "CLP"

class ConfigCreate(ConfigBase):
    pass

class ConfigUpdate(BaseModel):
    valor_hora_trabajo: Optional[int] = None
    comision_plataforma_pct: Optional[float] = None
    reparto_tipo: Optional[str] = None
    reparto_valor: Optional[int] = None
    moneda: Optional[str] = None

class ConfigResponse(ConfigBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
