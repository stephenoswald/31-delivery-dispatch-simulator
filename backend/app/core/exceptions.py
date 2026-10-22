from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

def register_handlers(app):
    @app.exception_handler(IntegrityError)
    async def integrity_error(request, exc):
        return JSONResponse(status_code=409, content={"detail": "Change conflicts with existing data"})

    @app.exception_handler(OperationalError)
    async def operational_error(request, exc):
        if "locked" in str(exc.orig).lower() or "busy" in str(exc.orig).lower():
            return JSONResponse(status_code=409, content={"detail": "Database busy; retry the request"})
        raise exc
