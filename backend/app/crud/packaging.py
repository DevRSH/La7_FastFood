from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.packaging import Packaging
from app.schemas.packaging import PackagingCreate, PackagingUpdate

def get_packagings(db: Session, skip: int = 0, limit: int = 100):
    stmt = select(Packaging).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()

def get_packaging(db: Session, packaging_id: int):
    return db.get(Packaging, packaging_id)

def create_packaging(db: Session, packaging: PackagingCreate):
    db_packaging = Packaging(**packaging.model_dump())
    db.add(db_packaging)
    db.commit()
    db.refresh(db_packaging)
    return db_packaging

def update_packaging(db: Session, db_packaging: Packaging, packaging_update: PackagingUpdate):
    update_data = packaging_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_packaging, key, value)
    db.add(db_packaging)
    db.commit()
    db.refresh(db_packaging)
    return db_packaging

def delete_packaging(db: Session, db_packaging: Packaging):
    db.delete(db_packaging)
    db.commit()
