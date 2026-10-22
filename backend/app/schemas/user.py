from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserOut(ORMModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    zone: Optional[str]
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    role: Literal["customer", "rider", "admin"]
    is_active: bool
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, min_length=5, max_length=32)

class UserActivation(BaseModel):
    is_active: bool
