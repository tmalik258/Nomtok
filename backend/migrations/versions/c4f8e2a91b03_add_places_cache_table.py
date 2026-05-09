"""add places_cache table for Google Places API responses

Revision ID: c4f8e2a91b03
Revises: 8f8475abc90c
Create Date: 2026-05-06

Run the equivalent SQL in Supabase SQL editor if you apply schema outside Alembic.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c4f8e2a91b03"
down_revision: Union[str, Sequence[str], None] = "8f8475abc90c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "places_cache",
        sa.Column("place_id", sa.Text(), nullable=False),
        sa.Column("cache_kind", sa.Text(), nullable=False),
        sa.Column("variant", sa.Text(), nullable=False, server_default=""),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("place_id", "cache_kind", "variant"),
    )
    op.create_index(
        "ix_places_cache_fetched_at",
        "places_cache",
        ["fetched_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_places_cache_fetched_at", table_name="places_cache")
    op.drop_table("places_cache")
