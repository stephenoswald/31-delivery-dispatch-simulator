from datetime import timedelta
from fastapi import HTTPException
from sqlalchemy import update
from app.core.config import settings
from app.models import BroadcastOffer, LocationHistory, Order, OrderEvent, RiderProfile, User
from app.services.order_service import ACTIVE, add_event
from app.utils.datetime import utcnow
from app.utils.geo import distance_km


def broadcast(db, order, actor_id, radius_km=None):
    if order.payment_status != "paid":
        raise HTTPException(409, "Payment is required before dispatch")
    if order.status not in ("pending", "broadcasting"):
        raise HTTPException(409, "Only unassigned orders can be broadcast")
    now = utcnow()
    radius = radius_km if radius_km is not None else settings.dispatch_radius_km
    # A rebroadcast replaces pending invitations and refreshes eligible riders.
    db.query(BroadcastOffer).filter_by(order_id=order.id, status="pending").update({"status": "withdrawn"}, synchronize_session=False)
    db.flush()
    riders = db.query(RiderProfile).join(User, User.id == RiderProfile.user_id).filter(
        User.is_active.is_(True), RiderProfile.status == "available",
        RiderProfile.latitude.isnot(None), RiderProfile.longitude.isnot(None))
    if settings.location_mode == "live":
        riders = riders.filter(RiderProfile.location_updated_at >= now - timedelta(seconds=settings.location_max_age_seconds))
    riders = riders.all()
    count = 0
    for rider in riders:
        if distance_km(order.pickup_latitude, order.pickup_longitude, rider.latitude, rider.longitude) > radius:
            continue
        if db.query(Order.id).filter(Order.rider_id == rider.id, Order.status.in_(ACTIVE)).first():
            continue
        offer = db.query(BroadcastOffer).filter_by(order_id=order.id, rider_id=rider.id).first()
        if offer is None:
            offer = BroadcastOffer(order_id=order.id, rider_id=rider.id)
            db.add(offer)
        offer.status = "pending"
        offer.expires_at = now + timedelta(seconds=settings.offer_ttl_seconds)
        offer.responded_at = None
        count += 1
    previous = order.status
    order.status = "broadcasting"
    add_event(db, order, actor_id, "broadcast", previous, {"radius_km": radius, "offers_sent": count})
    db.flush()
    return count


def refresh_rider_requests(db, rider):
    """Discover waiting orders on polling, including bookings made while offline.

    Declines remain final until an explicit admin rebroadcast. Expired invitations
    are renewed only while the order is still unassigned and the rider eligible.
    """
    now = utcnow()
    if (rider.status != "available" or rider.latitude is None or rider.longitude is None
            or (settings.location_mode == "live" and
                (rider.location_updated_at is None or rider.location_updated_at <
                 now - timedelta(seconds=settings.location_max_age_seconds)))
            or db.query(Order.id).filter(Order.rider_id == rider.id, Order.status.in_(ACTIVE)).first()):
        return []
    eligible_ids = []
    changed = False
    for order in db.query(Order).filter(Order.status == "broadcasting", Order.payment_status == "paid", Order.rider_id.is_(None)).all():
        event = db.query(OrderEvent).filter_by(order_id=order.id, event_type="broadcast").order_by(OrderEvent.id.desc()).first()
        radius = (event.details or {}).get("radius_km", settings.dispatch_radius_km) if event else settings.dispatch_radius_km
        if distance_km(order.pickup_latitude, order.pickup_longitude, rider.latitude, rider.longitude) > radius:
            continue
        offer = db.query(BroadcastOffer).filter_by(order_id=order.id, rider_id=rider.id).first()
        if offer is not None and offer.status not in ("pending", "expired"):
            continue
        if offer is None:
            offer = BroadcastOffer(order_id=order.id, rider_id=rider.id)
            db.add(offer)
        if offer.expires_at is None or offer.expires_at <= now or offer.status == "expired":
            offer.status = "pending"
            offer.expires_at = now + timedelta(seconds=settings.offer_ttl_seconds)
            offer.responded_at = None
            changed = True
        eligible_ids.append(order.id)
    if changed:
        db.commit()
    return eligible_ids


def get_offer(db, offer_id, rider):
    offer = db.query(BroadcastOffer).filter_by(id=offer_id, rider_id=rider.id).first()
    if offer is None:
        raise HTTPException(404, "Offer not found")
    return offer


def accept_offer(db, offer, rider, user):
    now = utcnow()
    if offer.status != "pending" or offer.expires_at <= now:
        raise HTTPException(409, "Offer is no longer available")
    rider_claim = db.execute(update(RiderProfile).where(RiderProfile.id == rider.id,
        RiderProfile.status == "available").values(status="busy").execution_options(synchronize_session=False))
    if rider_claim.rowcount != 1:
        raise HTTPException(409, "Rider is not available")
    claim = db.execute(update(Order).where(Order.id == offer.order_id, Order.status == "broadcasting", Order.payment_status == "paid",
        Order.rider_id.is_(None)).values(rider_id=rider.id, status="assigned").execution_options(synchronize_session=False))
    if claim.rowcount != 1:
        raise HTTPException(409, "Order has already been claimed or cancelled")
    response = db.execute(update(BroadcastOffer).where(BroadcastOffer.id == offer.id,
        BroadcastOffer.status == "pending", BroadcastOffer.expires_at > now).values(
        status="accepted", responded_at=now).execution_options(synchronize_session=False))
    if response.rowcount != 1:
        raise HTTPException(409, "Offer is no longer available")
    db.query(BroadcastOffer).filter(BroadcastOffer.order_id == offer.order_id,
        BroadcastOffer.id != offer.id, BroadcastOffer.status == "pending").update({"status": "withdrawn"}, synchronize_session=False)
    order = db.get(Order, offer.order_id)
    db.refresh(order)
    if settings.location_mode == "static" and rider.latitude is not None and rider.longitude is not None:
        db.add(LocationHistory(rider_id=rider.id, order_id=order.id, latitude=rider.latitude,
                               longitude=rider.longitude, recorded_at=now))
    add_event(db, order, user.id, "assigned", "broadcasting", {"rider_id": rider.id, "offer_id": offer.id})
    db.commit()
    db.refresh(order)
    return order


def reject_offer(db, offer, user):
    if offer.status != "pending" or offer.expires_at <= utcnow():
        raise HTTPException(409, "Offer is no longer available")
    offer.status = "rejected"
    offer.responded_at = utcnow()
    order = db.get(Order, offer.order_id)
    add_event(db, order, user.id, "offer_rejected", order.status, {"offer_id": offer.id})
    db.commit()
    db.refresh(offer)
    return offer
