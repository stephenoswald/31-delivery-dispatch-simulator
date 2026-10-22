from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.user import ORMModel
from app.schemas.order import OrderOut

class RiderOut(ORMModel):
    id: int
    user_id: int
    status: Literal["offline", "available", "busy"]
    vehicle_type: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    location_updated_at: Optional[datetime]
    created_at: datetime

class RiderUpdate(BaseModel):
    vehicle_type: str = Field(min_length=1, max_length=32)

class AvailabilityUpdate(BaseModel):
    status: Literal["offline", "available"]

class LocationUpdate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

class OfferOut(ORMModel):
    id: int
    order_id: int
    rider_id: int
    status: Literal["pending", "accepted", "rejected", "expired", "withdrawn"]
    expires_at: datetime
    responded_at: Optional[datetime]
    created_at: datetime

class OfferDetail(OfferOut):
    order: OrderOut
