from conftest import create_order, offer_id


def test_rider_profile_availability_and_location(client, headers, order_payload, ready_riders):
    assert client.patch("/api/v1/rider/profile", headers=headers(3), json={"vehicle_type":"motorcycle"}).json()["vehicle_type"] == "motorcycle"
    assert client.post("/api/v1/rider/location", headers=headers(3), json={"latitude":0,"longitude":181}).status_code == 422
    assert client.patch("/api/v1/rider/availability", headers=headers(3), json={"status":"busy"}).status_code == 422
    create_order(client, headers, order_payload)
    client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept", headers=headers(3))
    assert client.patch("/api/v1/rider/availability", headers=headers(3), json={"status":"offline"}).status_code == 409
    assert len(client.get("/api/v1/rider/orders", headers=headers(3)).json()) == 1
    assert client.get("/api/v1/rider/orders", headers=headers(4)).json() == []
