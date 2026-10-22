from datetime import timedelta
from app.core.config import settings
from app.db.demo_data import demo_accounts
from app.db.seed import seed_demo
from app.models import User, RiderProfile
from app.utils.datetime import utcnow
from conftest import create_order, offer_id


def test_seed_sets_fixed_contacts_and_preserves_accounts(api, password_hash, monkeypatch):
    client, sessions = api
    monkeypatch.setattr('app.db.seed.hash_password', lambda password: password_hash)
    with sessions.begin() as db:
        assert seed_demo(db)['users_created'] == 30
    with sessions.begin() as db:
        rider = db.query(User).filter_by(email='rider01@example.com').one()
        rider.password_hash = 'unchanged-password'
        db.query(RiderProfile).filter_by(user_id=rider.id).one().status = 'available'
    with sessions.begin() as db:
        result = seed_demo(db)
        assert result['users_created'] == 0
        assert result['users_updated'] == 30
    with sessions() as db:
        users = db.query(User).filter_by(zone='Port Harcourt').all()
        assert len(users) == 30
        assert len({u.phone for u in users}) == 30
        assert all(u.address and 4.7 < u.latitude < 4.9 and 6.9 < u.longitude < 7.1 for u in users)
        rider = db.query(User).filter_by(email='rider01@example.com').one()
        profile = db.query(RiderProfile).filter_by(user_id=rider.id).one()
        assert rider.password_hash == 'unchanged-password'
        assert profile.status == 'available'
        assert (rider.latitude, rider.longitude) == (profile.latitude, profile.longitude)


def test_static_dispatch_tracking_and_location_updates(api, headers, order_payload, ready_riders, monkeypatch):
    client, sessions = api
    monkeypatch.setattr(settings, 'location_mode', 'static')
    with sessions.begin() as db:
        db.get(RiderProfile, 1).location_updated_at = utcnow() - timedelta(days=30)
    order_id = create_order(client, headers, order_payload)['id']
    invite = offer_id(client, headers)
    assert client.post(f'/api/v1/rider/offers/{invite}/accept', headers=headers(3)).status_code == 200
    response = client.get(f'/api/v1/customer/orders/{order_id}/tracking', headers=headers(1))
    assert response.json()['latest_location']['latitude'] == 6.6
    assert client.post('/api/v1/rider/location', headers=headers(3), json={'latitude': 4.8, 'longitude': 7.0}).status_code == 409
    assert client.get('/api/v1/rider/profile', headers=headers(3)).json()['latitude'] == 6.6
