from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from sqlalchemy import func
from app.models import BroadcastOffer, Order, RiderProfile
from app.utils.datetime import utcnow
from conftest import create_order, offer_id


def test_concurrent_acceptance_has_one_winner(api, headers, order_payload, ready_riders):
    client, sessions = api
    order = create_order(client, headers, order_payload)
    invites = [(uid, offer_id(client, headers, uid)) for uid in (3,4)]
    def accept(pair):
        uid, oid = pair
        return client.post(f"/api/v1/rider/offers/{oid}/accept", headers=headers(uid)).status_code
    with ThreadPoolExecutor(max_workers=2) as executor:
        codes = list(executor.map(accept, invites))
    assert sorted(codes) == [200,409]
    with sessions() as db:
        assert db.query(BroadcastOffer).filter_by(order_id=order["id"], status="accepted").count() == 1
        assert db.query(RiderProfile).filter_by(status="busy").count() == 1
        assert db.get(Order, order["id"]).status == "assigned"


def test_one_rider_cannot_claim_two_orders(api, headers, order_payload, ready_riders):
    client, sessions = api
    first = create_order(client, headers, order_payload)
    second = create_order(client, headers, order_payload)
    offers = client.get("/api/v1/rider/offers", headers=headers(3)).json()
    def accept(offer):
        return client.post(f"/api/v1/rider/offers/{offer['id']}/accept", headers=headers(3)).status_code
    with ThreadPoolExecutor(max_workers=2) as executor:
        assert sorted(executor.map(accept, offers)) == [200,409]
    with sessions() as db:
        assert db.query(Order).filter_by(rider_id=1, status="assigned").count() == 1


def test_radius_stale_locations_and_offer_expiry(api, headers, order_payload, ready_riders):
    client, sessions = api
    client.post("/api/v1/rider/location", headers=headers(4), json={"latitude":0,"longitude":0})
    create_order(client, headers, order_payload)
    assert client.get("/api/v1/rider/offers", headers=headers(4)).json() == []
    oid = offer_id(client,headers)
    with sessions() as db:
        db.get(BroadcastOffer, oid).expires_at = utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.post(f"/api/v1/rider/offers/{oid}/accept", headers=headers(3)).status_code == 409
    assert offer_id(client, headers) == oid
    with sessions() as db:
        assert db.get(BroadcastOffer, oid).expires_at > utcnow()
    with sessions() as db:
        db.get(RiderProfile,1).location_updated_at = utcnow() - timedelta(hours=1)
        db.commit()
    create_order(client,headers,order_payload)
    assert client.get("/api/v1/rider/offers", headers=headers(3)).json() == []


def test_reject_and_rebroadcast(client, headers, order_payload, ready_riders):
    order = create_order(client,headers,order_payload)
    oid = offer_id(client,headers)
    assert client.post(f"/api/v1/rider/offers/{oid}/reject", headers=headers(4)).status_code == 404
    assert client.post(f"/api/v1/rider/offers/{oid}/reject", headers=headers(3)).json()["status"] == "rejected"
    assert client.get("/api/v1/rider/offers", headers=headers(3)).json() == []
    response=client.post(f"/api/v1/admin/orders/{order['id']}/broadcast", headers=headers(5), json={"radius_km":10})
    assert response.status_code == 200, response.text
    assert response.json()["offers_sent"] == 2
    assert offer_id(client,headers) == oid
    assert client.post(f"/api/v1/rider/offers/{oid}/accept", headers=headers(3)).status_code == 200
    assert client.post(f"/api/v1/admin/orders/{order['id']}/broadcast", headers=headers(5), json={}).status_code == 409


def test_rider_discovers_booking_created_while_offline(api, headers, order_payload):
    client, sessions = api
    order = create_order(client, headers, order_payload)
    assert client.get("/api/v1/rider/offers", headers=headers(3)).json() == []
    client.post("/api/v1/rider/location", headers=headers(3), json={"latitude":6.6,"longitude":3.35})
    client.patch("/api/v1/rider/availability", headers=headers(3), json={"status":"available"})
    def poll(_):
        response = client.get("/api/v1/rider/offers", headers=headers(3))
        assert response.status_code == 200, response.text
        return response.json()
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(poll, range(2)))
    assert all(len(rows) == 1 and rows[0]["order"]["id"] == order["id"] for rows in results)
    with sessions() as db:
        assert db.query(BroadcastOffer).filter_by(order_id=order["id"], rider_id=1).count() == 1
        assert db.get(Order, order["id"]).rider_id is None
    oid = results[0][0]["id"]
    assert client.post(f"/api/v1/rider/offers/{oid}/accept", headers=headers(3)).status_code == 200
