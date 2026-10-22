from fastapi import HTTPException
from app.models import Review


def create_review(db, order, user, data):
    if order.status != "delivered" or order.rider_id is None:
        raise HTTPException(409, "Only delivered orders can be reviewed")
    if db.query(Review).filter_by(order_id=order.id).first():
        raise HTTPException(409, "Order already reviewed")
    review = Review(order_id=order.id, customer_id=user.id, rider_id=order.rider_id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
