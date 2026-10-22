from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    rider_id = Column(Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
