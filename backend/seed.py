"""
Script de datos semilla asíncrono para La 7 FastFood.
Crea categorías iniciales, configuración de negocio, insumos base y recompensas de prueba.
"""
import sys
import asyncio
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import select
from app.database import async_session_maker, engine, Base
from app.models.producto import CategoriaProducto
from app.models.insumo import Insumo
from app.models.config import ConfigNegocio
from app.models.cliente import Recompensa
from app.models.packaging import Packaging

async def seed_database():
    # Crear tablas en motor asíncrono
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        try:
            # 1. Configuración de Negocio
            res_cfg = await db.execute(select(ConfigNegocio))
            if not res_cfg.scalars().first():
                config = ConfigNegocio(
                    valor_hora_trabajo=3500,
                    comision_plataforma_pct=0.0,
                    reparto_tipo="ninguno",
                    reparto_valor=0,
                    moneda="CLP"
                )
                db.add(config)

            # 2. Categorías de Productos
            categorias_def = [
                {"nombre": "Hamburguesas", "color": "#22d3ee", "orden": 1},
                {"nombre": "Empanadas & Salado", "color": "#f59e0b", "orden": 2},
                {"nombre": "Papas & Acompañamientos", "color": "#34d399", "orden": 3},
                {"nombre": "Bebidas", "color": "#a855f7", "orden": 4},
                {"nombre": "Postres", "color": "#ec4899", "orden": 5},
            ]
            for cat_data in categorias_def:
                res_cat = await db.execute(select(CategoriaProducto).where(CategoriaProducto.nombre == cat_data["nombre"]))
                if not res_cat.scalars().first():
                    db.add(CategoriaProducto(**cat_data))

            # 3. Insumos Base
            insumos_def = [
                {"nombre": "Carne molida", "unidad": "g", "contenido_envase": 1000, "costo_promedio": 6000, "stock_actual": 5000, "stock_minimo": 1000},
                {"nombre": "Cebolla", "unidad": "g", "contenido_envase": 1000, "costo_promedio": 800, "stock_actual": 3000, "stock_minimo": 800},
                {"nombre": "Harina", "unidad": "g", "contenido_envase": 1000, "costo_promedio": 1200, "stock_actual": 10000, "stock_minimo": 2000},
                {"nombre": "Huevo", "unidad": "un", "contenido_envase": 12, "costo_promedio": 3000, "stock_actual": 60, "stock_minimo": 12},
                {"nombre": "Pan de Hamburguesa Brioche", "unidad": "un", "contenido_envase": 6, "costo_promedio": 1800, "stock_actual": 30, "stock_minimo": 12},
                {"nombre": "Queso Cheddar lonjas", "unidad": "un", "contenido_envase": 20, "costo_promedio": 3500, "stock_actual": 40, "stock_minimo": 10},
                {"nombre": "Papas prefritas congeladas", "unidad": "g", "contenido_envase": 2500, "costo_promedio": 5500, "stock_actual": 10000, "stock_minimo": 2500},
                {"nombre": "Aceite vegetal", "unidad": "ml", "contenido_envase": 900, "costo_promedio": 1800, "stock_actual": 4500, "stock_minimo": 900},
            ]
            for ins in insumos_def:
                res_ins = await db.execute(select(Insumo).where(Insumo.nombre == ins["nombre"]))
                if not res_ins.scalars().first():
                    db.add(Insumo(**ins))

            # 4. Packaging Base
            pack_def = [
                {"nombre": "Bolsa de papel craft", "costo_unitario": 60},
                {"nombre": "Caja hamburguesa compostable", "costo_unitario": 120},
                {"nombre": "Servilletas (pack 2 un)", "costo_unitario": 15},
            ]
            for p in pack_def:
                res_p = await db.execute(select(Packaging).where(Packaging.nombre == p["nombre"]))
                if not res_p.scalars().first():
                    db.add(Packaging(**p))

            # 5. Recompensas de Fidelización
            recompensas_def = [
                {"nombre": "Empanada de Pino Gratis", "tipo": "PRODUCTO_GRATIS", "costo_puntos": 50, "valor_descuento": 1500},
                {"nombre": "Descuento de $1.000 en tu compra", "tipo": "DESCUENTO_FIJO", "costo_puntos": 100, "valor_descuento": 1000},
                {"nombre": "15% de Descuento en la cuenta", "tipo": "DESCUENTO_PCT", "costo_puntos": 150, "valor_descuento": 15},
            ]
            for r in recompensas_def:
                res_r = await db.execute(select(Recompensa).where(Recompensa.nombre == r["nombre"]))
                if not res_r.scalars().first():
                    db.add(Recompensa(**r))

            await db.commit()
            print("🚀 Base de datos inicializada correctamente.")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error sembrando datos: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database())
