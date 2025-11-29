from datetime import datetime
from typing import Optional, List, TYPE_CHECKING, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.api_schema.tags import TagResponse
from app.api_schema.cuisines import CuisineResponse

if TYPE_CHECKING:
    from app.api_schema.listings import ListingLightResponse

class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    address: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    google_place_id: Optional[str] = None
    google_rating: Optional[float] = None
    business_status: str
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    tags: Optional[list[TagResponse]] = None
    cuisines: Optional[list[CuisineResponse]] = None
    listings: Optional[List["ListingLightResponse"]] = None
    
    # Enhanced fields from Google Places API
    current_opening_hours: Optional[Dict[str, Any]] = None
    secondary_opening_hours: Optional[Dict[str, Any]] = None
    international_phone_number: Optional[str] = None
    opening_hours: Optional[Dict[str, Any]] = None
    price_level: Optional[int] = None
    website: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedRestaurantsResponse(BaseModel):
    """Response model for paginated restaurants with total count"""
    restaurants: List[RestaurantResponse]
    total: int
    
    model_config = ConfigDict(from_attributes=True)

class CityWithRestaurants(BaseModel):
    """Response model for a city with its restaurants"""
    city: str
    restaurants: List[RestaurantResponse]
    
    model_config = ConfigDict(from_attributes=True)

class TopCitiesWithRestaurantsResponse(BaseModel):
    """Response model for top cities with their restaurants"""
    cities: List[CityWithRestaurants]
    
    model_config = ConfigDict(from_attributes=True)

# Rebuild models to resolve forward references
def rebuild_models():
    """Rebuild models to resolve forward references after all imports are complete"""
    from app.api_schema.listings import ListingLightResponse
    RestaurantResponse.model_rebuild()
    PaginatedRestaurantsResponse.model_rebuild()