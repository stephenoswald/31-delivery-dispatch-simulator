from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from app.models import BroadcastOffer, Order, OrderEvent
from app.utils.geo import distance_km


def test_quote_and_server_priced_unpaid_order(api, headers, order_payload, ready_riders):
    client, sessions = api
    quote=client.post('/api/v1/customer/quote',headers=headers(1),json=order_payload)
    assert quote.status_code==200
    price=quote.json()
    distance=round(distance_km(order_payload['pickup_latitude'],order_payload['pickup_longitude'],order_payload['dropoff_latitude'],order_payload['dropoff_longitude']),2)
    assert price['distance_km']==distance
    assert price['delivery_fee_minor']==50000+int(Decimal(str(distance))*10000)
    response=client.post('/api/v1/customer/orders',headers=headers(1),json={**order_payload,'delivery_fee_minor':1,'payment_status':'paid'})
    assert response.status_code==201
    order=response.json()
    assert order['payment_status']=='unpaid' and order['status']=='pending'
    assert order['delivery_fee_minor']==price['delivery_fee_minor'] and order['currency']=='NGN'
    assert order['distance_km']==price['distance_km']
    assert client.get('/api/v1/rider/offers',headers=headers(3)).json()==[]
    assert client.post(f"/api/v1/admin/orders/{order['id']}/broadcast",headers=headers(5),json={}).status_code==409
    with sessions() as db:
        assert db.query(BroadcastOffer).count()==0
    path=f"/api/v1/customer/orders/{order['id']}/pay"
    assert client.post(path,headers=headers(2),json={}).status_code==404
    assert client.post(path,headers=headers(3),json={}).status_code==403
    assert client.post(path,headers=headers(1),json={'outcome':'failed'}).status_code==402
    assert client.get('/api/v1/rider/offers',headers=headers(3)).json()==[]
    paid=client.post(path,headers=headers(1),json={'outcome':'success','amount_minor':1}).json()
    assert paid['payment_status']=='paid' and paid['status']=='broadcasting'
    assert paid['payment_reference'].startswith('SIM-') and paid['paid_at']
    assert paid['delivery_fee_minor']==price['delivery_fee_minor']
    assert client.get('/api/v1/rider/offers',headers=headers(3)).json()[0]['order']['id']==order['id']


def test_concurrent_payment_reuses_one_receipt(api, headers, order_payload, ready_riders):
    client, sessions = api
    order=client.post('/api/v1/customer/orders',headers=headers(1),json=order_payload).json()
    path=f"/api/v1/customer/orders/{order['id']}/pay"
    def pay(_):
        result=client.post(path,headers=headers(1),json={'outcome':'success'})
        assert result.status_code==200, result.text
        return result.json()['payment_reference']
    with ThreadPoolExecutor(max_workers=2) as executor:
        assert len(set(executor.map(pay,range(2))))==1
    with sessions() as db:
        assert db.query(OrderEvent).filter_by(order_id=order['id'],event_type='payment_succeeded').count()==1
        assert db.query(OrderEvent).filter_by(order_id=order['id'],event_type='broadcast').count()==1


def test_cancelled_order_cannot_be_paid(client, headers, order_payload):
    order=client.post('/api/v1/customer/orders',headers=headers(1),json=order_payload).json()
    assert client.post(f"/api/v1/customer/orders/{order['id']}/cancel",headers=headers(1)).status_code==200
    assert client.post(f"/api/v1/customer/orders/{order['id']}/pay",headers=headers(1),json={'outcome':'success'}).status_code==409


def test_invalid_quote_and_simulated_outcome(client, headers, order_payload):
    assert client.post('/api/v1/customer/quote',headers=headers(1),json={**order_payload,'pickup_latitude':91}).status_code==422
    assert client.post('/api/v1/customer/quote',headers=headers(3),json=order_payload).status_code==403
    order=client.post('/api/v1/customer/orders',headers=headers(1),json=order_payload).json()
    assert client.post(f"/api/v1/customer/orders/{order['id']}/pay",headers=headers(1),json={'outcome':'anything'}).status_code==422


def test_unpaid_order_cannot_be_claimed_even_with_stale_invitation(api, headers, order_payload, ready_riders):
    from datetime import timedelta
    from app.models import RiderProfile
    from app.utils.datetime import utcnow
    client,sessions=api
    order=client.post('/api/v1/customer/orders',headers=headers(1),json=order_payload).json()
    with sessions() as db:
        current=db.get(Order,order['id']);current.status='broadcasting'
        offer=BroadcastOffer(order_id=current.id,rider_id=1,status='pending',expires_at=utcnow()+timedelta(minutes=1))
        db.add(offer);db.commit();invitation=offer.id
    assert client.get('/api/v1/rider/offers',headers=headers(3)).json()==[]
    assert client.post(f'/api/v1/rider/offers/{invitation}/accept',headers=headers(3)).status_code==409
    with sessions() as db:
        assert db.get(RiderProfile,1).status=='available'
        assert db.get(Order,order['id']).rider_id is None
