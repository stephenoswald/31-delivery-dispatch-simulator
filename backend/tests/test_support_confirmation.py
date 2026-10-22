from datetime import timedelta
from app.models import Order, RiderProfile
from app.utils.datetime import utcnow
from conftest import create_order, offer_id


def test_customer_code_private_and_required(api, headers, order_payload, ready_riders):
    client, sessions = api
    order = create_order(client, headers, order_payload)
    oid = order['id']
    code_path = f'/api/v1/customer/orders/{oid}/confirmation-code'
    code = client.get(code_path, headers=headers(1)).json()['delivery_code']
    assert len(code) == 6 and code.isdigit()
    assert 'delivery_code' not in order
    assert client.get(code_path, headers=headers(2)).status_code == 404
    assert client.get(code_path, headers=headers(3)).status_code == 403
    assert client.get(code_path, headers=headers(5)).status_code == 403
    assert 'delivery_code' not in client.get('/api/v1/rider/offers', headers=headers(3)).text
    client.post(f'/api/v1/rider/offers/{offer_id(client,headers)}/accept', headers=headers(3))
    path = f'/api/v1/rider/orders/{oid}/status'
    for status in ('picked_up','in_transit'):
        assert client.patch(path, headers=headers(3), json={'status':status}).status_code == 200
    assert client.patch(path, headers=headers(4), json={'status':'delivered','delivery_code':code}).status_code == 404
    wrong = '000000' if code != '000000' else '111111'
    for _ in range(5):
        assert client.patch(path, headers=headers(3), json={'status':'delivered','delivery_code':wrong}).status_code == 400
    assert client.patch(path, headers=headers(3), json={'status':'delivered','delivery_code':code}).status_code == 429
    with sessions() as db:
        current = db.get(Order,oid)
        assert current.status == 'in_transit' and current.delivered_at is None
        assert db.get(RiderProfile,1).status == 'busy'
        current.code_locked_until = utcnow() - timedelta(seconds=1)
        db.commit()
    assert client.patch(path, headers=headers(3), json={'status':'delivered','delivery_code':code}).status_code == 200
    assert client.patch(path, headers=headers(3), json={'status':'delivered','delivery_code':code}).status_code == 409
    assert client.get(code_path, headers=headers(1)).json()['delivery_code'] is None


def test_order_linked_support_conversation(client, headers, order_payload):
    order = create_order(client, headers, order_payload)
    payload = {'order_id':order['id'],'subject':'Package not received','body':'Please help me locate my package.'}
    assert client.post('/api/v1/support/tickets', headers=headers(2), json=payload).status_code == 404
    assert client.post('/api/v1/support/tickets', headers=headers(3), json=payload).status_code == 403
    response = client.post('/api/v1/support/tickets', headers=headers(1), json=payload)
    assert response.status_code == 201, response.text
    tid = response.json()['id']; path=f'/api/v1/support/tickets/{tid}'
    assert len(client.get('/api/v1/support/tickets',headers=headers(5)).json()) == 1
    assert client.get('/api/v1/support/tickets',headers=headers(2)).json() == []
    for suffix in ('','/messages'):
        assert client.get(path+suffix,headers=headers(2)).status_code == 404
        assert client.get(path+suffix,headers=headers(3)).status_code == 403
    assert client.post(path+'/messages',headers=headers(2),json={'body':'intrusion'}).status_code == 404
    assert client.post(path+'/messages',headers=headers(5),json={'body':'We are checking with the rider.'}).status_code == 201
    messages=client.get(path+'/messages',headers=headers(1)).json()
    assert [m['author_role'] for m in messages] == ['customer','admin']
    assert client.post(path+'/messages',headers=headers(1),json={'body':' '}).status_code == 422
    assert client.patch(path,headers=headers(1),json={'status':'resolved'}).status_code == 403
    assert client.patch(path,headers=headers(5),json={'status':'resolved'}).status_code == 200
    assert client.post(path+'/messages',headers=headers(1),json={'body':'Thanks'}).status_code == 409
    assert client.patch(path,headers=headers(5),json={'status':'open'}).status_code == 200
    assert client.post(path+'/messages',headers=headers(1),json={'body':'Still missing'}).status_code == 201


def test_confirmation_migration_backfills_existing_orders(tmp_path):
    import os
    import subprocess
    import sys
    from pathlib import Path
    from sqlalchemy import create_engine, text
    root = Path(__file__).parents[1]
    url = f'sqlite:///{tmp_path / "upgrade.db"}'
    env = {**os.environ, 'DATABASE_URL': url}
    subprocess.run([sys.executable,'-m','alembic','upgrade','0002'],cwd=root,env=env,check=True,capture_output=True)
    engine = create_engine(url)
    with engine.begin() as db:
        db.execute(text("INSERT INTO users (id,email,full_name,password_hash,role) VALUES (1,'existing@example.com','Existing','hash','customer')"))
        db.execute(text("INSERT INTO orders (id,tracking_code,customer_id,status,pickup_address,pickup_latitude,pickup_longitude,dropoff_address,dropoff_latitude,dropoff_longitude,recipient_name,recipient_phone) VALUES (1,'EXISTING',1,'broadcasting','Pickup',4.8,7.0,'Dropoff',4.81,7.01,'Recipient','08000000000')"))
    subprocess.run([sys.executable,'-m','alembic','upgrade','head'],cwd=root,env=env,check=True,capture_output=True)
    with engine.connect() as db:
        row=db.execute(text('SELECT tracking_code,delivery_code,code_attempts FROM orders WHERE id=1')).one()
        assert row[0]=='EXISTING' and len(row[1])==6 and row[1].isdigit() and row[2]==0
        assert db.execute(text("SELECT payment_status FROM orders WHERE id=1")).scalar()=='paid'
        assert db.execute(text("SELECT payment_reference FROM orders WHERE id=1")).scalar() is None
        assert db.execute(text('PRAGMA foreign_key_check')).all()==[]
    engine.dispose()
