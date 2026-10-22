"""Repeatable Port Harcourt demo accounts; caller owns the transaction."""
from app.core.security import hash_password
from app.db.demo_data import demo_accounts
from app.models import RiderProfile, User
from app.utils.datetime import utcnow


def seed_demo(db, password="DemoPass123!"):
    if not 8 <= len(password) <= 128:
        raise ValueError("Password must contain 8–128 characters")
    created = profiles_created = updated = 0
    for data in demo_accounts():
        user = db.query(User).filter_by(email=data["email"]).first()
        if user is not None and user.role != data["role"]:
            raise ValueError(f'{data["email"]} already exists with a different role; no changes committed')
        if user is None:
            user = User(**data, password_hash=hash_password(password), is_active=True)
            db.add(user)
            db.flush()
            created += 1
        else:
            # Refresh only the explicitly fixed demo contact/location fields.
            for key in ("phone", "zone", "address", "latitude", "longitude"):
                setattr(user, key, data[key])
            updated += 1
        if user.role == "rider":
            rider = db.query(RiderProfile).filter_by(user_id=user.id).first()
            if rider is None:
                rider = RiderProfile(user_id=user.id, vehicle_type="motorcycle", status="offline")
                db.add(rider)
                profiles_created += 1
            rider.latitude, rider.longitude = data["latitude"], data["longitude"]
            rider.location_updated_at = utcnow()
        db.flush()
    return {"users_created": created, "users_updated": updated,
            "rider_profiles_created": profiles_created}
