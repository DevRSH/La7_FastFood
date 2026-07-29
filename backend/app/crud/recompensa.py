from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.models.cliente import Recompensa
from app.schemas.recompensa import RecompensaCreate, RecompensaUpdate

def get_recompensas(db: Session, skip: int = 0, limit: int = 100, activas_only: bool = False) -> List[Recompensa]:
    query = select(Recompensa)
    if activas_only:
        query = query.filter(Recompensa.activa == True)
    return db.execute(query.offset(skip).limit(limit)).scalars().all()

def get_recompensa(db: Session, recompensa_id: int) -> Recompensa | None:
    return db.execute(select(Recompensa).filter(Recompensa.id == recompensa_id)).scalars().first()

def create_recompensa(db: Session, recompensa: RecompensaCreate) -> Recompensa:
    db_obj = Recompensa(**recompensa.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_recompensa(db: Session, recompensa_id: int, recompensa_in: RecompensaUpdate) -> Recompensa | None:
    db_obj = get_recompensa(db, recompensa_id)
    if not db_obj:
        return None
    update_data = recompensa_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
