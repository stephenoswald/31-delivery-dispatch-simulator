from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import current_user
from app.db.session import get_db
from app.models import User, RiderProfile
from app.schemas.auth import Register, Credentials, TokenOut
from app.schemas.user import UserOut, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: Register, db: Session = Depends(get_db)):
    return auth_service.register(db, data)

@router.post("/login", response_model=TokenOut)
def login(data: Credentials, db: Session = Depends(get_db)):
    return auth_service.login(db, data)

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user

@router.patch("/me", response_model=UserOut)
def update_me(data: UserUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    changes = data.model_dump(exclude_unset=True)
    if "full_name" in changes and changes["full_name"] is None:
        raise HTTPException(422, "full_name cannot be null")
    for key, value in changes.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/logout")
def logout(user: User = Depends(current_user), db: Session = Depends(get_db)):
    # Going offline does not cancel or release an already assigned delivery.
    if user.role == "rider":
        db.query(RiderProfile).filter_by(user_id=user.id).update({"status": "offline"}, synchronize_session=False)
    db.commit()
    return {"status": "signed_out"}
