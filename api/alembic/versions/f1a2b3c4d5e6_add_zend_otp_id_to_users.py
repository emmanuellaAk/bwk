"""add_zend_otp_id_to_users

Revision ID: f1a2b3c4d5e6
Revises: e8a3d9b02f45
Create Date: 2026-08-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e8a3d9b02f45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('zend_otp_id', sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'zend_otp_id')
