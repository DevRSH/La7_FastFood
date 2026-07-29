from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.models.venta import Venta

def get_ventas(db: Session, skip: int = 0, limit: int = 100) -> List[Venta]:
    return db.execute(select(Venta).order_by(Venta.id.desc()).offset(skip).limit(limit)).scalars().all()

def get_venta(db: Session, venta_id: int) -> Venta | None:
    return db.execute(select(Venta).filter(Venta.id == venta_id)).scalars().first()
