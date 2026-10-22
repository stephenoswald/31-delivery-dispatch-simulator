from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.dependencies import rider_user, rider_profile
from app.db.session import get_db
from app.models import User, RiderProfile, BroadcastOffer, Order, Review
from app.schemas.rider import RiderOut, RiderUpdate, AvailabilityUpdate, LocationUpdate, OfferOut, OfferDetail
from app.schemas.order import OrderOut, OrderProgress, OrderStatus
from app.schemas.review import ReviewOut
from app.utils.datetime import utcnow
from app.services import rider_service, dispatch_service, order_service

router = APIRouter(prefix="/rider", tags=["Rider"], dependencies=[Depends(rider_user)])

@router.get("/profile", response_model=RiderOut)
def profile(rider: RiderProfile = Depends(rider_profile)):
    return rider

@router.patch("/profile", response_model=RiderOut)
def update_profile(data: RiderUpdate, rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    rider.vehicle_type = data.vehicle_type
    db.commit()
    db.refresh(rider)
    return rider

@router.patch("/availability", response_model=RiderOut)
def availability(data: AvailabilityUpdate, rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    return rider_service.availability(db, rider, data.status)

@router.post("/location", response_model=RiderOut)
def location(data: LocationUpdate, rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    return rider_service.location(db, rider, data)

@router.get("/offers", response_model=List[OfferDetail])
def offers(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
           rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    eligible_ids = dispatch_service.refresh_rider_requests(db, rider)
    rows = db.query(BroadcastOffer, Order).join(Order, Order.id == BroadcastOffer.order_id).filter(
        BroadcastOffer.rider_id == rider.id, BroadcastOffer.status == "pending",
        BroadcastOffer.expires_at > utcnow(), Order.status == "broadcasting",
        Order.rider_id.is_(None), Order.payment_status == "paid", Order.id.in_(eligible_ids)).order_by(BroadcastOffer.id.desc()).offset(offset).limit(limit).all()
    return [OfferDetail(**OfferOut.model_validate(offer).model_dump(), order=OrderOut.model_validate(order)) for offer, order in rows]

@router.post("/offers/{offer_id}/accept", response_model=OrderOut)
def accept(offer_id: int, rider: RiderProfile = Depends(rider_profile), user: User = Depends(rider_user), db: Session = Depends(get_db)):
    return dispatch_service.accept_offer(db, dispatch_service.get_offer(db, offer_id, rider), rider, user)

@router.post("/offers/{offer_id}/reject", response_model=OfferOut)
def reject(offer_id: int, rider: RiderProfile = Depends(rider_profile), user: User = Depends(rider_user), db: Session = Depends(get_db)):
    return dispatch_service.reject_offer(db, dispatch_service.get_offer(db, offer_id, rider), user)

@router.get("/orders", response_model=List[OrderOut])
def orders(status: Optional[OrderStatus] = None, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
           rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    query = db.query(Order).filter_by(rider_id=rider.id)
    if status:
        query = query.filter_by(status=status)
    return query.order_by(Order.id.desc()).offset(offset).limit(limit).all()

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(rider_user), db: Session = Depends(get_db)):
    return order_service.get_order(db, order_id, user)

@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def progress(order_id: int, data: OrderProgress, rider: RiderProfile = Depends(rider_profile),
             user: User = Depends(rider_user), db: Session = Depends(get_db)):
    return order_service.progress_order(db, order_service.get_order(db, order_id, user), rider, user.id, data.status, data.delivery_code)

@router.get("/reviews", response_model=List[ReviewOut])
def reviews(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
            rider: RiderProfile = Depends(rider_profile), db: Session = Depends(get_db)):
    return db.query(Review).filter_by(rider_id=rider.id).order_by(Review.id.desc()).offset(offset).limit(limit).all()
