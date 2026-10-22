from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.user import ORMModel

OrderStatus = Literal["pending", "broadcasting", "assigned", "picked_up", "in_transit", "delivered", "cancelled"]

class OrderCreate(BaseModel):
    pickup_address: str = Field(min_length=1, max_length=1000)
    pickup_latitude: float = Field(ge=-90, le=90)
    pickup_longitude: float = Field(ge=-180, le=180)
    dropoff_address: str = Field(min_length=1, max_length=1000)
    dropoff_latitude: float = Field(ge=-90, le=90)
    dropoff_longitude: float = Field(ge=-180, le=180)
    recipient_name: str = Field(min_length=1, max_length=120)
    recipient_phone: str = Field(min_length=5, max_length=32)
    package_description: Optional[str] = Field(default=None, max_length=2000)

class QuoteInput(BaseModel):
    pickup_latitude: float = Field(ge=-90, le=90)
    pickup_longitude: float = Field(ge=-180, le=180)
    dropoff_latitude: float = Field(ge=-90, le=90)
    dropoff_longitude: float = Field(ge=-180, le=180)

class QuoteOut(BaseModel):
    distance_km: float
    base_fare_minor: int
    rate_per_km_minor: int
    delivery_fee_minor: int
    currency: str

class PaymentInput(BaseModel):
    outcome: Literal["success", "failed"] = "success"

class OrderOut(OrderCreate, ORMModel):
    distance_km: float
    payment_status: Literal["unpaid", "paid"]
    payment_reference: Optional[str]
    paid_at: Optional[datetime]
    id: int
    tracking_code: str
    customer_id: int
    rider_id: Optional[int]
    status: OrderStatus
    delivery_fee_minor: int
    currency: str
    delivered_at: Optional[datetime]
    created_at: datetime

class OrderProgress(BaseModel):
    delivery_code: Optional[str] = Field(default=None, pattern=r"^[0-9]{6}$")
    status: Literal["picked_up", "in_transit", "delivered"]

class BroadcastRequest(BaseModel):
    radius_km: float = Field(default=5, gt=0, le=100)

class BroadcastOut(BaseModel):
    order_id: int
    offers_sent: int
