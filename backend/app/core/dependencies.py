from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import token_subject
from app.models import User, RiderProfile

bearer = HTTPBearer(auto_error=False)

def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Bearer token required", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, token_subject(credentials.credentials))
    if user is None or not user.is_active:
        raise HTTPException(401, "Account unavailable", headers={"WWW-Authenticate": "Bearer"})
    return user

def require_role(role):
    def dependency(user: User = Depends(current_user)):
        if user.role != role:
            raise HTTPException(403, "This account cannot access this endpoint")
        return user
    return dependency

customer_user = require_role("customer")
rider_user = require_role("rider")
admin_user = require_role("admin")

def rider_profile(user: User = Depends(rider_user), db: Session = Depends(get_db)):
    profile = db.query(RiderProfile).filter_by(user_id=user.id).first()
    if profile is None:
        raise HTTPException(404, "Rider profile not found")
    return profile
