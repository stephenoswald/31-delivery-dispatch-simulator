from typing import Dict, Optional
from pydantic import BaseModel

class AnalyticsOut(BaseModel):
    total_users: int
    total_riders: int
    available_riders: int
    total_orders: int
    orders_by_status: Dict[str, int]
    delivered_fee_minor: int
    average_rating: Optional[float]
