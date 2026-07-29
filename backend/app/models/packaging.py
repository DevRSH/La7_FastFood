from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from app.database import Base
from app.models.base import TimestampMixin

class Packaging(Base, TimestampMixin):
    """Packaging."""
    __tablename__ = "packaging"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    costo_unitario: Mapped[int] = mapped_column(Integer)

class PackagingReceta(Base):
    """Relación de packaging en receta."""
    __tablename__ = "packaging_receta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    producto_id: Mapped[int] = mapped_column(Integer, ForeignKey("productos.id", ondelete="CASCADE"))
    packaging_id: Mapped[int] = mapped_column(Integer, ForeignKey("packaging.id"))
    cantidad_por_unidad: Mapped[int] = mapped_column(Integer, default=1)

    producto = relationship("Producto", back_populates="packaging_receta")
    packaging = relationship("Packaging")
