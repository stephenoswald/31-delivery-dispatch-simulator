from fastapi import HTTPException
from app.core.config import settings
from app.models import LocationHistory, Order
from app.services.order_service import ACTIVE
from app.utils.datetime import utcnow


def availability(db, rider, status):
    if db.query(Order.id).filter(Order.rider_id == rider.id, Order.status.in_(ACTIVE)).first():
        raise HTTPException(409, "Complete the active delivery before changing availability")
    rider.status = status
    db.commit()
    db.refresh(rider)
    return rider


def location(db, rider, data):
    if settings.location_mode == "static":
        raise HTTPException(409, "Static location mode is enabled; rider positions are fixed by the demo seed")
    rider.latitude, rider.longitude = data.latitude, data.longitude
    rider.location_updated_at = utcnow()
    order = db.query(Order).filter(Order.rider_id == rider.id, Order.status.in_(ACTIVE)).first()
    db.add(LocationHistory(rider_id=rider.id, order_id=order.id if order else None,
                           latitude=data.latitude, longitude=data.longitude, recorded_at=rider.location_updated_at))
    db.commit()
    db.refresh(rider)
    return rider
