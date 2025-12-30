"""Add YouTube metadata fields to videos table

Revision ID: f1a2b3c4d5e6
Revises: 3c38a3142441
Create Date: 2025-01-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '3c38a3142441'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add YouTube metadata fields to videos table
    op.add_column('videos', sa.Column('youtube_thumbnail_url', sa.String(length=500), nullable=True))
    op.add_column('videos', sa.Column('youtube_duration', sa.String(length=50), nullable=True))
    op.add_column('videos', sa.Column('youtube_channel_title', sa.String(length=255), nullable=True))
    op.add_column('videos', sa.Column('youtube_metadata_updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove YouTube metadata fields from videos table
    op.drop_column('videos', 'youtube_metadata_updated_at')
    op.drop_column('videos', 'youtube_channel_title')
    op.drop_column('videos', 'youtube_duration')
    op.drop_column('videos', 'youtube_thumbnail_url')


