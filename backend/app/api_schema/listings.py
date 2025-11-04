from uuid import UUID
from typing import List, Optional, Dict, Any
from datetime import date, datetime

from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.api_schema.videos import VideoResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.influencers import InfluencerResponse, InfluencerLightResponse

class ReviewSections(BaseModel):
    history_context: Optional[str] = None
    overview: Optional[str] = None
    what_they_ate: Optional[List[str]] = None
    verbatim_quotes: Optional[List[str]] = None
    nomtok_reflection: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ListingResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse | UUID
    video: Optional[VideoResponse | UUID] = None
    influencer: Optional[InfluencerResponse | UUID] = None
    visit_date: Optional[date] = None
    review_sections: Optional[ReviewSections] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    timestamp: Optional[int] = None  # Video timestamp in seconds
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedListingsResponse(BaseModel):
    listings: List[ListingResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)

class ListingCreate(BaseModel):
    restaurant_id: UUID
    video_id: UUID
    influencer_id: UUID
    visit_date: Optional[date] = None
    review_sections: Optional[ReviewSections] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = False
    timestamp: Optional[int] = None  # Video timestamp in seconds

class ListingUpdate(BaseModel):
    restaurant_id: Optional[UUID] = None
    video_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    visit_date: Optional[date] = None
    review_sections: Optional[ReviewSections] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    timestamp: Optional[int] = None  # Video timestamp in seconds

class ListingLightResponse(BaseModel):
    id: UUID
    restaurant_id: Optional[UUID] = None
    restaurant: Optional[RestaurantResponse | UUID] = None
    video: Optional[VideoResponse | UUID] = None
    influencer: Optional[InfluencerLightResponse | UUID] = None
    visit_date: Optional[date] = None
    review_sections: Optional[ReviewSections] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    timestamp: Optional[int] = None  # Video timestamp in seconds
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
