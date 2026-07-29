from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.packaging import PackagingCreate, PackagingUpdate, PackagingResponse
from app.crud.packaging import get_packagings, get_packaging, create_packaging, update_packaging, delete_packaging

router = APIRouter(prefix="/packaging", tags=["Packaging"])

@router.get("/", response_model=List[PackagingResponse])
def read_packagings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_packagings(db, skip=skip, limit=limit)

@router.get("/{packaging_id}", response_model=PackagingResponse)
def read_packaging(packaging_id: int, db: Session = Depends(get_db)):
    db_packaging = get_packaging(db, packaging_id)
    if db_packaging is None:
        raise HTTPException(status_code=404, detail="Packaging no encontrado")
    return db_packaging

@router.post("/", response_model=PackagingResponse)
def create_packaging_endpoint(packaging: PackagingCreate, db: Session = Depends(get_db)):
    return create_packaging(db, packaging)

@router.put("/{packaging_id}", response_model=PackagingResponse)
def update_packaging_endpoint(packaging_id: int, packaging: PackagingUpdate, db: Session = Depends(get_db)):
    db_packaging = get_packaging(db, packaging_id)
    if db_packaging is None:
        raise HTTPException(status_code=404, detail="Packaging no encontrado")
    return update_packaging(db, db_packaging, packaging)

@router.delete("/{packaging_id}")
def delete_packaging_endpoint(packaging_id: int, db: Session = Depends(get_db)):
    db_packaging = get_packaging(db, packaging_id)
    if db_packaging is None:
        raise HTTPException(status_code=404, detail="Packaging no encontrado")
    delete_packaging(db, db_packaging)
    return {"message": "Packaging eliminado exitosamente"}
