from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(254), nullable=False, unique=True)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(32), unique=True)
    zone = Column(String(80))
    address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(16), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=text("1"))
    __table_args__ = (
        CheckConstraint("role IN ('customer', 'rider', 'admin')", name="ck_user_role"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_user_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_user_longitude"),
        CheckConstraint("(latitude IS NULL) = (longitude IS NULL)", name="ck_user_coordinate_pair"),
    )
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
