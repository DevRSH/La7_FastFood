from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigResponse
from app.crud.config import get_config, create_config, update_config

router = APIRouter(prefix="/config", tags=["Configuracion"])

@router.get("/", response_model=ConfigResponse)
def read_config(db: Session = Depends(get_db)):
    config = get_config(db)
    if not config:
        raise HTTPException(status_code=404, detail="Configuracion no encontrada")
    return config

@router.post("/", response_model=ConfigResponse)
def create_config_endpoint(config: ConfigCreate, db: Session = Depends(get_db)):
    existing = get_config(db)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una configuracion")
    return create_config(db, config)

@router.put("/", response_model=ConfigResponse)
def update_config_endpoint(config: ConfigUpdate, db: Session = Depends(get_db)):
    db_config = get_config(db)
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuracion no encontrada")
    return update_config(db, db_config, config)
