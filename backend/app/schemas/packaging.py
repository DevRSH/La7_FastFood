from pydantic import BaseModel, ConfigDict
from typing import Optional

class PackagingBase(BaseModel):
    nombre: str
    costo_unitario: int

class PackagingCreate(PackagingBase):
    pass

class PackagingUpdate(BaseModel):
    nombre: Optional[str] = None
    costo_unitario: Optional[int] = None

class PackagingResponse(PackagingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
