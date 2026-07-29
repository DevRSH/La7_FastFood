from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from app.database import Base
from app.models.base import TimestampMixin

class Venta(Base, TimestampMixin):
    """Ventas."""
    __tablename__ = "ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    numero_ticket: Mapped[str] = mapped_column(String(50))
    cliente_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("clientes.id"), nullable=True, index=True)
    total: Mapped[int] = mapped_column(Integer)
    costo_total_snapshot: Mapped[int] = mapped_column(Integer)
    utilidad_snapshot: Mapped[int] = mapped_column(Integer)
    medio_pago: Mapped[str] = mapped_column(String(50))
    canal: Mapped[str] = mapped_column(String(50), default="local")
    monto_recibido: Mapped[int] = mapped_column(Integer, default=0)
    vuelto: Mapped[int] = mapped_column(Integer, default=0)
    puntos_ganados: Mapped[int] = mapped_column(Integer, default=0)
    puntos_canjeados: Mapped[int] = mapped_column(Integer, default=0)
    descuento_fidelizacion: Mapped[int] = mapped_column(Integer, default=0)
    anulada: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    cliente = relationship("Cliente")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")

class DetalleVenta(Base):
    """Detalle de Venta."""
    __tablename__ = "detalles_ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venta_id: Mapped[int] = mapped_column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"))
    producto_id: Mapped[int] = mapped_column(Integer, ForeignKey("productos.id"))
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[int] = mapped_column(Integer)
    costo_unitario_snapshot: Mapped[int] = mapped_column(Integer)
    utilidad_unitaria_snapshot: Mapped[int] = mapped_column(Integer)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")
    modificadores = relationship("ModificadorDetalleVenta", back_populates="detalle_venta", cascade="all, delete-orphan")

class ModificadorDetalleVenta(Base):
    """Modificadores aplicados en el detalle."""
    __tablename__ = "modificadores_detalle_venta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    detalle_venta_id: Mapped[int] = mapped_column(Integer, ForeignKey("detalles_ventas.id", ondelete="CASCADE"))
    modificador_id: Mapped[int] = mapped_column(Integer, ForeignKey("modificadores.id"))
    precio_adicional: Mapped[int] = mapped_column(Integer)

    detalle_venta = relationship("DetalleVenta", back_populates="modificadores")
    modificador = relationship("Modificador")
