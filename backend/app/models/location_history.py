from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class LocationHistory(Base):
    __tablename__ = "location_history"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    recorded_at = Column(DateTime, nullable=False, server_default=func.current_timestamp(), index=True)
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_history_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_history_longitude"),
    )
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
