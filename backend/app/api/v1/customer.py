from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import customer_user
from app.db.session import get_db
from app.models import User, Order, Review, OrderEvent, LocationHistory
from app.schemas.order import OrderCreate, OrderOut, OrderStatus, QuoteInput, QuoteOut, PaymentInput
from app.schemas.review import ReviewCreate, ReviewOut
from app.schemas.tracking import TrackingOut, EventOut, LocationOut
from app.services import order_service, tracking_service, review_service

router = APIRouter(prefix="/customer", tags=["Customer"], dependencies=[Depends(customer_user)])

@router.post("/quote", response_model=QuoteOut)
def quote(data: QuoteInput, user: User = Depends(customer_user)):
    from app.services.payment_service import quote
    return quote(data)

@router.post("/orders/{order_id}/pay", response_model=OrderOut)
def pay(order_id: int, data: PaymentInput, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    from app.services.payment_service import pay
    return pay(db, order_service.get_order(db, order_id, user), user, data.outcome)

@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(data: OrderCreate, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    return order_service.create_order(db, user, data)

@router.get("/orders", response_model=List[OrderOut])
def orders(status: Optional[OrderStatus] = None, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
           user: User = Depends(customer_user), db: Session = Depends(get_db)):
    query = db.query(Order).filter_by(customer_id=user.id)
    if status:
        query = query.filter_by(status=status)
    return query.order_by(Order.id.desc()).offset(offset).limit(limit).all()

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    return order_service.get_order(db, order_id, user)

@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel(order_id: int, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    return order_service.cancel_order(db, order_service.get_order(db, order_id, user), user.id)

@router.get("/orders/{order_id}/confirmation-code")
def confirmation_code(order_id: int, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    order = order_service.get_order(db, order_id, user)
    return {"delivery_code": order.delivery_code if order.status not in ("delivered", "cancelled") else None}

@router.get("/orders/{order_id}/tracking", response_model=TrackingOut)
def tracking(order_id: int, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    return tracking_service.tracking(db, order_service.get_order(db, order_id, user))

@router.get("/orders/{order_id}/events", response_model=List[EventOut])
def events(order_id: int, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100),
           user: User = Depends(customer_user), db: Session = Depends(get_db)):
    order_service.get_order(db, order_id, user)
    return db.query(OrderEvent).filter_by(order_id=order_id).order_by(OrderEvent.id).offset(offset).limit(limit).all()

@router.get("/orders/{order_id}/locations", response_model=List[LocationOut])
def locations(order_id: int, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100),
              user: User = Depends(customer_user), db: Session = Depends(get_db)):
    order_service.get_order(db, order_id, user)
    return db.query(LocationHistory).filter_by(order_id=order_id).order_by(LocationHistory.id).offset(offset).limit(limit).all()

@router.post("/orders/{order_id}/review", response_model=ReviewOut, status_code=201)
def review(order_id: int, data: ReviewCreate, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    return review_service.create_review(db, order_service.get_order(db, order_id, user), user, data)

@router.get("/orders/{order_id}/review", response_model=ReviewOut)
def get_review(order_id: int, user: User = Depends(customer_user), db: Session = Depends(get_db)):
    order_service.get_order(db, order_id, user)
    review = db.query(Review).filter_by(order_id=order_id).first()
    if review is None:
        raise HTTPException(404, "Review not found")
    return review
