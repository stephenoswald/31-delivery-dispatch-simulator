from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import admin_user
from app.db.session import get_db
from app.models import User, RiderProfile, Order, Review, OrderEvent
from app.schemas.user import UserOut, UserActivation
from app.schemas.rider import RiderOut
from app.schemas.order import OrderOut, OrderStatus, BroadcastRequest, BroadcastOut
from app.schemas.analytics import AnalyticsOut
from app.schemas.tracking import TrackingOut, EventOut
from app.schemas.review import ReviewOut
from app.services import order_service, dispatch_service, tracking_service, analytics_service

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(admin_user)])

@router.get("/users", response_model=List[UserOut])
def users(role: Optional[Literal["customer", "rider", "admin"]] = None,
          offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter_by(role=role)
    return query.order_by(User.id).offset(offset).limit(limit).all()

@router.patch("/users/{user_id}/activation", response_model=UserOut)
def activation(user_id: int, data: UserActivation, actor: User = Depends(admin_user), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    if not data.is_active:
        if user.id == actor.id:
            raise HTTPException(409, "Cannot deactivate your own account")
        rider = db.query(RiderProfile).filter_by(user_id=user.id).first()
        active = db.query(Order).filter(Order.status.in_(order_service.ACTIVE))
        if (rider and active.filter(Order.rider_id == rider.id).first()) or active.filter(Order.customer_id == user.id).first():
            raise HTTPException(409, "Account has an active delivery")
        if rider:
            rider.status = "offline"
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user

@router.get("/riders", response_model=List[RiderOut])
def riders(status: Optional[Literal["offline", "available", "busy"]] = None,
           offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    query = db.query(RiderProfile)
    if status:
        query = query.filter_by(status=status)
    return query.order_by(RiderProfile.id).offset(offset).limit(limit).all()

@router.get("/orders", response_model=List[OrderOut])
def orders(status: Optional[OrderStatus] = None, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    query = db.query(Order)
    if status:
        query = query.filter_by(status=status)
    return query.order_by(Order.id.desc()).offset(offset).limit(limit).all()

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    return order_service.get_order(db, order_id, user)

@router.post("/orders/{order_id}/broadcast", response_model=BroadcastOut)
def broadcast(order_id: int, data: BroadcastRequest, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    order = order_service.get_order(db, order_id, user)
    count = dispatch_service.broadcast(db, order, user.id, data.radius_km)
    db.commit()
    return {"order_id": order.id, "offers_sent": count}

@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel(order_id: int, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    return order_service.cancel_order(db, order_service.get_order(db, order_id, user), user.id)

@router.get("/orders/{order_id}/tracking", response_model=TrackingOut)
def tracking(order_id: int, user: User = Depends(admin_user), db: Session = Depends(get_db)):
    return tracking_service.tracking(db, order_service.get_order(db, order_id, user))

@router.get("/orders/{order_id}/events", response_model=List[EventOut])
def events(order_id: int, offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100),
           user: User = Depends(admin_user), db: Session = Depends(get_db)):
    order_service.get_order(db, order_id, user)
    return db.query(OrderEvent).filter_by(order_id=order_id).order_by(OrderEvent.id).offset(offset).limit(limit).all()

@router.get("/reviews", response_model=List[ReviewOut])
def reviews(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.id.desc()).offset(offset).limit(limit).all()

@router.get("/analytics", response_model=AnalyticsOut)
def analytics(db: Session = Depends(get_db)):
    return analytics_service.summary(db)
