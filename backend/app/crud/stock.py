from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.stock import MovimientoStock

async def get_movimientos(db: AsyncSession, insumo_id: int | None = None, skip: int = 0, limit: int = 100) -> list[MovimientoStock]:
    """Obtiene el historial de movimientos de stock."""
    query = select(MovimientoStock).order_by(MovimientoStock.fecha.desc())
    
    if insumo_id is not None:
        query = query.where(MovimientoStock.insumo_id == insumo_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    
    return list(result.scalars().all())
