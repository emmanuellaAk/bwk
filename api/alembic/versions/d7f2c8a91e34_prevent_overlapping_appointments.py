"""prevent overlapping appointments per salon

Revision ID: d7f2c8a91e34
Revises: c4bf3a4f691a
"""
from typing import Sequence, Union

from alembic import op


revision: str = "d7f2c8a91e34"
down_revision: Union[str, None] = "c4bf3a4f691a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute(
        """
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_no_overlap
        EXCLUDE USING gist (
            salon_id WITH =,
            tstzrange(starts_at, ends_at, '[)') WITH &&
        )
        WHERE (status <> 'cancelled')
        """
    )


def downgrade() -> None:
    op.drop_constraint("appointments_no_overlap", "appointments", type_="exclude")
