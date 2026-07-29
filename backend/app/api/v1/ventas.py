from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.dependencies import get_db
from app.models.venta import Venta
from app.schemas.venta import VentaCreate, VentaResponse
from app.services.pos import registrar_venta, anular_venta

router = APIRouter(prefix="/ventas", tags=["Ventas"])

@router.post("/", response_model=VentaResponse)
async def api_registrar_venta(venta_in: VentaCreate, db: AsyncSession = Depends(get_db)):
    return await registrar_venta(db, venta_in)

@router.get("/", response_model=List[VentaResponse])
async def api_listar_ventas(
    skip: int = 0,
    limit: int = 50,
    cliente_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Venta).options(selectinload(Venta.detalles))
    if cliente_id:
        stmt = stmt.where(Venta.cliente_id == cliente_id)
    stmt = stmt.order_by(Venta.fecha.desc()).offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.get("/{venta_id}", response_model=VentaResponse)
async def api_obtener_venta(venta_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Venta).options(selectinload(Venta.detalles)).where(Venta.id == venta_id)
    res = await db.execute(stmt)
    venta = res.scalars().first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta

@router.post("/{venta_id}/anular", response_model=VentaResponse)
async def api_anular_venta(venta_id: int, db: AsyncSession = Depends(get_db)):
    return await anular_venta(db, venta_id)

