from datetime import datetime
from typing import Optional, Any, List
from app.schemas.user import ORMModel
from app.schemas.order import OrderStatus
from pydantic import BaseModel

class EventOut(ORMModel):
    id: int
    order_id: int
    actor_id: Optional[int]
    event_type: str
    previous_status: Optional[str]
    new_status: Optional[str]
    details: Optional[Any]
    created_at: datetime

class LocationOut(ORMModel):
    id: int
    rider_id: int
    order_id: Optional[int]
    latitude: float
    longitude: float
    recorded_at: datetime

class TrackingOut(BaseModel):
    order_id: int
    tracking_code: str
    status: OrderStatus
    rider_id: Optional[int]
    latest_location: Optional[LocationOut]
    events: List[EventOut]
