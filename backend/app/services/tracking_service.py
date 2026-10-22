from app.models import LocationHistory, OrderEvent
from app.schemas.tracking import TrackingOut, LocationOut, EventOut


def tracking(db, order):
    latest = db.query(LocationHistory).filter_by(order_id=order.id).order_by(LocationHistory.recorded_at.desc(), LocationHistory.id.desc()).first()
    events = db.query(OrderEvent).filter_by(order_id=order.id).order_by(OrderEvent.id.desc()).limit(100).all()
    return TrackingOut(order_id=order.id, tracking_code=order.tracking_code, status=order.status,
                       rider_id=order.rider_id, latest_location=LocationOut.model_validate(latest) if latest else None,
                       events=[EventOut.model_validate(e) for e in reversed(events)])
