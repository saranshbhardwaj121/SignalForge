"""add_account_lockout_columns

Revision ID: 30c6fa5b4fd7
Revises: 1d90fe559f40
Create Date: 2026-07-02 00:04:52.497832

"""
from alembic import op
import sqlalchemy as sa


revision = '30c6fa5b4fd7'
down_revision = '1d90fe559f40'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), server_default=sa.text('0'), nullable=False))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
