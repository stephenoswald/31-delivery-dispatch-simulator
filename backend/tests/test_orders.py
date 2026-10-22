from conftest import create_order, offer_id


def test_delivery_lifecycle_and_cancellation(client, headers, order_payload, ready_riders):
    order = create_order(client, headers, order_payload)
    oid = order["id"]
    accepted = client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept", headers=headers(3))
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "assigned"
    path = f"/api/v1/rider/orders/{oid}/status"
    assert client.patch(path, headers=headers(4), json={"status":"picked_up"}).status_code == 404
    assert client.patch(path, headers=headers(3), json={"status":"delivered"}).status_code == 409
    assert client.patch(path, headers=headers(3), json={"status":"picked_up"}).status_code == 200
    assert client.post(f"/api/v1/customer/orders/{oid}/cancel", headers=headers(1)).status_code == 409
    assert client.patch(path, headers=headers(3), json={"status":"in_transit"}).status_code == 200
    delivered = client.patch(path, headers=headers(3), json={"status":"delivered", "delivery_code":client.get(f"/api/v1/customer/orders/{oid}/confirmation-code",headers=headers(1)).json()["delivery_code"]})
    assert delivered.status_code == 200
    assert delivered.json()["delivered_at"]
    assert client.get("/api/v1/rider/profile", headers=headers(3)).json()["status"] == "available"
    assert client.patch(path, headers=headers(3), json={"status":"picked_up"}).status_code == 409


def test_cancel_releases_rider_and_withdraws_offers(client, headers, order_payload, ready_riders):
    oid = create_order(client, headers, order_payload)["id"]
    client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept", headers=headers(3))
    response = client.post(f"/api/v1/customer/orders/{oid}/cancel", headers=headers(1))
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert client.get("/api/v1/rider/profile", headers=headers(3)).json()["status"] == "available"
    assert client.get("/api/v1/rider/offers", headers=headers(4)).json() == []
