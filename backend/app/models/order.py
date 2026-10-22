from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    distance_km = Column(Float, nullable=False, default=0, server_default="0")
    payment_status = Column(String(16), nullable=False, default="unpaid", server_default="unpaid")
    payment_reference = Column(String(64), unique=True, index=True)
    paid_at = Column(DateTime)
    delivery_code = Column(String(6))
    code_attempts = Column(Integer, nullable=False, default=0, server_default="0")
    code_locked_until = Column(DateTime)
    tracking_code = Column(String(36), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    rider_id = Column(Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT"), index=True)
    status = Column(String(24), nullable=False, server_default="pending")
    pickup_address = Column(Text, nullable=False)
    pickup_latitude = Column(Float, nullable=False)
    pickup_longitude = Column(Float, nullable=False)
    dropoff_address = Column(Text, nullable=False)
    dropoff_latitude = Column(Float, nullable=False)
    dropoff_longitude = Column(Float, nullable=False)
    recipient_name = Column(String(120), nullable=False)
    recipient_phone = Column(String(32), nullable=False)
    package_description = Column(Text)
    delivery_fee_minor = Column(Integer, nullable=False, server_default=text("0"))
    currency = Column(String(3), nullable=False, server_default="NGN")
    delivered_at = Column(DateTime)
    __table_args__ = (
        CheckConstraint("payment_status IN ('unpaid', 'paid')", name="ck_order_payment_status"),
        CheckConstraint("distance_km >= 0", name="ck_order_distance"),
        CheckConstraint("status IN ('pending', 'broadcasting', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')", name="ck_order_status"),
        CheckConstraint("pickup_latitude BETWEEN -90 AND 90 AND dropoff_latitude BETWEEN -90 AND 90", name="ck_order_latitude"),
        CheckConstraint("pickup_longitude BETWEEN -180 AND 180 AND dropoff_longitude BETWEEN -180 AND 180", name="ck_order_longitude"),
        CheckConstraint("delivery_fee_minor >= 0", name="ck_order_fee"),
        CheckConstraint("status NOT IN ('assigned', 'picked_up', 'in_transit', 'delivered') OR rider_id IS NOT NULL", name="ck_order_assigned_rider"),
        Index("uq_rider_active_order", "rider_id", unique=True, sqlite_where=text("status IN ('assigned', 'picked_up', 'in_transit')")),
    )
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
