from datetime import datetime
from typing import Literal, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from app.core.dependencies import current_user, customer_user, admin_user
from app.db.session import get_db
from app.models import User, Ticket, TicketMessage
from app.schemas.user import ORMModel
from app.services.order_service import get_order

router = APIRouter(prefix="/support", tags=["Support"])

class MessageInput(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    @field_validator('body')
    @classmethod
    def nonblank(cls, value):
        if not value.strip(): raise ValueError('Message cannot be blank')
        return value.strip()

class TicketInput(MessageInput):
    order_id: int = Field(gt=0)
    subject: str = Field(min_length=1, max_length=160)
    @field_validator('subject')
    @classmethod
    def nonblank_subject(cls, value):
        if not value.strip(): raise ValueError('Subject cannot be blank')
        return value.strip()

class TicketOut(ORMModel):
    id: int
    order_id: int
    customer_id: int
    subject: str
    status: str
    created_at: datetime

class MessageOut(ORMModel):
    id: int
    author_id: int
    body: str
    created_at: datetime
    author_name: str
    author_role: str

class StatusInput(BaseModel):
    status: Literal['open', 'resolved']

def support_user(user: User = Depends(current_user)):
    if user.role not in ('customer','admin'): raise HTTPException(403, 'Support is available to customers and admins')
    return user

def owned_ticket(db, ticket_id, user):
    ticket = db.get(Ticket, ticket_id)
    if ticket is None or (user.role != 'admin' and ticket.customer_id != user.id): raise HTTPException(404, 'Ticket not found')
    return ticket

@router.get('/tickets', response_model=List[TicketOut])
def tickets(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), user: User = Depends(support_user), db: Session = Depends(get_db)):
    query = db.query(Ticket)
    if user.role == 'customer': query = query.filter_by(customer_id=user.id)
    return query.order_by(Ticket.id.desc()).offset(offset).limit(limit).all()

@router.post('/tickets', response_model=TicketOut, status_code=201)
def create_ticket(data: TicketInput, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    get_order(db, data.order_id, user)
    ticket = Ticket(order_id=data.order_id, customer_id=user.id, subject=data.subject, status='open')
    db.add(ticket); db.flush()
    db.add(TicketMessage(ticket_id=ticket.id, author_id=user.id, body=data.body))
    db.commit(); db.refresh(ticket)
    return ticket

@router.get('/tickets/{ticket_id}', response_model=TicketOut)
def ticket_detail(ticket_id: int, user: User = Depends(support_user), db: Session = Depends(get_db)):
    return owned_ticket(db, ticket_id, user)

@router.get('/tickets/{ticket_id}/messages', response_model=List[MessageOut])
def messages(ticket_id: int, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100), user: User = Depends(support_user), db: Session = Depends(get_db)):
    owned_ticket(db, ticket_id, user)
    rows = db.query(TicketMessage, User).join(User, User.id == TicketMessage.author_id).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.id).offset(offset).limit(limit).all()
    return [dict(id=m.id, author_id=m.author_id, body=m.body, created_at=m.created_at, author_name=u.full_name, author_role=u.role) for m,u in rows]

@router.post('/tickets/{ticket_id}/messages', status_code=201)
def reply(ticket_id: int, data: MessageInput, user: User = Depends(support_user), db: Session = Depends(get_db)):
    ticket = owned_ticket(db, ticket_id, user)
    if ticket.status == 'resolved': raise HTTPException(409, 'Ticket is resolved. An admin can reopen it.')
    db.add(TicketMessage(ticket_id=ticket_id, author_id=user.id, body=data.body)); db.commit()
    return {'status':'sent'}

@router.patch('/tickets/{ticket_id}', response_model=TicketOut)
def status(ticket_id: int, data: StatusInput, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    ticket = owned_ticket(db, ticket_id, user)
    ticket.status = data.status; db.commit(); db.refresh(ticket)
    return ticket
