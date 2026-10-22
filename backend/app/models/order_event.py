from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class OrderEvent(Base):
    __tablename__ = "order_events"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"))
    event_type = Column(String(64), nullable=False)
    previous_status = Column(String(24))
    new_status = Column(String(24))
    details = Column(JSON)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
