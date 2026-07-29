from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.insumo import Insumo
from app.models.compra import CompraInsumo
from app.models.stock import MovimientoStock

async def registrar_compra(db: AsyncSession, insumo_id: int, cantidad: float, precio_total: int, proveedor: str | None = None, nota: str | None = None) -> CompraInsumo:
    """Registra una compra de insumos y actualiza stock/CPP."""
    result = await db.execute(select(Insumo).where(Insumo.id == insumo_id))
    insumo = result.scalar_one_or_none()
    
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
    if cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        
    precio_unitario = int(precio_total / cantidad)
    
    # Calcular nuevo CPP (Costo Promedio Ponderado)
    stock_total_nuevo = insumo.stock_actual + cantidad
    if stock_total_nuevo > 0:
        nuevo_costo = int((insumo.stock_actual * insumo.costo_promedio + precio_total) / stock_total_nuevo)
    else:
        nuevo_costo = precio_unitario
        
    # Actualizar insumo
    insumo.stock_actual = stock_total_nuevo
    insumo.costo_promedio = nuevo_costo
    
    # Crear compra
    compra = CompraInsumo(
        insumo_id=insumo_id,
        cantidad=cantidad,
        precio_total=precio_total,
        precio_unitario=precio_unitario,
        proveedor=proveedor,
        nota=nota
    )
    db.add(compra)
    await db.flush() # Para obtener el ID de la compra
    
    # Crear movimiento de stock
    movimiento = MovimientoStock(
        insumo_id=insumo_id,
        tipo="ENTRADA",
        cantidad=cantidad,
        costo_unitario=nuevo_costo,
        stock_resultante=insumo.stock_actual,
        referencia_id=compra.id,
        referencia_tipo="COMPRA",
        nota=nota
    )
    db.add(movimiento)
    
    await db.commit()
    await db.refresh(compra)
    
    return compra

async def ajustar_stock(db: AsyncSession, insumo_id: int, nuevo_stock: float, nota: str | None = None) -> MovimientoStock:
    """Ajusta manualmente el stock de un insumo."""
    result = await db.execute(select(Insumo).where(Insumo.id == insumo_id))
    insumo = result.scalar_one_or_none()
    
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")
        
    diferencia = nuevo_stock - insumo.stock_actual
    
    if diferencia == 0:
        raise HTTPException(status_code=400, detail="El nuevo stock es igual al actual")
    
    insumo.stock_actual = nuevo_stock
    
    movimiento = MovimientoStock(
        insumo_id=insumo_id,
        tipo="AJUSTE",
        cantidad=diferencia,
        costo_unitario=insumo.costo_promedio,
        stock_resultante=nuevo_stock,
        referencia_id=None,
        referencia_tipo="AJUSTE",
        nota=nota
    )
    db.add(movimiento)
    
    await db.commit()
    await db.refresh(movimiento)
    
    return movimiento

async def obtener_alertas(db: AsyncSession) -> list[Insumo]:
    """Obtiene insumos con stock actual igual o por debajo del stock mínimo."""
    result = await db.execute(
        select(Insumo).where(Insumo.stock_actual <= Insumo.stock_minimo, Insumo.activo == True)
    )
    return list(result.scalars().all())

async def obtener_valorizado(db: AsyncSession) -> dict:
    """Obtiene la valoración total del inventario."""
    result = await db.execute(select(Insumo).where(Insumo.activo == True))
    insumos = list(result.scalars().all())
    
    total_valorizado = sum(int(i.stock_actual * i.costo_promedio) for i in insumos if i.stock_actual > 0)
    total_insumos = len(insumos)
    insumos_bajo_stock = sum(1 for i in insumos if i.stock_actual <= i.stock_minimo)
    
    return {
        "total_valorizado": total_valorizado,
        "total_insumos": total_insumos,
        "insumos_bajo_stock": insumos_bajo_stock
    }
