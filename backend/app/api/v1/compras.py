from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.dependencies import get_db
from app.schemas.compra import CompraInsumoCreate, CompraInsumoResponse
from app.services.stock import registrar_compra
from app.crud.compra import get_compras

router = APIRouter(prefix="/compras", tags=["Compras"])

@router.post("/", response_model=CompraInsumoResponse)
async def create_compra(
    compra_in: CompraInsumoCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra una nueva compra de insumos.
    Calcula automáticamente el nuevo Costo Promedio Ponderado (CPP)
    y actualiza el stock del insumo.
    """
    compra = await registrar_compra(
        db=db,
        insumo_id=compra_in.insumo_id,
        cantidad=compra_in.cantidad,
        precio_total=compra_in.precio_total,
        proveedor=compra_in.proveedor,
        nota=compra_in.nota
    )
    return compra

@router.get("/", response_model=List[CompraInsumoResponse])
async def list_compras(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Lista el historial de compras registradas.
    """
    return await get_compras(db, skip=skip, limit=limit)
