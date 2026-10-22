from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
from app.schemas.user import UserOut

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

class Register(Credentials):
    full_name: str = Field(min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, min_length=5, max_length=32)
    role: Literal["customer", "rider"] = "customer"

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
