from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.utensilio import Utensilio
from app.schemas.utensilio import UtensilioCreate, UtensilioUpdate

def get_utensilios(db: Session, skip: int = 0, limit: int = 100):
    stmt = select(Utensilio).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()

def get_utensilio(db: Session, utensilio_id: int):
    return db.get(Utensilio, utensilio_id)

def create_utensilio(db: Session, utensilio: UtensilioCreate):
    db_utensilio = Utensilio(**utensilio.model_dump())
    db.add(db_utensilio)
    db.commit()
    db.refresh(db_utensilio)
    return db_utensilio

def update_utensilio(db: Session, db_utensilio: Utensilio, utensilio_update: UtensilioUpdate):
    update_data = utensilio_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_utensilio, key, value)
    db.add(db_utensilio)
    db.commit()
    db.refresh(db_utensilio)
    return db_utensilio

def delete_utensilio(db: Session, db_utensilio: Utensilio):
    db.delete(db_utensilio)
    db.commit()
