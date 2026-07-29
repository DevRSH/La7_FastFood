from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class ProductoInsumoBase(BaseModel):
    insumo_id: int
    cantidad_usada: float
    merma_porcentaje: float = 0.0

class ProductoUtensilioBase(BaseModel):
    utensilio_id: int
    horas_uso_lote: float

class ProductoPackagingBase(BaseModel):
    packaging_id: int
    cantidad_por_unidad: int = 1

class ProductoBase(BaseModel):
    categoria_id: int
    nombre: str
    rendimiento_lote: int
    tiempo_preparacion_min: int
    precio_venta: int
    imagen_url: Optional[str] = None
    activo: bool = True

class ProductoCreate(ProductoBase):
    ingredientes: List[ProductoInsumoBase] = []
    utensilios: List[ProductoUtensilioBase] = []
    packagings: List[ProductoPackagingBase] = []

class ProductoUpdate(BaseModel):
    categoria_id: Optional[int] = None
    nombre: Optional[str] = None
    rendimiento_lote: Optional[int] = None
    tiempo_preparacion_min: Optional[int] = None
    precio_venta: Optional[int] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None
    ingredientes: Optional[List[ProductoInsumoBase]] = None
    utensilios: Optional[List[ProductoUtensilioBase]] = None
    packagings: Optional[List[ProductoPackagingBase]] = None

class ProductoResponse(ProductoBase):
    id: int
    ingredientes: List[ProductoInsumoBase] = []
    utensilios_receta: List[ProductoUtensilioBase] = []
    packaging_receta: List[ProductoPackagingBase] = []
    
    model_config = ConfigDict(from_attributes=True)
