from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.producto import Producto, IngredienteReceta
from app.models.config import ConfigNegocio

async def calcular_costo_producto(producto_id: int, db: AsyncSession) -> dict:
    stmt = select(Producto).where(Producto.id == producto_id).options(
        selectinload(Producto.ingredientes).selectinload(IngredienteReceta.insumo),
        selectinload(Producto.utensilios_receta).selectinload("utensilio"),
        selectinload(Producto.packaging_receta).selectinload("packaging")
    )
    res = await db.execute(stmt)
    producto = res.scalars().first()
    if not producto:
        return {}

    stmt_cfg = select(ConfigNegocio).limit(1)
    res_cfg = await db.execute(stmt_cfg)
    config = res_cfg.scalars().first()

    if not config:
        valor_hora_trabajo = 0
        comision_pct = 0.0
    else:
        valor_hora_trabajo = config.valor_hora_trabajo
        comision_pct = config.comision_plataforma_pct

    rendimiento = producto.rendimiento_lote if producto.rendimiento_lote > 0 else 1
    
    # 1. Insumos
    insumos_costo_lote = 0.0
    for ing in producto.ingredientes:
        insumo = ing.insumo
        if insumo and insumo.contenido_envase > 0:
            costo_por_unidad_medida = insumo.costo_promedio / insumo.contenido_envase
            merma_pct = min(max(ing.merma_porcentaje, 0.0), 99.0)
            cantidad_real = ing.cantidad_usada / (1.0 - (merma_pct / 100.0))
            insumos_costo_lote += costo_por_unidad_medida * cantidad_real

    insumos_unitario = insumos_costo_lote / rendimiento

    # 2. Mano de Obra (MO)
    mo_costo_lote = (producto.tiempo_preparacion_min / 60.0) * valor_hora_trabajo
    mo_unitario = mo_costo_lote / rendimiento

    # 3. Utensilios
    utensilios_costo_lote = 0.0
    for ute_receta in producto.utensilios_receta:
        utensilio = ute_receta.utensilio
        if utensilio and utensilio.vida_util_horas > 0:
            costo_por_hora = utensilio.costo_compra / utensilio.vida_util_horas
            utensilios_costo_lote += costo_por_hora * ute_receta.horas_uso_lote
            
    utensilios_unitario = utensilios_costo_lote / rendimiento

    # 4. Packaging
    packaging_unitario = 0.0
    for pack_receta in producto.packaging_receta:
        packaging = pack_receta.packaging
        if packaging:
            packaging_unitario += packaging.costo_unitario * pack_receta.cantidad_por_unidad

    # Costo Directo
    costo_directo = insumos_unitario + mo_unitario + utensilios_unitario + packaging_unitario

    # 5. Comisión de Tarjeta / Plataforma
    precio = producto.precio_venta
    comision_unitario = precio * (comision_pct / 100.0)

    # Costo Total de Producto
    costo_total = costo_directo + comision_unitario

    # Utilidad y Margen
    utilidad = precio - costo_total
    margen_pct = (utilidad / precio * 100.0) if precio > 0 else 0.0

    return {
        "insumos_costo_lote": round(insumos_costo_lote, 2),
        "insumos_unitario": round(insumos_unitario, 2),
        "mo_costo_lote": round(mo_costo_lote, 2),
        "mo_unitario": round(mo_unitario, 2),
        "utensilios_costo_lote": round(utensilios_costo_lote, 2),
        "utensilios_unitario": round(utensilios_unitario, 2),
        "packaging_unitario": round(packaging_unitario, 2),
        "costo_directo": round(costo_directo, 2),
        "comision_unitario": round(comision_unitario, 2),
        "costo_total": round(costo_total, 2),
        "utilidad": round(utilidad, 2),
        "margen_pct": round(margen_pct, 2)
    }

