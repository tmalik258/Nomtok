import uuid
from enum import Enum

from sqlalchemy import (Column, String, Text, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum, event, inspect)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from slugify import slugify
from app.utils.slug_utils import ensure_unique_slug

from app.database import Base

class VideoProcessingStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False)
    youtube_video_id = Column(String(100), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text) # Raw description from YouTube
    video_url = Column(String(255), nullable=False)
    published_at = Column(DateTime(timezone=True))
    transcription = Column(Text) # From Whisper
    status = Column(SQLEnum(VideoProcessingStatus), default=VideoProcessingStatus.PENDING, server_default=VideoProcessingStatus.PENDING.value, nullable=False) # Processing status
    error_message = Column(Text, nullable=True) # Error message if processing failed
    youtube_thumbnail_url = Column(String(500), nullable=True) # Best quality thumbnail from YouTube
    youtube_duration = Column(String(50), nullable=True) # ISO 8601 duration (e.g., "PT5M30S")
    youtube_channel_title = Column(String(255), nullable=True) # Channel name
    youtube_metadata_updated_at = Column(DateTime(timezone=True), nullable=True) # Last metadata refresh timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    listings = relationship("Listing", back_populates="video")
    influencer = relationship("Influencer", back_populates="videos")

    __table_args__ = (
        UniqueConstraint('influencer_id', 'youtube_video_id', name='uix_influencer_youtube_video_id'),
    )


@event.listens_for(Video, "before_insert")
def _video_before_insert(mapper, connection, target):
    base_slug = slugify(target.title or "")
    target.slug = ensure_unique_slug(
        connection,
        target.__table__,
        slug_column="slug",
        base_value=base_slug,
        id_column="id",
        current_id=None,
    )


@event.listens_for(Video, "before_update")
def _video_before_update(mapper, connection, target):
    state = inspect(target)
    title_changed = False
    try:
        title_changed = state.attrs.title.history.has_changes()
    except Exception:
        title_changed = True
    if title_changed or not getattr(target, "slug", None):
        base_slug = slugify(target.title or "")
        target.slug = ensure_unique_slug(
            connection,
            target.__table__,
            slug_column="slug",
            base_value=base_slug,
            id_column="id",
            current_id=target.id,
        )
