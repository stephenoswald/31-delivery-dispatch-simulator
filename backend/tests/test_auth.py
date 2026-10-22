import time
from app.core.config import settings
from app.core.security import create_token
from app.models import RiderProfile


def test_register_login_and_profile(api):
    client, sessions = api
    payload = dict(email=" NEW@EXAMPLE.COM ", password="password123", full_name="New Rider", role="rider")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    assert response.json()["email"] == "new@example.com"
    assert "password_hash" not in response.json()
    with sessions() as db:
        assert db.query(RiderProfile).filter_by(user_id=response.json()["id"]).count() == 1
    login = client.post("/api/v1/auth/login", json={"email":"new@example.com", "password":"password123"})
    assert login.status_code == 200
    headers = {"Authorization": "Bearer " + login.json()["access_token"]}
    assert client.get("/api/v1/auth/me", headers=headers).json()["role"] == "rider"
    assert client.patch("/api/v1/auth/me", headers=headers, json={"full_name":"Updated"}).json()["full_name"] == "Updated"
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_authentication_and_role_boundaries(client, headers):
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization":"Bearer nonsense"}).status_code == 401
    token = create_token(1)
    assert client.get("/api/v1/auth/me", headers={"Authorization":"Bearer " + token + "tampered"}).status_code == 401
    assert client.get("/api/v1/admin/users", headers=headers(1)).status_code == 403
    assert client.get("/api/v1/customer/orders", headers=headers(3)).status_code == 403
    assert client.get("/api/v1/rider/profile", headers=headers(1)).status_code == 403
    assert client.post("/api/v1/auth/register", json=dict(email="admin@example.com", password="password123", full_name="Admin", role="admin")).status_code == 422
    assert client.post("/api/v1/auth/login", json={"email":"user1@example.com","password":"incorrect"}).status_code == 401


def test_expired_token(client, monkeypatch):
    monkeypatch.setattr("app.core.security.time.time", lambda: 1)
    token = create_token(1)
    monkeypatch.setattr("app.core.security.time.time", lambda: 1 + settings.token_ttl_seconds)
    assert client.get("/api/v1/auth/me", headers={"Authorization":f"Bearer {token}"}).status_code == 401


def test_logout_marks_rider_offline_for_admin(client, headers, ready_riders):
    assert client.post('/api/v1/auth/logout').status_code == 401
    assert client.post('/api/v1/auth/logout',headers=headers(3)).status_code == 200
    riders = client.get('/api/v1/admin/riders', headers=headers(5)).json()
    assert next(r for r in riders if r['user_id']==3)['status']=='offline'
    assert next(r for r in riders if r['user_id']==4)['status']=='available'
    assert client.get('/api/v1/admin/analytics',headers=headers(5)).json()['available_riders']==1
    assert client.post('/api/v1/auth/logout',headers=headers(3)).status_code == 200
    assert client.post('/api/v1/auth/logout',headers=headers(1)).status_code == 200


def test_logout_preserves_active_delivery_and_login_restores_busy(client, headers, ready_riders, order_payload):
    from conftest import create_order, offer_id
    oid=create_order(client,headers,order_payload)['id']
    assert client.post(f'/api/v1/rider/offers/{offer_id(client,headers)}/accept',headers=headers(3)).status_code==200
    assert client.post('/api/v1/auth/logout',headers=headers(3)).status_code==200
    assert client.get('/api/v1/rider/profile',headers=headers(3)).json()['status']=='offline'
    assert client.get(f'/api/v1/customer/orders/{oid}',headers=headers(1)).json()['rider_id']==1
    login=client.post('/api/v1/auth/login',json={'email':'user3@example.com','password':'password123'})
    assert login.status_code==200
    auth={'Authorization':'Bearer '+login.json()['access_token']}
    assert client.get('/api/v1/rider/profile',headers=auth).json()['status']=='busy'
