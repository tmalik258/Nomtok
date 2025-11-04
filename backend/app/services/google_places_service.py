import asyncio
from typing import Optional
from fastapi import HTTPException, status
import httpx

from app.config import GOOGLE_MAPS_API_KEY
from app.models.restaurant import BusinessStatus
from app.utils.logging import setup_logger
from app.services.places_api_new import (
    get_place_photos, 
    geocode_address as geocode_address_new,
    fetch_restaurant_details
)

# Setup logging
logger = setup_logger(__name__)


async def resolve_google_photo_url(photo_reference: str, maxwidth: int = 800) -> Optional[str]:
    """
    Legacy method maintained for backward compatibility.
    Resolves Google Places photo reference to URL using the new Places API.
    
    Args:
        photo_reference: Legacy photo reference (not used)
        maxwidth: Maximum width in pixels
        
    Returns:
        URL to the photo media or None if not found
    """
    logger.warning("Using deprecated resolve_google_photo_url - should migrate to get_photo_media")
    # This is a compatibility function that doesn't actually use the photo_reference parameter
    # Instead, it returns a placeholder URL since legacy photo references won't work with Places API (New)
    return None


async def refetch_photo_by_place_id(place_id: str, maxwidth: int = 800) -> Optional[str]:
    """
    Refetch a restaurant photo by Google Place ID using Places API (New).
    Returns None if not available or on error.
    
    Args:
        place_id: The Google Place ID
        maxwidth: Maximum width in pixels
        
    Returns:
        URL to the photo media or None if not found
    """
    logger.info(f"Refetching photo for place ID: {place_id} using Places API (New)")
    if not place_id:
        return None
    
    try:
        # Use Places API (New) to get photos
        photos = await get_place_photos(place_id=place_id, max_photos=1)
        if not photos:
            logger.info(f"No photos found for place {place_id}")
            return None
        
        photo_url = photos[0].get("media_url")
        if photo_url:
            logger.info(f"Refetched photo for {place_id}: {photo_url}")
            return photo_url
        else:
            logger.warning(f"Failed to get photo media URL for {place_id}")
            return None
    except Exception as e:
        logger.warning(f"Error refetching photo for {place_id}: {e}")
        return None


async def fetch_restaurant_details_from_google(restaurant_name: str, city: Optional[str] = None, country: str = "USA") -> dict:
    """
    Fetch restaurant details using Places API (New).
    
    Args:
        restaurant_name: The restaurant name
        city: Optional city name
        country: Country name (default: USA)
        
    Returns:
        Dictionary with restaurant details
    """
    logger.info(f"Fetching restaurant details using Places API (New): {restaurant_name}, city: {city}, country: {country}")
    
    # Delegate to the new implementation
    return await fetch_restaurant_details(restaurant_name, city, country)


async def geocode_address(address: str, city: str, country: str) -> dict:
    """
    Geocode an address using Places API (New) geocoding function.
    
    Args:
        address: The street address
        city: The city
        country: The country
        
    Returns:
        Dictionary with geocoding results
    """
    logger.info(f"Geocoding address using Places API (New): {address}, {city}, {country}")
    
    if not address or not city or not country:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address, city, and country are all required"
        )
    
    # Use Places API (New) geocoding
    result = await geocode_address_new(address, city, country)
    
    if result["status"] != "OK" or not result.get("location"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not geocode address: {address}, {city}, {country}"
        )
    
    location = result["location"]
    return {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "formatted_address": location["formatted_address"],
        "address_components": location["address_components"]
    }