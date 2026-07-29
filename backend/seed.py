"""
Script de datos semilla para La 7 FastFood.
Crea categorías iniciales, configuración de negocio, insumos base y recompensas de prueba.
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.producto import CategoriaProducto, Producto, IngredienteReceta
from app.models.insumo import Insumo
from app.models.config import ConfigNegocio
from app.models.cliente import Cliente, Recompensa
from app.models.packaging import Packaging

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Configuración de Negocio
        if not db.query(ConfigNegocio).first():
            config = ConfigNegocio(
                valor_hora_trabajo=3500,
                comision_plataforma_pct=0.0,
                reparto_tipo="ninguno",
                reparto_valor=0,
                moneda="CLP"
            )
            db.add(config)
            print("✅ Configuración inicial creada ($3.500/hr mano de obra)")

        # 2. Categorías de Productos
        categorias_def = [
            {"nombre": "Hamburguesas", "color": "#22d3ee", "orden": 1},
            {"nombre": "Empanadas & Salado", "color": "#f59e0b", "orden": 2},
            {"nombre": "Papas & Acompañamientos", "color": "#34d399", "orden": 3},
            {"nombre": "Bebidas", "color": "#a855f7", "orden": 4},
            {"nombre": "Postres", "color": "#ec4899", "orden": 5},
        ]
        cat_map = {}
        for cat_data in categorias_def:
            existente = db.query(CategoriaProducto).filter(CategoriaProducto.nombre == cat_data["nombre"]).first()
            if not existente:
                nueva_cat = CategoriaProducto(**cat_data)
                db.add(nueva_cat)
                db.flush()
                cat_map[cat_data["nombre"]] = nueva_cat.id
            else:
                cat_map[cat_data["nombre"]] = existente.id
        print("✅ Categorías registradas")

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
        insumo_map = {}
        for ins in insumos_def:
            ex = db.query(Insumo).filter(Insumo.nombre == ins["nombre"]).first()
            if not ex:
                nuevo_ins = Insumo(**ins)
                db.add(nuevo_ins)
                db.flush()
                insumo_map[ins["nombre"]] = nuevo_ins.id
            else:
                insumo_map[ins["nombre"]] = ex.id
        print("✅ Insumos base registrados")

        # 4. Packaging Base
        pack_def = [
            {"nombre": "Bolsa de papel craft", "costo_unitario": 60},
            {"nombre": "Caja hamburguesa compostable", "costo_unitario": 120},
            {"nombre": "Servilletas (pack 2 un)", "costo_unitario": 15},
        ]
        for p in pack_def:
            if not db.query(Packaging).filter(Packaging.nombre == p["nombre"]).first():
                db.add(Packaging(**p))
        print("✅ Packaging registrado")

        # 5. Recompensas de Fidelización
        recompensas_def = [
            {"nombre": "Empanada de Pino Gratis", "tipo": "PRODUCTO_GRATIS", "costo_puntos": 50, "valor_descuento": 1500},
            {"nombre": "Descuento de $1.000 en tu compra", "tipo": "DESCUENTO_FIJO", "costo_puntos": 100, "valor_descuento": 1000},
            {"nombre": "15% de Descuento en la cuenta", "tipo": "DESCUENTO_PCT", "costo_puntos": 150, "valor_descuento": 15},
        ]
        for r in recompensas_def:
            if not db.query(Recompensa).filter(Recompensa.nombre == r["nombre"]).first():
                db.add(Recompensa(**r))
        print("✅ Catálogo de recompensas de fidelización creado")

        db.commit()
        print("🚀 Base de datos inicializada correctamente.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error sembrando datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
