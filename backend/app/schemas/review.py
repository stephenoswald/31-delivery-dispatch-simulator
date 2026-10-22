from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import ORMModel

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)

class ReviewOut(ORMModel):
    id: int
    order_id: int
    customer_id: int
    rider_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
