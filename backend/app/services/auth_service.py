from fastapi import HTTPException
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_token
from app.models import User, RiderProfile
from app.schemas.auth import TokenOut
from app.schemas.user import UserOut

DUMMY_HASH = hash_password("dummy login timing password")

def register(db, data):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(409, "Email already registered")
    user = User(**data.model_dump(exclude={"password"}), password_hash=hash_password(data.password))
    db.add(user)
    db.flush()
    if user.role == "rider":
        db.add(RiderProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user

def login(db, data):
    user = db.query(User).filter_by(email=data.email).first()
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if not valid or user is None or not user.is_active:
        raise HTTPException(401, "Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    return TokenOut(access_token=create_token(user.id), expires_in=settings.token_ttl_seconds,
                    user=UserOut.model_validate(user))
