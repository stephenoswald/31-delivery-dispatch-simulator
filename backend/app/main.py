from fastapi import FastAPI
from app.api.v1.router import router
from app.core.exceptions import register_handlers

app = FastAPI(title="SwiftDispatch", version="0.2.0", description="Delivery dispatch, tracking, and customer feedback API")
register_handlers(app)
app.include_router(router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
