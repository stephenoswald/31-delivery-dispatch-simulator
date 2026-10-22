"""Database guarantees that dispatch services can rely on."""
import importlib.util
from pathlib import Path
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.autogenerate import compare_metadata
import pytest
from sqlalchemy import create_engine, event, insert
from sqlalchemy.exc import IntegrityError
from app.db.base import Base
from app.models import User, RiderProfile, Order, BroadcastOffer, Review
from datetime import datetime, timedelta

@pytest.fixture
def db():
    engine = create_engine('sqlite://')
    @event.listens_for(engine, 'connect')
    def foreign_keys(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
    with engine.begin() as connection:
        for filename in ('0001_initial_schema.py', '0002_user_locations.py'):
            path = Path(__file__).parents[1] / 'migrations/versions' / filename
            spec = importlib.util.spec_from_file_location('schema_migration', path)
            migration = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration)
            migration.op = Operations(MigrationContext.configure(connection))
            migration.upgrade()
        connection.execute(insert(User), [
            dict(id=1, email='customer@example.com', full_name='Customer', password_hash='test', role='customer'),
            dict(id=2, email='rider@example.com', full_name='Rider', password_hash='test', role='rider'),
            dict(id=3, email='rider2@example.com', full_name='Rider 2', password_hash='test', role='rider'),
        ])
        connection.execute(insert(RiderProfile), [dict(id=1, user_id=2), dict(id=2, user_id=3)])
        connection.execute(insert(Order), [order(1), order(2)])
        yield connection
    engine.dispose()

def order(identifier, **extra):
    return dict(id=identifier, tracking_code=f'TRACK-{identifier}', customer_id=1,
                pickup_address='Pickup', pickup_latitude=6.5, pickup_longitude=3.4,
                dropoff_address='Dropoff', dropoff_latitude=6.6, dropoff_longitude=3.5,
                recipient_name='Recipient', recipient_phone='+234000000000', **extra)

def test_one_accepted_offer_per_order(db):
    expires = datetime.now() + timedelta(minutes=1)
    db.execute(insert(BroadcastOffer).values(order_id=1, rider_id=1, status='accepted', expires_at=expires))
    with pytest.raises(IntegrityError):
        db.execute(insert(BroadcastOffer).values(order_id=1, rider_id=2, status='accepted', expires_at=expires))

def test_one_active_order_per_rider(db):
    db.execute(Order.__table__.update().where(Order.id == 1).values(rider_id=1, status='assigned'))
    with pytest.raises(IntegrityError):
        db.execute(Order.__table__.update().where(Order.id == 2).values(rider_id=1, status='assigned'))

def test_foreign_keys(db):
    with pytest.raises(IntegrityError):
        db.execute(insert(RiderProfile).values(user_id=999))

def test_coordinates_and_rating(db):
    with pytest.raises(IntegrityError):
        db.execute(insert(Order).values(**{**order(3), 'pickup_latitude': 91}))
    with pytest.raises(IntegrityError):
        db.execute(insert(Review).values(order_id=1, customer_id=1, rider_id=1, rating=6))


def test_migration_matches_models(db):
    assert compare_metadata(MigrationContext.configure(db), Base.metadata) == []


def test_location_migration_preserves_populated_users():
    engine = create_engine('sqlite://')
    @event.listens_for(engine, 'connect')
    def foreign_keys(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
    with engine.begin() as connection:
        migrations = []
        for filename in ('0001_initial_schema.py', '0002_user_locations.py'):
            path = Path(__file__).parents[1] / 'migrations/versions' / filename
            spec = importlib.util.spec_from_file_location('schema_migration', path)
            migration = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration)
            migration.op = Operations(MigrationContext.configure(connection))
            migrations.append(migration)
        migrations[0].upgrade()
        connection.exec_driver_sql("INSERT INTO users (id,email,full_name,password_hash,role) VALUES (1,'keep@example.com','Keep','hash','rider')")
        connection.exec_driver_sql('INSERT INTO rider_profiles (user_id) VALUES (1)')
        migrations[1].upgrade()
        connection.exec_driver_sql("UPDATE users SET zone='Port Harcourt', latitude=4.785, longitude=7.01")
        assert connection.exec_driver_sql('SELECT latitude FROM users').scalar() == 4.785
        migrations[1].downgrade()
        assert connection.exec_driver_sql('SELECT email FROM users').scalar() == 'keep@example.com'
        assert connection.exec_driver_sql('SELECT user_id FROM rider_profiles').scalar() == 1
        migrations[1].upgrade()
        assert connection.exec_driver_sql('PRAGMA foreign_key_check').all() == []
    engine.dispose()
