from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.schemas.utensilio import UtensilioCreate, UtensilioUpdate, UtensilioResponse
from app.crud.utensilio import get_utensilios, get_utensilio, create_utensilio, update_utensilio, delete_utensilio

router = APIRouter(prefix="/utensilios", tags=["Utensilios"])

@router.get("/", response_model=List[UtensilioResponse])
def read_utensilios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_utensilios(db, skip=skip, limit=limit)

@router.get("/{utensilio_id}", response_model=UtensilioResponse)
def read_utensilio(utensilio_id: int, db: Session = Depends(get_db)):
    db_utensilio = get_utensilio(db, utensilio_id)
    if db_utensilio is None:
        raise HTTPException(status_code=404, detail="Utensilio no encontrado")
    return db_utensilio

@router.post("/", response_model=UtensilioResponse)
def create_utensilio_endpoint(utensilio: UtensilioCreate, db: Session = Depends(get_db)):
    return create_utensilio(db, utensilio)

@router.put("/{utensilio_id}", response_model=UtensilioResponse)
def update_utensilio_endpoint(utensilio_id: int, utensilio: UtensilioUpdate, db: Session = Depends(get_db)):
    db_utensilio = get_utensilio(db, utensilio_id)
    if db_utensilio is None:
        raise HTTPException(status_code=404, detail="Utensilio no encontrado")
    return update_utensilio(db, db_utensilio, utensilio)

@router.delete("/{utensilio_id}")
def delete_utensilio_endpoint(utensilio_id: int, db: Session = Depends(get_db)):
    db_utensilio = get_utensilio(db, utensilio_id)
    if db_utensilio is None:
        raise HTTPException(status_code=404, detail="Utensilio no encontrado")
    delete_utensilio(db, db_utensilio)
    return {"message": "Utensilio eliminado exitosamente"}
