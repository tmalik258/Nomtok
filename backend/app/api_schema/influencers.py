from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
import re
from pydantic import BaseModel, Field, validator
from pydantic.config import ConfigDict

if TYPE_CHECKING:
    from app.api_schema.listings import ListingLightResponse

class InfluencerCreateFromUrl(BaseModel):
    """Schema for creating a new influencer from YouTube URL"""
    youtube_url: str = Field(..., min_length=1, description="YouTube channel URL")
    
    @validator('youtube_url')
    def validate_youtube_url(cls, v):
        """Validate YouTube channel URL format"""
        youtube_channel_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/@[\w.-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/c/[\w.-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/channel/[\w.-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/user/[\w.-]+',
        ]
        
        for pattern in youtube_channel_patterns:
            if re.match(pattern, v):
                return v
        
        raise ValueError('Invalid YouTube channel URL format. Please provide a valid YouTube channel URL.')
    
    model_config = ConfigDict(from_attributes=True)

class InfluencerCreate(BaseModel):
    """Schema for creating a new influencer (legacy - for manual creation)"""
    name: str = Field(..., min_length=1, max_length=255, description="Influencer name")
    bio: Optional[str] = Field(None, max_length=1000, description="Influencer biography")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    youtube_channel_id: str = Field(..., min_length=1, description="YouTube channel ID")
    youtube_channel_url: Optional[str] = Field(None, description="YouTube channel URL")
    subscriber_count: Optional[int] = Field(None, ge=0, description="Subscriber count")

    model_config = ConfigDict(from_attributes=True)

class InfluencerUpdate(BaseModel):
    """Schema for updating an existing influencer"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Influencer name")
    bio: Optional[str] = Field(None, max_length=1000, description="Influencer biography")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    youtube_channel_id: Optional[str] = Field(None, min_length=1, description="YouTube channel ID")
    youtube_channel_url: Optional[str] = Field(None, description="YouTube channel URL")
    subscriber_count: Optional[int] = Field(None, ge=0, description="Subscriber count")

    model_config = ConfigDict(from_attributes=True)

class InfluencerLightResponse(BaseModel):
    """Lightweight influencer response without listings to avoid circular references"""
    id: UUID
    name: str
    slug: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    youtube_channel_id: str
    youtube_channel_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InfluencerResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    # region: Optional[str] = None
    # country: Optional[str] = None
    youtube_channel_id: str
    youtube_channel_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    total_videos: Optional[int] = None
    total_listings: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    listings: Optional[List["ListingLightResponse"]] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedInfluencersResponse(BaseModel):
    """Response model for paginated influencers with total count"""
    influencers: List[InfluencerResponse]
    total: int
    
    model_config = ConfigDict(from_attributes=True)

# Import after class definition to avoid circular imports
def rebuild_models():
    """Rebuild models to resolve forward references after all imports are complete"""
    from app.api_schema.listings import ListingLightResponse
    InfluencerResponse.model_rebuild()
    PaginatedInfluencersResponse.model_rebuild()
