from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.dependencies import get_db
from app.schemas.stock import MovimientoStockResponse, AjusteStockCreate, ValorizadoResponse
from app.schemas.insumo import InsumoResponse
from app.services.stock import ajustar_stock, obtener_alertas, obtener_valorizado
from app.crud.stock import get_movimientos

router = APIRouter(prefix="/stock", tags=["Stock"])

@router.get("/alertas", response_model=List[InsumoResponse])
async def list_alertas(db: AsyncSession = Depends(get_db)):
    """
    Obtiene los insumos que están por debajo o igual a su stock mínimo.
    """
    return await obtener_alertas(db)

@router.get("/movimientos", response_model=List[MovimientoStockResponse])
async def list_movimientos(
    insumo_id: Optional[int] = Query(None, description="Filtrar por ID de insumo"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene el historial de movimientos de stock.
    """
    return await get_movimientos(db, insumo_id=insumo_id, skip=skip, limit=limit)

@router.post("/ajuste", response_model=MovimientoStockResponse)
async def create_ajuste(
    ajuste_in: AjusteStockCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Realiza un ajuste manual de stock para un insumo.
    """
    movimiento = await ajustar_stock(
        db=db,
        insumo_id=ajuste_in.insumo_id,
        nuevo_stock=ajuste_in.nuevo_stock,
        nota=ajuste_in.nota
    )
    return movimiento

@router.get("/valorizado", response_model=ValorizadoResponse)
async def get_valorizado(db: AsyncSession = Depends(get_db)):
    """
    Obtiene la valoración total del inventario basada en el CPP actual.
    """
    return await obtener_valorizado(db)
