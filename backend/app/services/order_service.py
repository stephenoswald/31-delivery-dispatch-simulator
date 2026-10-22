from fastapi import HTTPException
from app.models import Order, OrderEvent, RiderProfile, BroadcastOffer
from app.utils.identifiers import tracking_code
from app.utils.datetime import utcnow

ACTIVE = ("assigned", "picked_up", "in_transit")

def get_order(db, order_id, user):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if user.role == "customer" and order.customer_id == user.id:
        return order
    if user.role == "rider":
        rider = db.query(RiderProfile).filter_by(user_id=user.id).first()
        if rider and order.rider_id == rider.id:
            return order
    if user.role == "admin":
        return order
    raise HTTPException(404, "Order not found")

def add_event(db, order, actor_id, event_type, previous=None, details=None):
    db.add(OrderEvent(order_id=order.id, actor_id=actor_id, event_type=event_type,
                      previous_status=previous, new_status=order.status, details=details))

def create_order(db, user, data):
    from app.services.dispatch_service import broadcast
    order = Order(**data.model_dump(), customer_id=user.id, tracking_code=tracking_code(), status="pending")
    db.add(order)
    db.flush()
    add_event(db, order, user.id, "created")
    broadcast(db, order, user.id)
    db.commit()
    db.refresh(order)
    return order

def cancel_order(db, order, actor_id):
    if order.status not in ("pending", "broadcasting", "assigned"):
        raise HTTPException(409, "Order can only be cancelled before pickup")
    previous = order.status
    if order.rider_id is not None:
        rider = db.get(RiderProfile, order.rider_id)
        rider.status = "available"
    order.status = "cancelled"
    db.query(BroadcastOffer).filter_by(order_id=order.id, status="pending").update({"status": "withdrawn"}, synchronize_session=False)
    add_event(db, order, actor_id, "cancelled", previous)
    db.commit()
    db.refresh(order)
    return order

def progress_order(db, order, rider, actor_id, status):
    transitions = {"assigned": "picked_up", "picked_up": "in_transit", "in_transit": "delivered"}
    if transitions.get(order.status) != status:
        raise HTTPException(409, "Invalid delivery status transition")
    previous = order.status
    order.status = status
    if status == "delivered":
        order.delivered_at = utcnow()
        rider.status = "available"
    add_event(db, order, actor_id, status, previous)
    db.commit()
    db.refresh(order)
    return order
