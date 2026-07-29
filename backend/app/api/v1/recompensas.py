from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.cliente import Recompensa
from app.schemas.recompensa import RecompensaCreate, RecompensaResponse

router = APIRouter(prefix="/recompensas", tags=["Recompensas"])

@router.get("/", response_model=List[RecompensaResponse])
def api_listar_recompensas(db: Session = Depends(get_db)):
    return db.query(Recompensa).filter(Recompensa.activa == True).order_by(Recompensa.costo_puntos.asc()).all()

@router.post("/", response_model=RecompensaResponse)
def api_crear_recompensa(rec_in: RecompensaCreate, db: Session = Depends(get_db)):
    nueva = Recompensa(**rec_in.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.put("/{recompensa_id}", response_model=RecompensaResponse)
def api_actualizar_recompensa(recompensa_id: int, rec_in: RecompensaCreate, db: Session = Depends(get_db)):
    rec = db.query(Recompensa).filter(Recompensa.id == recompensa_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada")
    for key, value in rec_in.model_dump().items():
        setattr(rec, key, value)
    db.commit()
    db.refresh(rec)
    return rec
