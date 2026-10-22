from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint, func
from app.db.base import Base

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(160), nullable=False)
    status = Column(String(16), nullable=False, default="open")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    __table_args__ = (CheckConstraint("status IN ('open', 'resolved')", name="ck_ticket_status"),)

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
