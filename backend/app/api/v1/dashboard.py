from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.dashboard import (
    obtener_resumen_dashboard,
    obtener_ventas_diarias,
    obtener_productos_top,
    obtener_utilidad_por_producto,
    obtener_metricas_fidelizacion,
    obtener_reporte_formalizacion,
    obtener_reporte_formalizacion_completo
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/resumen")
def api_resumen_dashboard(
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    return obtener_resumen_dashboard(db, fecha_inicio, fecha_fin)

@router.get("/ventas-diarias")
def api_ventas_diarias(dias: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    return obtener_ventas_diarias(db, dias)

@router.get("/productos-top")
def api_productos_top(db: Session = Depends(get_db)):
    return obtener_productos_top(db)

@router.get("/utilidad-por-producto")
def api_utilidad_por_producto(db: Session = Depends(get_db)):
    return obtener_utilidad_por_producto(db)

@router.get("/fidelizacion")
def api_metricas_fidelizacion(db: Session = Depends(get_db)):
    return obtener_metricas_fidelizacion(db)

@router.get("/reporte-formalizacion")
def api_reporte_formalizacion(db: Session = Depends(get_db)):
    return obtener_reporte_formalizacion(db)

@router.get("/reporte-formalizacion-completo")
def api_reporte_formalizacion_completo(db: Session = Depends(get_db)):
    return obtener_reporte_formalizacion_completo(db)

