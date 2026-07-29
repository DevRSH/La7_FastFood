from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime
from app.database import Base
from app.models.base import TimestampMixin

class MovimientoStock(Base, TimestampMixin):
    """Movimientos de stock."""
    __tablename__ = "movimientos_stock"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    insumo_id: Mapped[int] = mapped_column(Integer, ForeignKey("insumos.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(20)) # ENTRADA, SALIDA, AJUSTE
    cantidad: Mapped[float] = mapped_column(Float)
    costo_unitario: Mapped[int] = mapped_column(Integer)
    stock_resultante: Mapped[float] = mapped_column(Float)
    referencia_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    referencia_tipo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nota: Mapped[str | None] = mapped_column(String, nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    insumo = relationship("Insumo")
