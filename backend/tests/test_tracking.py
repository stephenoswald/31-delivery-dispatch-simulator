from conftest import create_order, offer_id


def test_tracking_only_exposes_order_linked_locations(client, headers, order_payload, ready_riders):
    order = create_order(client,headers,order_payload)
    oid = order["id"]
    assert client.get(f"/api/v1/customer/orders/{oid}/tracking",headers=headers(1)).json()["latest_location"] is None
    client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept",headers=headers(3))
    client.post("/api/v1/rider/location",headers=headers(3),json={"latitude":6.55,"longitude":3.36})
    tracking=client.get(f"/api/v1/customer/orders/{oid}/tracking",headers=headers(1))
    assert tracking.status_code == 200, tracking.text
    assert tracking.json()["latest_location"]["latitude"] == 6.55
    assert [e["event_type"] for e in tracking.json()["events"]] == ["created","payment_succeeded","broadcast","assigned"]
    locations=client.get(f"/api/v1/customer/orders/{oid}/locations",headers=headers(1)).json()
    assert len(locations)==1
    assert locations[0]["order_id"]==oid
    assert client.get(f"/api/v1/admin/orders/{oid}/tracking",headers=headers(5)).status_code==200
    client.post(f"/api/v1/customer/orders/{oid}/cancel",headers=headers(1))
    client.post("/api/v1/rider/location",headers=headers(3),json={"latitude":7,"longitude":4})
    assert client.get(f"/api/v1/customer/orders/{oid}/tracking",headers=headers(1)).json()["latest_location"]["latitude"]==6.55
