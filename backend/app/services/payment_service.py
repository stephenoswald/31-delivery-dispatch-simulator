from decimal import Decimal, ROUND_HALF_UP
import secrets
from fastapi import HTTPException
from app.utils.geo import distance_km
from app.utils.datetime import utcnow
from app.services.order_service import add_event

BASE_FARE_MINOR = 50000
RATE_PER_KM_MINOR = 10000

def quote(data):
    distance = Decimal(str(distance_km(data.pickup_latitude, data.pickup_longitude,
                                      data.dropoff_latitude, data.dropoff_longitude))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = BASE_FARE_MINOR + int(distance * RATE_PER_KM_MINOR)
    return {'distance_km': float(distance), 'base_fare_minor': BASE_FARE_MINOR,
            'rate_per_km_minor': RATE_PER_KM_MINOR, 'delivery_fee_minor': total,
            'currency': 'NGN'}

def pay(db, order, user, outcome):
    if order.status == 'cancelled':
        raise HTTPException(409, 'Cancelled deliveries cannot be paid for')
    if order.payment_status == 'paid':
        return order  # Retries and concurrent submissions reuse the receipt.
    if order.status != 'pending':
        raise HTTPException(409, 'This delivery cannot be paid for')
    if outcome == 'failed':
        add_event(db, order, user.id, 'payment_failed', order.status, {'simulated': True})
        db.commit()
        raise HTTPException(402, 'Simulated payment failed. No money was charged. You can retry.')
    order.payment_status = 'paid'
    order.payment_reference = 'SIM-' + secrets.token_hex(12).upper()
    order.paid_at = utcnow()
    add_event(db, order, user.id, 'payment_succeeded', order.status,
              {'simulated': True, 'amount_minor': order.delivery_fee_minor, 'currency': order.currency,
               'reference': order.payment_reference})
    from app.services.dispatch_service import broadcast
    broadcast(db, order, user.id)
    db.commit()
    db.refresh(order)
    return order
