"""add alerts and triggered_alerts tables

Revision ID: f76aa8cab6d3
Revises: 5a1c2f9d1b20
Create Date: 2026-06-21 01:06:55.934957

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = 'f76aa8cab6d3'
down_revision = '5a1c2f9d1b20'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('alerts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('ticker', sa.String(length=20), nullable=False),
        sa.Column('alert_type', sa.String(length=20), nullable=False),
        sa.Column('operator', sa.String(length=5), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alerts_user_id'), 'alerts', ['user_id'], unique=False)
    op.create_index('ix_alerts_status', 'alerts', ['status'], unique=False)
    op.create_index('ix_alerts_user_status', 'alerts', ['user_id', 'status'], unique=False)

    op.create_table('triggered_alerts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('alert_id', sa.UUID(), nullable=False),
        sa.Column('ticker', sa.String(length=20), nullable=False),
        sa.Column('alert_type', sa.String(length=20), nullable=False),
        sa.Column('operator', sa.String(length=5), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('triggered_value', sa.Float(), nullable=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_triggered_alerts_alert_id'), 'triggered_alerts', ['alert_id'], unique=False)
    op.create_index('ix_triggered_alerts_triggered_at', 'triggered_alerts', ['triggered_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_triggered_alerts_triggered_at', table_name='triggered_alerts')
    op.drop_index(op.f('ix_triggered_alerts_alert_id'), table_name='triggered_alerts')
    op.drop_table('triggered_alerts')
    op.drop_index('ix_alerts_user_status', table_name='alerts')
    op.drop_index('ix_alerts_status', table_name='alerts')
    op.drop_index(op.f('ix_alerts_user_id'), table_name='alerts')
    op.drop_table('alerts')
