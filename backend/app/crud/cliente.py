from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.models.cliente import Cliente, MovimientoPuntos
from app.schemas.cliente import ClienteCreate

def get_clientes(db: Session, skip: int = 0, limit: int = 100) -> List[Cliente]:
    return db.execute(select(Cliente).offset(skip).limit(limit)).scalars().all()

def get_cliente_by_telefono(db: Session, telefono: str) -> Cliente | None:
    return db.execute(select(Cliente).filter(Cliente.telefono == telefono)).scalars().first()

def get_cliente(db: Session, cliente_id: int) -> Cliente | None:
    return db.execute(select(Cliente).filter(Cliente.id == cliente_id)).scalars().first()

def create_cliente(db: Session, cliente: ClienteCreate) -> Cliente:
    db_obj = Cliente(**cliente.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_historial_puntos(db: Session, cliente_id: int, skip: int = 0, limit: int = 100) -> List[MovimientoPuntos]:
    return db.execute(
        select(MovimientoPuntos)
        .filter(MovimientoPuntos.cliente_id == cliente_id)
        .order_by(MovimientoPuntos.id.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()

def update_cliente(db: Session, cliente_id: int, obj_in: dict) -> Cliente | None:
    db_obj = get_cliente(db, cliente_id)
    if not db_obj:
        return None
    for field, value in obj_in.items():
        if value is not None and hasattr(db_obj, field):
            setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_cliente(db: Session, cliente_id: int) -> bool:
    db_obj = get_cliente(db, cliente_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
