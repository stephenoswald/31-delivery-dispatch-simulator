from conftest import create_order


def test_customer_ownership_and_validation(client, headers, order_payload):
    order = create_order(client, headers, order_payload)
    oid = order["id"]
    assert order["status"] == "broadcasting"
    assert len(order["tracking_code"]) == 36
    for suffix in ("", "/tracking", "/events", "/locations", "/review"):
        assert client.get(f"/api/v1/customer/orders/{oid}{suffix}", headers=headers(2)).status_code == 404
    assert client.post(f"/api/v1/customer/orders/{oid}/cancel", headers=headers(2)).status_code == 404
    assert client.get("/api/v1/customer/orders", headers=headers(2)).json() == []
    assert len(client.get("/api/v1/customer/orders", headers=headers(1)).json()) == 1
    assert client.post("/api/v1/customer/orders", headers=headers(1), json={**order_payload, "pickup_latitude":91}).status_code == 422
    assert client.get("/api/v1/customer/orders?limit=101", headers=headers(1)).status_code == 422
