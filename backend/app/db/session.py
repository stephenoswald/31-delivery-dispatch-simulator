from fastapi import Request
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False, "timeout": 10} if settings.database_url.startswith("sqlite") else {})
if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(bind=engine, autoflush=False)

def get_db(request: Request):
    with SessionLocal() as session:
        try:
            # Serialize SQLite writers before any reads: competing accept requests
            # see the committed winner instead of upgrading a stale read snapshot.
            if engine.dialect.name == "sqlite" and (request.method in {"POST", "PUT", "PATCH", "DELETE"} or request.url.path == "/api/v1/rider/offers"):
                session.connection().exec_driver_sql("BEGIN IMMEDIATE")
            yield session
        except Exception:
            session.rollback()
            raise
