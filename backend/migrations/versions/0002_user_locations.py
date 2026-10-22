"""Add fixed user profile locations without rebuilding referenced SQLite users."""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("zone", sa.String(80), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(255), nullable=True))
    # Inline CHECKs let SQLite add these columns without rebuilding a table
    # referenced by rider profiles, orders, reviews, and events.
    op.add_column("users", sa.Column("latitude", sa.Float(),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_user_latitude"), nullable=True))
    op.add_column("users", sa.Column("longitude", sa.Float(),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_user_longitude"),
        sa.CheckConstraint("(latitude IS NULL) = (longitude IS NULL)", name="ck_user_coordinate_pair"), nullable=True))


def downgrade():
    # SQLite 3.35+ supports dropping these columns without table replacement.
    for name in ("longitude", "latitude", "address", "zone"):
        op.drop_column("users", name)
