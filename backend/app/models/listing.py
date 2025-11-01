import uuid

from sqlalchemy import (Column, UUID, ForeignKey, Text, Date, Boolean, Float, DateTime, Integer, UniqueConstraint)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

from app.database import Base

class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"))
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"))
    influencer_id = Column(UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), index=True)
    visit_date = Column(Date, nullable=True)  # Date of the influencer's visit, derived from video's published_at
    review_sections = Column(JSONB, nullable=True)  # New review sections data
    confidence_score = Column(Float)
    approved = Column(Boolean, default=False, server_default="false") # Whether the listing is approved by the admin
    timestamp = Column(Integer, nullable=True)  # Video timestamp in seconds for start time
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    video = relationship("Video", back_populates="listings")
    restaurant = relationship("Restaurant", back_populates="listings")
    influencer = relationship("Influencer", back_populates="listings")

    __table_args__ = (
        UniqueConstraint('video_id', 'restaurant_id', 'influencer_id', name='uix_video_restaurant_influencer'),
    )
