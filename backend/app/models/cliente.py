from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from app.database import Base
from app.models.base import TimestampMixin

class Cliente(Base, TimestampMixin):
    """Modelo de Cliente."""
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    telefono: Mapped[str] = mapped_column(String(20), unique=True)
    direccion: Mapped[str | None] = mapped_column(String(250), nullable=True)
    puntos_acumulados: Mapped[int] = mapped_column(Integer, default=0)
    puntos_canjeados: Mapped[int] = mapped_column(Integer, default=0)
    total_compras: Mapped[int] = mapped_column(Integer, default=0)
    total_gastado: Mapped[int] = mapped_column(Integer, default=0)
    primera_compra: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ultima_compra: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

class MovimientoPuntos(Base, TimestampMixin):
    """Movimientos de puntos de clientes."""
    __tablename__ = "movimientos_puntos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cliente_id: Mapped[int] = mapped_column(Integer, ForeignKey("clientes.id"))
    venta_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("ventas.id"), nullable=True)
    tipo: Mapped[str] = mapped_column(String(50))
    puntos: Mapped[int] = mapped_column(Integer)
    saldo_resultante: Mapped[int] = mapped_column(Integer)
    descripcion: Mapped[str | None] = mapped_column(String, nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    cliente = relationship("Cliente")

class Recompensa(Base, TimestampMixin):
    """Recompensas del programa de fidelización."""
    __tablename__ = "recompensas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    tipo: Mapped[str] = mapped_column(String(50))
    costo_puntos: Mapped[int] = mapped_column(Integer)
    producto_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("productos.id"), nullable=True)
    valor_descuento: Mapped[int] = mapped_column(Integer, default=0)
    activa: Mapped[bool] = mapped_column(Boolean, default=True)

    producto = relationship("Producto")
