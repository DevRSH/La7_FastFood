from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, ForeignKey
from app.database import Base
from app.models.base import TimestampMixin

class Utensilio(Base, TimestampMixin):
    """Utensilios."""
    __tablename__ = "utensilios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    costo_compra: Mapped[int] = mapped_column(Integer)
    vida_util_horas: Mapped[float] = mapped_column(Float)

class UtensilioReceta(Base):
    """Relación de utensilios en receta."""
    __tablename__ = "utensilios_receta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    producto_id: Mapped[int] = mapped_column(Integer, ForeignKey("productos.id", ondelete="CASCADE"))
    utensilio_id: Mapped[int] = mapped_column(Integer, ForeignKey("utensilios.id"))
    horas_uso_lote: Mapped[float] = mapped_column(Float)

    producto = relationship("Producto", back_populates="utensilios_receta")
    utensilio = relationship("Utensilio")
