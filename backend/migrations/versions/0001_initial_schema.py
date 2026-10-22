"""Initial SQLite dispatch schema; frozen independently of application models."""
from alembic import op
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func, text
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        Column('id', Integer, primary_key=True),
        Column('email', String(254), nullable=False, unique=True),
        Column('full_name', String(120), nullable=False),
        Column('phone', String(32), unique=True),
        Column('password_hash', String(255), nullable=False),
        Column('role', String(16), nullable=False),
        Column('is_active', Boolean, nullable=False, server_default=text("1")),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        CheckConstraint("role IN ('customer', 'rider', 'admin')", name="ck_user_role")
    )
    op.create_table('rider_profiles',
        Column('id', Integer, primary_key=True),
        Column('user_id', Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, unique=True),
        Column('status', String(16), nullable=False, server_default="offline"),
        Column('vehicle_type', String(32)),
        Column('latitude', Float),
        Column('longitude', Float),
        Column('location_updated_at', DateTime),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        CheckConstraint("status IN ('offline', 'available', 'busy')", name="ck_rider_status"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_rider_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_rider_longitude"),
        CheckConstraint("(latitude IS NULL) = (longitude IS NULL)", name="ck_rider_coordinate_pair")
    )
    op.create_table('orders',
        Column('id', Integer, primary_key=True),
        Column('tracking_code', String(36), nullable=False, unique=True),
        Column('customer_id', Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        Column('rider_id', Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT")),
        Column('status', String(24), nullable=False, server_default="pending"),
        Column('pickup_address', Text, nullable=False),
        Column('pickup_latitude', Float, nullable=False),
        Column('pickup_longitude', Float, nullable=False),
        Column('dropoff_address', Text, nullable=False),
        Column('dropoff_latitude', Float, nullable=False),
        Column('dropoff_longitude', Float, nullable=False),
        Column('recipient_name', String(120), nullable=False),
        Column('recipient_phone', String(32), nullable=False),
        Column('package_description', Text),
        Column('delivery_fee_minor', Integer, nullable=False, server_default=text("0")),
        Column('currency', String(3), nullable=False, server_default="NGN"),
        Column('delivered_at', DateTime),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        CheckConstraint("status IN ('pending', 'broadcasting', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')", name="ck_order_status"),
        CheckConstraint("pickup_latitude BETWEEN -90 AND 90 AND dropoff_latitude BETWEEN -90 AND 90", name="ck_order_latitude"),
        CheckConstraint("pickup_longitude BETWEEN -180 AND 180 AND dropoff_longitude BETWEEN -180 AND 180", name="ck_order_longitude"),
        CheckConstraint("delivery_fee_minor >= 0", name="ck_order_fee"),
        CheckConstraint("status NOT IN ('assigned', 'picked_up', 'in_transit', 'delivered') OR rider_id IS NOT NULL", name="ck_order_assigned_rider")
    )
    op.create_index('uq_rider_active_order', 'orders', ['rider_id'], unique=True, sqlite_where=text("status IN ('assigned', 'picked_up', 'in_transit')"))
    op.create_table('broadcast_offers',
        Column('id', Integer, primary_key=True),
        Column('order_id', Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        Column('rider_id', Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT"), nullable=False),
        Column('status', String(16), nullable=False, server_default="pending"),
        Column('expires_at', DateTime, nullable=False),
        Column('responded_at', DateTime),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        UniqueConstraint("order_id", "rider_id", name="uq_offer_order_rider"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')", name="ck_offer_status")
    )
    op.create_index('uq_order_accepted_offer', 'broadcast_offers', ['order_id'], unique=True, sqlite_where=text("status = 'accepted'"))
    op.create_table('order_events',
        Column('id', Integer, primary_key=True),
        Column('order_id', Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        Column('actor_id', Integer, ForeignKey("users.id", ondelete="RESTRICT")),
        Column('event_type', String(64), nullable=False),
        Column('previous_status', String(24)),
        Column('new_status', String(24)),
        Column('details', JSON),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp())
    )
    op.create_table('reviews',
        Column('id', Integer, primary_key=True),
        Column('order_id', Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        Column('customer_id', Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        Column('rider_id', Integer, ForeignKey("rider_profiles.id", ondelete="RESTRICT"), nullable=False),
        Column('rating', Integer, nullable=False),
        Column('comment', Text),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating")
    )
    op.create_table('location_history',
        Column('id', Integer, primary_key=True),
        Column('rider_id', Integer, ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False),
        Column('order_id', Integer, ForeignKey("orders.id", ondelete="SET NULL")),
        Column('latitude', Float, nullable=False),
        Column('longitude', Float, nullable=False),
        Column('recorded_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        Column('created_at', DateTime, nullable=False, server_default=func.current_timestamp()),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_history_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_history_longitude")
    )

    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_index("ix_orders_rider_id", "orders", ["rider_id"])
    op.create_index("ix_broadcast_offers_order_id", "broadcast_offers", ["order_id"])
    op.create_index("ix_broadcast_offers_rider_id", "broadcast_offers", ["rider_id"])
    op.create_index("ix_order_events_order_id", "order_events", ["order_id"])
    op.create_index("ix_reviews_customer_id", "reviews", ["customer_id"])
    op.create_index("ix_reviews_rider_id", "reviews", ["rider_id"])
    op.create_index("ix_location_history_rider_id", "location_history", ["rider_id"])
    op.create_index("ix_location_history_order_id", "location_history", ["order_id"])
    op.create_index("ix_location_history_recorded_at", "location_history", ["recorded_at"])

def downgrade():
    op.drop_table('location_history')
    op.drop_table('reviews')
    op.drop_table('order_events')
    op.drop_table('broadcast_offers')
    op.drop_table('orders')
    op.drop_table('rider_profiles')
    op.drop_table('users')
