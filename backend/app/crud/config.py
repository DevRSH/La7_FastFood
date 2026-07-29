from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.config import ConfigNegocio
from app.schemas.config import ConfigCreate, ConfigUpdate

def get_config(db: Session):
    stmt = select(ConfigNegocio).limit(1)
    config = db.execute(stmt).scalars().first()
    return config

def create_config(db: Session, config: ConfigCreate):
    db_config = ConfigNegocio(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

def update_config(db: Session, db_config: ConfigNegocio, config_update: ConfigUpdate):
    update_data = config_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config
