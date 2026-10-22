"""Support conversations and customer delivery confirmation."""
from alembic import op
import sqlalchemy as sa
import secrets
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('orders', sa.Column('delivery_code', sa.String(6)))
    op.add_column('orders', sa.Column('code_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('code_locked_until', sa.DateTime()))
    connection = op.get_bind()
    for row in connection.execute(sa.text("SELECT id FROM orders WHERE status NOT IN ('delivered', 'cancelled')")).fetchall():
        connection.execute(sa.text('UPDATE orders SET delivery_code=:code WHERE id=:id'), {'id':row[0], 'code':f'{secrets.randbelow(1000000):06d}'})
    op.create_table('tickets', sa.Column('id', sa.Integer(), primary_key=True), sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id'), nullable=False), sa.Column('customer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False), sa.Column('subject', sa.String(160), nullable=False), sa.Column('status', sa.String(16), nullable=False), sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()), sa.CheckConstraint("status IN ('open', 'resolved')", name='ck_ticket_status'))
    op.create_index('ix_tickets_order_id','tickets',['order_id'])
    op.create_index('ix_tickets_customer_id','tickets',['customer_id'])
    op.create_table('ticket_messages', sa.Column('id', sa.Integer(), primary_key=True), sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False), sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False), sa.Column('body', sa.Text(), nullable=False), sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()))
    op.create_index('ix_ticket_messages_ticket_id','ticket_messages',['ticket_id'])

def downgrade():
    op.drop_table('ticket_messages')
    op.drop_table('tickets')
    op.drop_column('orders','code_locked_until')
    op.drop_column('orders','code_attempts')
    op.drop_column('orders','delivery_code')
