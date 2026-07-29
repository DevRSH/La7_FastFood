from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.compra import CompraInsumo

async def get_compras(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[CompraInsumo]:
    """Obtiene el historial de compras."""
    result = await db.execute(
        select(CompraInsumo)
        .order_by(CompraInsumo.fecha.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
