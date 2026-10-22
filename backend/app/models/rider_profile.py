from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class RiderProfile(Base):
    __tablename__ = "rider_profiles"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, unique=True)
    status = Column(String(16), nullable=False, server_default="offline")
    vehicle_type = Column(String(32))
    latitude = Column(Float)
    longitude = Column(Float)
    location_updated_at = Column(DateTime)
    __table_args__ = (
        CheckConstraint("status IN ('offline', 'available', 'busy')", name="ck_rider_status"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_rider_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_rider_longitude"),
        CheckConstraint("(latitude IS NULL) = (longitude IS NULL)", name="ck_rider_coordinate_pair"),
    )
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
