import time
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.venta import Venta, DetalleVenta, ModificadorDetalleVenta
from app.models.producto import Producto, IngredienteReceta
from app.models.stock import MovimientoStock
from app.models.insumo import Insumo
from app.models.cliente import Cliente, MovimientoPuntos
from app.schemas.venta import VentaCreate

async def registrar_venta(db: AsyncSession, venta_in: VentaCreate) -> Venta:
    ticket_num = f"T-{str(int(time.time()))[-6:]}"
    
    total = 0
    costo_total = 0
    
    venta = Venta(
        numero_ticket=ticket_num,
        cliente_id=venta_in.cliente_id,
        medio_pago=venta_in.medio_pago,
        canal=venta_in.canal,
        monto_recibido=venta_in.monto_recibido,
        puntos_canjeados=venta_in.puntos_canjeados,
        descuento_fidelizacion=venta_in.descuento_fidelizacion,
        total=0,
        costo_total_snapshot=0,
        utilidad_snapshot=0,
        vuelto=0,
        puntos_ganados=0
    )
    db.add(venta)
    await db.flush()

    for detalle_in in venta_in.detalles:
        stmt = (
            select(Producto)
            .options(selectinload(Producto.ingredientes).selectinload(IngredienteReceta.insumo))
            .where(Producto.id == detalle_in.producto_id)
        )
        res = await db.execute(stmt)
        producto = res.scalars().first()
        
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {detalle_in.producto_id} no encontrado")
        
        # Calcular costo snapshot de ingredientes con división por contenido_envase
        costo_unitario_snapshot = 0.0
        for ing in producto.ingredientes:
            if producto.rendimiento_lote <= 0 or not ing.insumo_id:
                continue
            
            stmt_ins = select(Insumo).where(Insumo.id == ing.insumo_id).with_for_update()
            res_ins = await db.execute(stmt_ins)
            insumo_locked = res_ins.scalars().first() or ing.insumo

            if not insumo_locked:
                continue

            contenido = insumo_locked.contenido_envase if insumo_locked.contenido_envase > 0 else 1.0
            costo_unidad_medida = insumo_locked.costo_promedio / contenido
            
            merma_pct = min(max(ing.merma_porcentaje, 0.0), 99.0)
            merma_factor = 1.0 - (merma_pct / 100.0)
            
            cant_usada_real = (ing.cantidad_usada / merma_factor) / producto.rendimiento_lote
            costo_ing = cant_usada_real * costo_unidad_medida
            costo_unitario_snapshot += costo_ing
            
            # Descuento de stock en unidad de medida con bloqueo
            cantidad_deducir = (ing.cantidad_usada / merma_factor) * (detalle_in.cantidad / producto.rendimiento_lote)
            insumo_locked.stock_actual -= cantidad_deducir
            
            mov_stock = MovimientoStock(
                insumo_id=ing.insumo_id,
                tipo="SALIDA",
                cantidad=cantidad_deducir,
                costo_unitario=int(round(costo_unidad_medida)),
                stock_resultante=insumo_locked.stock_actual,
                referencia_id=venta.id,
                referencia_tipo="VENTA"
            )
            db.add(mov_stock)

        costo_unitario_int = int(round(costo_unitario_snapshot))
        modificadores_precio_total = sum(mod.precio_adicional for mod in detalle_in.modificadores)
        utilidad_unitaria = detalle_in.precio_unitario + modificadores_precio_total - costo_unitario_int

        detalle = DetalleVenta(
            venta_id=venta.id,
            producto_id=producto.id,
            cantidad=detalle_in.cantidad,
            precio_unitario=detalle_in.precio_unitario,
            costo_unitario_snapshot=costo_unitario_int,
            utilidad_unitaria_snapshot=utilidad_unitaria
        )
        db.add(detalle)
        await db.flush()
        
        for mod_in in detalle_in.modificadores:
            mod_db = ModificadorDetalleVenta(
                detalle_venta_id=detalle.id,
                modificador_id=mod_in.modificador_id,
                precio_adicional=mod_in.precio_adicional
            )
            db.add(mod_db)

        subtotal = (detalle_in.precio_unitario + modificadores_precio_total) * detalle_in.cantidad
        total += subtotal
        costo_total += costo_unitario_int * detalle_in.cantidad

    total_final = total - venta.descuento_fidelizacion
    if total_final < 0:
        total_final = 0

    venta.total = total_final
    venta.costo_total_snapshot = costo_total
    venta.utilidad_snapshot = total_final - costo_total
    venta.vuelto = venta.monto_recibido - total_final if venta.monto_recibido >= total_final else 0

    # Fidelizacion
    if venta.cliente_id:
        stmt_c = select(Cliente).where(Cliente.id == venta.cliente_id)
        res_c = await db.execute(stmt_c)
        cliente = res_c.scalars().first()
        
        if cliente:
            puntos_ganados = int(total_final * 0.01)
            venta.puntos_ganados = puntos_ganados
            
            if venta.puntos_canjeados > 0:
                cliente.puntos_acumulados -= venta.puntos_canjeados
                cliente.puntos_canjeados += venta.puntos_canjeados
                mov_canje = MovimientoPuntos(
                    cliente_id=cliente.id,
                    venta_id=venta.id,
                    tipo="CANJE",
                    puntos=-venta.puntos_canjeados,
                    saldo_resultante=cliente.puntos_acumulados,
                    descripcion=f"Canje en ticket {venta.numero_ticket}"
                )
                db.add(mov_canje)
            
            cliente.puntos_acumulados += puntos_ganados
            cliente.total_compras += 1
            cliente.total_gastado += total_final
            cliente.ultima_compra = datetime.utcnow()
            if not cliente.primera_compra:
                cliente.primera_compra = datetime.utcnow()
                
            if puntos_ganados > 0:
                mov_acum = MovimientoPuntos(
                    cliente_id=cliente.id,
                    venta_id=venta.id,
                    tipo="ACUMULACION",
                    puntos=puntos_ganados,
                    saldo_resultante=cliente.puntos_acumulados,
                    descripcion=f"Acumulación por ticket {venta.numero_ticket}"
                )
                db.add(mov_acum)

    await db.commit()
    await db.refresh(venta)
    return venta

