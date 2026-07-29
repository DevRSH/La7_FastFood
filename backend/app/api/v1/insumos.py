from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.schemas.insumo import InsumoCreate, InsumoUpdate, InsumoResponse
from app.crud.insumo import get_insumos, get_insumo, create_insumo, update_insumo, delete_insumo

router = APIRouter(prefix="/insumos", tags=["Insumos"])

@router.get("/", response_model=List[InsumoResponse])
def read_insumos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_insumos(db, skip=skip, limit=limit)

@router.get("/{insumo_id}", response_model=InsumoResponse)
def read_insumo(insumo_id: int, db: Session = Depends(get_db)):
    db_insumo = get_insumo(db, insumo_id)
    if db_insumo is None:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return db_insumo

@router.post("/", response_model=InsumoResponse)
def create_insumo_endpoint(insumo: InsumoCreate, db: Session = Depends(get_db)):
    return create_insumo(db, insumo)

@router.put("/{insumo_id}", response_model=InsumoResponse)
def update_insumo_endpoint(insumo_id: int, insumo: InsumoUpdate, db: Session = Depends(get_db)):
    db_insumo = get_insumo(db, insumo_id)
    if db_insumo is None:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return update_insumo(db, db_insumo, insumo)

@router.delete("/{insumo_id}")
def delete_insumo_endpoint(insumo_id: int, db: Session = Depends(get_db)):
    db_insumo = get_insumo(db, insumo_id)
    if db_insumo is None:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    delete_insumo(db, db_insumo)
    return {"message": "Insumo eliminado exitosamente"}
