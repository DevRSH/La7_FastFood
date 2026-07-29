from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.dependencies import get_db
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse
from app.crud.producto import get_productos, get_producto, create_producto, update_producto, delete_producto
from app.services.costos import calcular_costo_producto

router = APIRouter(prefix="/productos", tags=["Productos"])

@router.get("/", response_model=List[ProductoResponse])
async def read_productos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await get_productos(db, skip=skip, limit=limit)

@router.get("/{producto_id}", response_model=ProductoResponse)
async def read_producto(producto_id: int, db: AsyncSession = Depends(get_db)):
    db_producto = await get_producto(db, producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto

@router.post("/", response_model=ProductoResponse)
async def create_producto_endpoint(producto: ProductoCreate, db: AsyncSession = Depends(get_db)):
    return await create_producto(db, producto)

@router.put("/{producto_id}", response_model=ProductoResponse)
async def update_producto_endpoint(producto_id: int, producto: ProductoUpdate, db: AsyncSession = Depends(get_db)):
    db_producto = await get_producto(db, producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return await update_producto(db, db_producto, producto)

@router.delete("/{producto_id}")
async def delete_producto_endpoint(producto_id: int, db: AsyncSession = Depends(get_db)):
    db_producto = await get_producto(db, producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await delete_producto(db, db_producto)
    return {"message": "Producto eliminado exitosamente"}

@router.get("/{producto_id}/costos", response_model=Dict[str, Any])
async def preview_costos(producto_id: int, db: AsyncSession = Depends(get_db)):
    """Obtiene el desglose de costos y márgenes de un producto."""
    costos = await calcular_costo_producto(producto_id, db)
    if not costos:
        raise HTTPException(status_code=404, detail="Producto no encontrado o faltan datos")
    return costos

