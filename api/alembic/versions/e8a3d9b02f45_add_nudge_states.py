"""add persisted nudge state

Revision ID: e8a3d9b02f45
Revises: d7f2c8a91e34
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8a3d9b02f45"
down_revision: Union[str, None] = "d7f2c8a91e34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "nudge_states",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("nudge_key", sa.String(length=255), nullable=False),
        sa.Column("dismissed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("acted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("salon_id", "nudge_key", name="uq_nudge_salon_key"),
    )
    op.create_index("ix_nudge_states_salon_id", "nudge_states", ["salon_id"])


def downgrade() -> None:
    op.drop_index("ix_nudge_states_salon_id", table_name="nudge_states")
    op.drop_table("nudge_states")
