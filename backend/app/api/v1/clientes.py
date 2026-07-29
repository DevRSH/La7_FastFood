from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.cliente import Cliente, MovimientoPuntos
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, MovimientoPuntosResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=List[ClienteResponse])
def api_listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Cliente).filter(Cliente.activo == True).order_by(Cliente.nombre).offset(skip).limit(limit).all()

@router.get("/buscar", response_model=ClienteResponse)
def api_buscar_cliente_por_telefono(telefono: str = Query(...), db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.telefono == telefono, Cliente.activo == True).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.get("/telefono/{telefono}", response_model=ClienteResponse)
def api_cliente_por_telefono(telefono: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.telefono == telefono, Cliente.activo == True).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/", response_model=ClienteResponse)
def api_crear_cliente(cliente_in: ClienteCreate, db: Session = Depends(get_db)):
    existente = db.query(Cliente).filter(Cliente.telefono == cliente_in.telefono).first()
    if existente:
        if not existente.activo:
            existente.activo = True
            existente.nombre = cliente_in.nombre
            if cliente_in.direccion:
                existente.direccion = cliente_in.direccion
            db.commit()
            db.refresh(existente)
            return existente
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este teléfono")

    nuevo = Cliente(
        nombre=cliente_in.nombre,
        telefono=cliente_in.telefono,
        direccion=cliente_in.direccion
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{cliente_id}", response_model=ClienteResponse)
def api_actualizar_cliente(cliente_id: int, cliente_in: ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if cliente_in.nombre is not None:
        cliente.nombre = cliente_in.nombre
    if cliente_in.telefono is not None:
        cliente.telefono = cliente_in.telefono
    if cliente_in.direccion is not None:
        cliente.direccion = cliente_in.direccion
    if cliente_in.puntos_acumulados is not None:
        cliente.puntos_acumulados = cliente_in.puntos_acumulados

    db.commit()
    db.refresh(cliente)
    return cliente

@router.delete("/{cliente_id}")
def api_eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente.activo = False
    db.commit()
    return {"message": "Cliente eliminado"}

@router.get("/{cliente_id}/historial", response_model=List[MovimientoPuntosResponse])
def api_historial_puntos(cliente_id: int, db: Session = Depends(get_db)):
    return db.query(MovimientoPuntos).filter(MovimientoPuntos.cliente_id == cliente_id).order_by(MovimientoPuntos.fecha.desc()).all()
