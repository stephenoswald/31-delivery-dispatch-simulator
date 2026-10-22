import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import hash_password, create_token
from app.models import User, RiderProfile

@pytest.fixture(scope="session")
def password_hash():
    return hash_password("password123")

@pytest.fixture
def api(tmp_path, password_hash, monkeypatch):
    # Existing live-GPS tests explicitly exercise live mode; static tests opt in.
    from app.core.config import settings
    monkeypatch.setattr(settings, "location_mode", "live")
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False, "timeout": 10})
    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, autoflush=False)
    with sessions() as db:
        for i, role in [(1,"customer"), (2,"customer"), (3,"rider"), (4,"rider"), (5,"admin")]:
            db.add(User(id=i, email=f"user{i}@example.com", full_name=f"User {i}", role=role, password_hash=password_hash))
        db.flush()
        db.add_all([RiderProfile(id=1, user_id=3), RiderProfile(id=2, user_id=4)])
        db.commit()

    def test_db(request: Request):
        with sessions() as db:
            try:
                if (request.method in {"POST", "PATCH", "PUT", "DELETE"} or request.url.path == "/api/v1/rider/offers"):
                    db.connection().exec_driver_sql("BEGIN IMMEDIATE")
                yield db
            except Exception:
                db.rollback()
                raise
    app.dependency_overrides[get_db] = test_db
    with TestClient(app) as client:
        yield client, sessions
    app.dependency_overrides.clear()
    engine.dispose()

@pytest.fixture
def client(api):
    return api[0]

@pytest.fixture
def headers():
    return lambda user_id: {"Authorization": f"Bearer {create_token(user_id)}"}

@pytest.fixture
def order_payload():
    return dict(pickup_address="Ikeja", pickup_latitude=6.6, pickup_longitude=3.35,
                dropoff_address="Yaba", dropoff_latitude=6.51, dropoff_longitude=3.37,
                recipient_name="Recipient", recipient_phone="+2348000000000", package_description="Books")

@pytest.fixture
def ready_riders(client, headers):
    for uid in (3, 4):
        assert client.post("/api/v1/rider/location", headers=headers(uid), json={"latitude":6.6,"longitude":3.35}).status_code == 200
        assert client.patch("/api/v1/rider/availability", headers=headers(uid), json={"status":"available"}).status_code == 200

def create_order(client, headers, payload):
    result = client.post("/api/v1/customer/orders", headers=headers(1), json=payload)
    assert result.status_code == 201, result.text
    paid = client.post(f"/api/v1/customer/orders/{result.json()['id']}/pay", headers=headers(1), json={"outcome":"success"})
    assert paid.status_code == 200, paid.text
    return paid.json()

def offer_id(client, headers, uid=3):
    result = client.get("/api/v1/rider/offers", headers=headers(uid))
    assert result.status_code == 200, result.text
    return result.json()[0]["id"]
