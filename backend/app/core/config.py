import secrets
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./dispatch.db"
    auth_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(48), min_length=32)
    token_ttl_seconds: int = Field(default=3600, ge=60, le=86400)
    location_mode: Literal["static", "live"] = "static"
    dispatch_radius_km: float = Field(default=5, gt=0, le=100)
    offer_ttl_seconds: int = Field(default=60, ge=10, le=3600)
    location_max_age_seconds: int = Field(default=300, ge=10, le=3600)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
