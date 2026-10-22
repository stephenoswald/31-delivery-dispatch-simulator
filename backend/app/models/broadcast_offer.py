from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class BroadcastOffer(Base):
    __tablename__ = "broadcast_offers"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    rider_id = Column(Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(16), nullable=False, server_default="pending")
    expires_at = Column(DateTime, nullable=False)
    responded_at = Column(DateTime)
    __table_args__ = (
        UniqueConstraint("order_id", "rider_id", name="uq_offer_order_rider"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')", name="ck_offer_status"),
        Index("uq_order_accepted_offer", "order_id", unique=True, sqlite_where=text("status = 'accepted'")),
    )
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