async def anular_venta(db: AsyncSession, venta_id: int) -> Venta:
    stmt = (
        select(Venta)
        .options(
            selectinload(Venta.detalles)
            .selectinload(DetalleVenta.producto)
            .selectinload(Producto.ingredientes)
            .selectinload(IngredienteReceta.insumo)
        )
        .where(Venta.id == venta_id)
    )
    res = await db.execute(stmt)
    venta = res.scalars().first()
    
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.anulada:
        raise HTTPException(status_code=400, detail="Venta ya está anulada")

    venta.anulada = True

    # Revertir stock
    for detalle in venta.detalles:
        producto = detalle.producto
        if not producto or producto.rendimiento_lote <= 0:
            continue
        for ing in producto.ingredientes:
            if not ing.insumo:
                continue
            contenido = ing.insumo.contenido_envase if ing.insumo.contenido_envase > 0 else 1.0
            costo_unidad_medida = ing.insumo.costo_promedio / contenido
            
            merma_pct = min(max(ing.merma_porcentaje, 0.0), 99.0)
            merma_factor = 1.0 - (merma_pct / 100.0)
            
            cantidad_revertir = (ing.cantidad_usada / merma_factor) * (detalle.cantidad / producto.rendimiento_lote)
            ing.insumo.stock_actual += cantidad_revertir
            
            mov_stock = MovimientoStock(
                insumo_id=ing.insumo_id,
                tipo="ENTRADA",
                cantidad=cantidad_revertir,
                costo_unitario=int(round(costo_unidad_medida)),
                stock_resultante=ing.insumo.stock_actual,
                referencia_id=venta.id,
                referencia_tipo="ANULACION"
            )
            db.add(mov_stock)

    # Revertir puntos
    if venta.cliente_id:
        stmt_c = select(Cliente).where(Cliente.id == venta.cliente_id)
        res_c = await db.execute(stmt_c)
        cliente = res_c.scalars().first()
        if cliente:
            if venta.puntos_ganados > 0:
                cliente.puntos_acumulados -= venta.puntos_ganados
                mov_revert_acum = MovimientoPuntos(
                    cliente_id=cliente.id,
                    venta_id=venta.id,
                    tipo="ANULACION_ACUMULACION",
                    puntos=-venta.puntos_ganados,
                    saldo_resultante=cliente.puntos_acumulados,
                    descripcion=f"Anulación de acumulación ticket {venta.numero_ticket}"
                )
                db.add(mov_revert_acum)
                
            if venta.puntos_canjeados > 0:
                cliente.puntos_acumulados += venta.puntos_canjeados
                cliente.puntos_canjeados -= venta.puntos_canjeados
                mov_revert_canje = MovimientoPuntos(
                    cliente_id=cliente.id,
                    venta_id=venta.id,
                    tipo="ANULACION_CANJE",
                    puntos=venta.puntos_canjeados,
                    saldo_resultante=cliente.puntos_acumulados,
                    descripcion=f"Devolución de canje por ticket {venta.numero_ticket}"
                )
                db.add(mov_revert_canje)
                
            cliente.total_compras = max(0, cliente.total_compras - 1)
            cliente.total_gastado = max(0, cliente.total_gastado - venta.total)

    await db.commit()
    await db.refresh(venta)
    return venta

