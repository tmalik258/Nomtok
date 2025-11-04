from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict
from uuid import UUID

from app.models.restaurant import BusinessStatus

class RestaurantCreate(BaseModel):
    """Schema for creating a new restaurant using restaurant name with optional city and country"""
    name: str = Field(..., description="Restaurant name to search and create from Google Places API")
    city: Optional[str] = Field(None, description="City to help narrow down the search")
    country: Optional[str] = Field("USA", description="Country to help narrow down the search (defaults to USA)")
    
    model_config = ConfigDict(from_attributes=True)

class RestaurantUpdate(BaseModel):
    """Schema for updating an existing restaurant"""
    name: Optional[str] = Field(None, description="Restaurant name")
    address: Optional[str] = Field(None, description="Full address of the restaurant")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    city: Optional[str] = Field(None, description="City where restaurant is located")
    country: Optional[str] = Field(None, description="Country where restaurant is located")
    google_place_id: Optional[str] = Field(None, description="Google Places API ID")
    google_rating: Optional[float] = Field(None, description="Rating from Google Maps")
    business_status: Optional[BusinessStatus] = Field(
        None,
        description="Current business status"
    )
    photo_url: Optional[str] = Field(None, description="URL to restaurant photo")
    is_active: Optional[bool] = Field(None, description="Whether the restaurant is active")
    
    # Enhanced fields from Google Places API
    current_opening_hours: Optional[Dict[str, Any]] = Field(None, description="Structured opening hours")
    secondary_opening_hours: Optional[Dict[str, Any]] = Field(None, description="Alternative opening hours")
    international_phone_number: Optional[str] = Field(None, description="International phone number format")
    opening_hours: Optional[Dict[str, Any]] = Field(None, description="Raw Google Places opening hours data")
    price_level: Optional[int] = Field(None, description="Price level on a 0-4 scale from Google Places")
    website: Optional[str] = Field(None, description="Restaurant website URL")

    model_config = ConfigDict(from_attributes=True)

class RestaurantTagUpdate(BaseModel):
    """Schema for updating restaurant tags"""
    tag_ids: List[UUID] = Field(..., description="List of tag IDs to associate with the restaurant")

class RestaurantCuisineUpdate(BaseModel):
    """Schema for updating restaurant cuisines"""
    cuisine_ids: List[UUID] = Field(..., description="List of cuisine IDs to associate with the restaurant")

class RestaurantResponse(BaseModel):
    """Response after restaurant creation or update"""
    message: str
    restaurant_id: UUID