import uuid
from enum import Enum

from sqlalchemy import (Column, String, Text, Float, Boolean, DateTime, event, inspect, JSON, Integer)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from slugify import slugify
from app.utils.slug_utils import ensure_unique_slug

from app.database import Base

class BusinessStatus(str, Enum):
    BUSINESS_STATUS_UNSPECIFIED = "BUSINESS_STATUS_UNSPECIFIED"
    OPERATIONAL = "OPERATIONAL"
    CLOSED_TEMPORARILY = "CLOSED_TEMPORARILY"
    CLOSED_PERMANENTLY = "CLOSED_PERMANENTLY"

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    address = Column(Text, nullable=False) # Raw address from Google Places
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100), index=True)
    country = Column(String(100), index=True)
    google_place_id = Column(String(255), unique=True) # From Google Places API
    google_rating = Column(Float) # From Google Map API
    business_status = Column(
        String(50),
        default=BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value,
        server_default=BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value,
        nullable=False
    ) # Whether the restaurant is currently operational
    photo_url = Column(Text, nullable=True) # From Google Places API
    is_active = Column(Boolean, default=True) # Soft delete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Enhanced fields from Google Places API
    current_opening_hours = Column(JSON, nullable=True)  # Structured opening hours
    secondary_opening_hours = Column(JSON, nullable=True)  # Alternative hours
    international_phone_number = Column(String(50), nullable=True)  # International phone format
    opening_hours = Column(JSON, nullable=True)  # Raw Google Places opening hours data
    price_level = Column(Integer, nullable=True)  # 0-4 scale from Google Places
    website = Column(String(500), nullable=True)  # Restaurant website URL

    listings = relationship("Listing", back_populates="restaurant")
    restaurant_tags = relationship("RestaurantTag", back_populates="restaurant")
    restaurant_cuisines = relationship("RestaurantCuisine", back_populates="restaurant")
    
    @hybrid_property
    def tags(self):
        """Return the actual Tag objects for serialization"""
        return [rt.tag for rt in self.restaurant_tags] if self.restaurant_tags else []
    
    @hybrid_property
    def cuisines(self):
        """Return the actual Cuisine objects for serialization"""
        return [rc.cuisine for rc in self.restaurant_cuisines] if self.restaurant_cuisines else []


@event.listens_for(Restaurant, "before_insert")
def _restaurant_before_insert(mapper, connection, target):
    base_slug = slugify(target.name or "")
    target.slug = ensure_unique_slug(
        connection,
        target.__table__,
        slug_column="slug",
        base_value=base_slug,
        id_column="id",
        current_id=None,
    )


@event.listens_for(Restaurant, "before_update")
def _restaurant_before_update(mapper, connection, target):
    state = inspect(target)
    name_changed = False
    try:
        name_changed = state.attrs.name.history.has_changes()
    except Exception:
        name_changed = True
    if name_changed or not getattr(target, "slug", None):
        base_slug = slugify(target.name or "")
        target.slug = ensure_unique_slug(
            connection,
            target.__table__,
            slug_column="slug",
            base_value=base_slug,
            id_column="id",
            current_id=target.id,
        )
