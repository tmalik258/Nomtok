from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base


class PlacesCache(Base):
    """Cached Google Places API (New) payloads to reduce billed requests."""

    __tablename__ = "places_cache"

    place_id = Column(Text, primary_key=True)
    cache_kind = Column(Text, primary_key=True)
    variant = Column(Text, primary_key=True, server_default="", default="")
    data = Column(JSONB, nullable=False)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
