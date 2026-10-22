from conftest import create_order, offer_id


def test_admin_monitoring_and_deactivation(client, headers, order_payload, ready_riders):
    assert len(client.get("/api/v1/admin/users",headers=headers(5)).json())==5
    assert len(client.get("/api/v1/admin/users?role=rider",headers=headers(5)).json())==2
    assert len(client.get("/api/v1/admin/riders?status=available",headers=headers(5)).json())==2
    oid=create_order(client,headers,order_payload)["id"]
    client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept",headers=headers(3))
    path="/api/v1/admin/users"
    for uid in (1,3,5):
        assert client.patch(f"{path}/{uid}/activation",headers=headers(5),json={"is_active":False}).status_code==409
    assert client.patch(f"{path}/4/activation",headers=headers(5),json={"is_active":False}).status_code==200
    assert client.get("/api/v1/rider/profile",headers=headers(4)).status_code==401
    assert client.post("/api/v1/auth/login",json={"email":"user4@example.com","password":"password123"}).status_code==401
    assert client.get("/api/v1/admin/analytics",headers=headers(5)).json()["orders_by_status"]=={"assigned":1}
    assert client.post(f"/api/v1/admin/orders/{oid}/cancel",headers=headers(5)).status_code==200
    assert client.patch(f"{path}/3/activation",headers=headers(5),json={"is_active":False}).status_code==200
    assert client.patch(f"{path}/3/activation",headers=headers(5),json={"is_active":True}).status_code==200
    assert client.get("/api/v1/rider/profile",headers=headers(3)).json()["status"]=="offline"
