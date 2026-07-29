from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime
from app.database import Base
from app.models.base import TimestampMixin

class CompraInsumo(Base, TimestampMixin):
    """Compras de insumos."""
    __tablename__ = "compras_insumos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    insumo_id: Mapped[int] = mapped_column(Integer, ForeignKey("insumos.id"))
    cantidad: Mapped[float] = mapped_column(Float)
    precio_total: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[int] = mapped_column(Integer)
    proveedor: Mapped[str | None] = mapped_column(String(150), nullable=True)
    nota: Mapped[str | None] = mapped_column(String, nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    insumo = relationship("Insumo")
