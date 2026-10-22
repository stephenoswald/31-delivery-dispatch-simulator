from fastapi import APIRouter
from app.api.v1 import auth, customer, rider, admin, support

router = APIRouter()
for module in (auth, customer, rider, admin, support):
    router.include_router(module.router)
