from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.insumo import Insumo
from app.schemas.insumo import InsumoCreate, InsumoUpdate

def get_insumos(db: Session, skip: int = 0, limit: int = 100):
    stmt = select(Insumo).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()

def get_insumo(db: Session, insumo_id: int):
    return db.get(Insumo, insumo_id)

def create_insumo(db: Session, insumo: InsumoCreate):
    db_insumo = Insumo(**insumo.model_dump())
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    return db_insumo

def update_insumo(db: Session, db_insumo: Insumo, insumo_update: InsumoUpdate):
    update_data = insumo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_insumo, key, value)
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    return db_insumo

def delete_insumo(db: Session, db_insumo: Insumo):
    db.delete(db_insumo)
    db.commit()
