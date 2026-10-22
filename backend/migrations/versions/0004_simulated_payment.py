"""Distance pricing and simulated pre-dispatch payment."""
from alembic import op
import sqlalchemy as sa
from app.utils.geo import distance_km
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None

def upgrade():
    # Inline checks avoid rebuilding orders, which has dependent records.
    op.add_column('orders', sa.Column('distance_km', sa.Float(), sa.CheckConstraint('distance_km >= 0', name='ck_order_distance'), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('payment_status', sa.String(16), sa.CheckConstraint("payment_status IN ('unpaid', 'paid')", name='ck_order_payment_status'), nullable=False, server_default='unpaid'))
    op.add_column('orders', sa.Column('payment_reference', sa.String(64)))
    op.add_column('orders', sa.Column('paid_at', sa.DateTime()))
    op.create_index('ix_orders_payment_reference', 'orders', ['payment_reference'], unique=True)
    connection = op.get_bind()
    # Existing requests retain their prior eligibility; do not invent payments.
    for row in connection.execute(sa.text('SELECT id,pickup_latitude,pickup_longitude,dropoff_latitude,dropoff_longitude FROM orders')).fetchall():
        distance = round(distance_km(row[1],row[2],row[3],row[4]),2)
        connection.execute(sa.text("UPDATE orders SET distance_km=:distance, payment_status='paid' WHERE id=:id"), {'id':row[0],'distance':distance})

def downgrade():
    op.drop_index('ix_orders_payment_reference',table_name='orders')
    op.drop_column('orders','paid_at')
    op.drop_column('orders','payment_reference')
    op.drop_column('orders','payment_status')
    op.drop_column('orders','distance_km')
