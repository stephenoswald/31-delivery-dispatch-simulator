from conftest import create_order, offer_id


def test_review_eligibility_and_uniqueness(client, headers, order_payload, ready_riders):
    oid=create_order(client,headers,order_payload)["id"]
    path=f"/api/v1/customer/orders/{oid}/review"
    assert client.post(path,headers=headers(1),json={"rating":5}).status_code==409
    client.post(f"/api/v1/rider/offers/{offer_id(client,headers)}/accept",headers=headers(3))
    for status in ("picked_up","in_transit","delivered"):
        assert client.patch(f"/api/v1/rider/orders/{oid}/status",headers=headers(3),json={"status":status}).status_code==200
    assert client.post(path,headers=headers(2),json={"rating":5}).status_code==404
    assert client.post(path,headers=headers(1),json={"rating":6}).status_code==422
    response=client.post(path,headers=headers(1),json={"rating":5,"comment":"Great delivery"})
    assert response.status_code==201, response.text
    assert response.json()["rider_id"]==1
    assert client.post(path,headers=headers(1),json={"rating":4}).status_code==409
    assert client.get(path,headers=headers(1)).json()["rating"]==5
    assert len(client.get("/api/v1/rider/reviews",headers=headers(3)).json())==1
    assert client.get("/api/v1/admin/analytics",headers=headers(5)).json()["average_rating"]==5
