from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey
from app.database import Base
from app.models.base import TimestampMixin

class CategoriaProducto(Base):
    """Categoría de producto."""
    __tablename__ = "categorias_productos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    color: Mapped[str] = mapped_column(String(7), default="#22d3ee")
    orden: Mapped[int] = mapped_column(Integer, default=0)

    productos = relationship("Producto", back_populates="categoria")

class Producto(Base, TimestampMixin):
    """Producto a vender."""
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    categoria_id: Mapped[int] = mapped_column(Integer, ForeignKey("categorias_productos.id"))
    nombre: Mapped[str] = mapped_column(String(150))
    rendimiento_lote: Mapped[int] = mapped_column(Integer)
    tiempo_preparacion_min: Mapped[int] = mapped_column(Integer)
    precio_venta: Mapped[int] = mapped_column(Integer)
    imagen_url: Mapped[str | None] = mapped_column(String, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    categoria = relationship("CategoriaProducto", back_populates="productos")
    ingredientes = relationship("IngredienteReceta", back_populates="producto", cascade="all, delete-orphan")
    utensilios_receta = relationship("UtensilioReceta", back_populates="producto", cascade="all, delete-orphan")
    packaging_receta = relationship("PackagingReceta", back_populates="producto", cascade="all, delete-orphan")

class IngredienteReceta(Base):
    """Ingrediente de una receta."""
    __tablename__ = "ingredientes_receta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    producto_id: Mapped[int] = mapped_column(Integer, ForeignKey("productos.id", ondelete="CASCADE"))
    insumo_id: Mapped[int] = mapped_column(Integer, ForeignKey("insumos.id"))
    cantidad_usada: Mapped[float] = mapped_column(Float)
    merma_porcentaje: Mapped[float] = mapped_column(Float, default=0.0)

    producto = relationship("Producto", back_populates="ingredientes")
    insumo = relationship("Insumo")

class Modificador(Base):
    """Modificadores de productos."""
    __tablename__ = "modificadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    precio_adicional: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
