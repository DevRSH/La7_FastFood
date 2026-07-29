from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Float
from app.database import Base

class ConfigNegocio(Base):
    """Configuraciones del negocio."""
    __tablename__ = "configuracion_negocio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    valor_hora_trabajo: Mapped[int] = mapped_column(Integer)
    comision_plataforma_pct: Mapped[float] = mapped_column(Float, default=0.0)
    reparto_tipo: Mapped[str] = mapped_column(String(20), default="ninguno")
    reparto_valor: Mapped[int] = mapped_column(Integer, default=0)
    moneda: Mapped[str] = mapped_column(String(3), default="CLP")
