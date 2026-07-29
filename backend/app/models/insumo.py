from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Boolean
from app.database import Base
from app.models.base import TimestampMixin

class Insumo(Base, TimestampMixin):
    """Modelo de Insumos."""
    __tablename__ = "insumos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(150))
    unidad: Mapped[str] = mapped_column(String(10))  # 'g', 'kg', 'ml', 'l', 'un'
    contenido_envase: Mapped[float] = mapped_column(Float)
    costo_promedio: Mapped[int] = mapped_column(Integer)
    stock_actual: Mapped[float] = mapped_column(Float, default=0.0)
    stock_minimo: Mapped[float] = mapped_column(Float, default=0.0)
    dias_alerta: Mapped[int] = mapped_column(Integer, default=7)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
