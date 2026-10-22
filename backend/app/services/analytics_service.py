from sqlalchemy import func
from app.models import User, RiderProfile, Order, Review


def summary(db):
    return dict(total_users=db.query(User).count(), total_riders=db.query(RiderProfile).count(),
        available_riders=db.query(RiderProfile).join(User, User.id == RiderProfile.user_id).filter(
            RiderProfile.status == "available", User.is_active.is_(True)).count(),
        total_orders=db.query(Order).count(),
        orders_by_status=dict(db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()),
        delivered_fee_minor=db.query(func.coalesce(func.sum(Order.delivery_fee_minor), 0)).filter(Order.status == "delivered").scalar(),
        average_rating=db.query(func.avg(Review.rating)).scalar())
