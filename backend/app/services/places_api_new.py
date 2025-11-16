"""
Places API client for Google Maps Platform.
This module implements REST API calls to the new Places API v1 endpoints
to replace the deprecated legacy Places API.

Documentation: https://developers.google.com/maps/documentation/places/web-service/places-api-overview
"""
import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from app.config import GOOGLE_MAPS_API_KEY, PLACES_BASE_URL
from app.models.restaurant import BusinessStatus
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)



# Common headers for Places API
def get_headers():
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "*",  # Default to all fields, can be overridden
        "User-Agent": "Nomtok/1.0"
    }

async def search_text(
    query: str, 
    location_bias: Optional[Dict[str, Any]] = None,
    fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Search for places using Text Search endpoint.
    
    Args:
        query: The search query
        location_bias: Optional location bias parameters
        fields: Optional list of field masks to include in response
    
    Returns:
        Dictionary containing search results
    """
    logger.info(f"Places API text search: {query}")
    
    # Prepare request payload
    payload = {"textQuery": query}
    if location_bias:
        payload["locationBias"] = location_bias
    
    # Prepare headers with field masks if provided
    headers = get_headers()
    if fields:
        headers["X-Goog-FieldMask"] = ",".join(fields)
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{PLACES_BASE_URL}/places:searchText",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"Places API text search error: {response.status_code}, {response.text}")
                return {"status": "ERROR", "places": []}
            
            data = response.json()
            logger.info(f"Places API text search success: found {len(data.get('places', []))} places")
            return {"status": "OK", "places": data.get("places", [])}
            
    except Exception as e:
        logger.error(f"Places API text search exception: {e}")
        return {"status": "ERROR", "places": []}

async def get_place_details(
    place_id: str, 
    fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Get place details using Place Details endpoint.
    
    Args:
        place_id: The Google Place ID
        fields: Optional list of field masks to include in response
    
    Returns:
        Dictionary containing place details
    """
    logger.info(f"Places API place details: {place_id}")
    
    # Prepare headers with field masks if provided
    headers = get_headers()
    if fields:
        headers["X-Goog-FieldMask"] = ",".join(fields)
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{PLACES_BASE_URL}/places/{place_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Places API place details error: {response.status_code}, {response.text}")
                return {"status": "ERROR", "place": None}
            
            data = response.json()
            return {"status": "OK", "place": data}
            
    except Exception as e:
        logger.error(f"Places API place details exception: {e}")
        return {"status": "ERROR", "place": None}

async def get_place_photos(
    place_id: str,
    max_photos: int = 1
) -> List[Dict[str, Any]]:
    """
    Get photo details for a place.
    
    Args:
        place_id: The Google Place ID
        max_photos: Maximum number of photos to return
    
    Returns:
        List of photo details with media URLs
    """
    logger.info(f"Places API fetching photos for: {place_id}")
    
    # First get place details with photos field
    try:
        details_result = await get_place_details(place_id=place_id, fields=["id", "photos"])
        if details_result["status"] != "OK" or not details_result.get("place"):
            logger.error(f"Places API photos error: failed to fetch details for {place_id}")
            return []

        data = details_result["place"]
        photos = (data.get("photos") or [])[:max_photos]
        if not photos:
            logger.info(f"No photos found for place: {place_id}")
            return []
        
        logger.info(f"Found {len(photos)} photos for place: {place_id}")

        result_photos: List[Dict[str, Any]] = []
        for photo in photos:
            photo_name = photo.get("name")
            if not photo_name:
                continue
            media_url = await get_photo_media(place_id, photo_name)
            if media_url:
                result_photos.append({
                    "name": photo_name,
                    "media_url": media_url,
                    "width": photo.get("widthPx"),
                    "height": photo.get("heightPx"),
                    "author_attribution": (photo.get("authorAttributions") or [{}])[0].get("displayName")
                })
        return result_photos

    except Exception as e:
        logger.error(f"Places API photos exception: {e}")
        return []

async def get_photo_media(
    place_id: str,
    photo_name: str,
    max_width_px: int = 800,
    max_height_px: Optional[int] = None
) -> Optional[str]:
    """
    Get photo media URL for a photo name.
    
    Args:
        place_id: The Google Place ID
        photo_name: The photo name from Places API
        max_width_px: Maximum width in pixels
        max_height_px: Maximum height in pixels (optional)
    
    Returns:
        URL to the photo media or None if not found
    """
    headers = get_headers()
    if "X-Goog-FieldMask" in headers:
        del headers["X-Goog-FieldMask"]
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{PLACES_BASE_URL}/{photo_name}/media?maxWidthPx={max_width_px}{max_height_px and f'&maxHeightPx={max_height_px}' or ''}&skipHttpRedirect=true",
                headers=headers,
            )
            
            if response.status_code != 200:
                logger.error(f"Places API photo media error: {response.status_code}, {response.text}")
                return None

            data = response.json()

            media_url = data.get("photoUri")
            
            if media_url:
                return media_url
            return None

    except Exception as e:
        logger.error(f"Places API photo media exception: {e}")
        return None

async def geocode_address(
    address: str, 
    city: str, 
    country: str
) -> Dict[str, Any]:
    """
    Geocode an address using Geocoding API.
    
    Args:
        address: The street address
        city: The city
        country: The country
    
    Returns:
        Dictionary with geocoding results
    """
    logger.info(f"Geocoding address: {address}, {city}, {country}")
    
    # Construct full address string
    full_address = f"{address.strip()}, {city.strip()}, {country.strip()}"
    
    # Prepare request for Geocoding API (still uses maps.googleapis.com)
    params = {
        "address": full_address,
        "key": GOOGLE_MAPS_API_KEY
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params=params
            )
            
            if response.status_code != 200:
                logger.error(f"Geocoding API error: {response.status_code}, {response.text}")
                return {"status": "ERROR", "location": None}
            
            data = response.json()
            if data.get("status") != "OK" or not data.get("results"):
                logger.error(f"Geocoding API returned no results: {data.get('status')}")
                return {"status": "ERROR", "location": None}
            
            result = data["results"][0]
            location = result["geometry"]["location"]
            formatted_address = result["formatted_address"]
            
            logger.info(f"Successfully geocoded: {formatted_address} -> ({location['lat']}, {location['lng']})")
            
            return {
                "status": "OK",
                "location": {
                    "latitude": location["lat"],
                    "longitude": location["lng"],
                    "formatted_address": formatted_address,
                    "address_components": result.get("address_components", [])
                }
            }
            
    except Exception as e:
        logger.error(f"Geocoding exception: {e}")
        return {"status": "ERROR", "location": None}

async def get_reviews(
    place_id: str,
    language: str = "en",
    max_reviews: int = 6
) -> Dict[str, Any]:
    """
    Get reviews for a place using Place Details.
    
    Args:
        place_id: The Google Place ID
        language: The language code for reviews
        max_reviews: Maximum number of reviews to return
    
    Returns:
        Dictionary with reviews and rating information
    """
    logger.info(f"Places API getting reviews for: {place_id}")
    
    # Set field mask to include only reviews and rating
    headers = get_headers()
    headers["X-Goog-FieldMask"] = "reviews,rating,userRatingCount"
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{PLACES_BASE_URL}/places/{place_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Places API reviews error: {response.status_code}, {response.text}")
                return {"status": "ERROR", "reviews": [], "rating": 0, "user_ratings_total": 0}
            
            data = response.json()
            reviews = data.get("reviews", [])[:max_reviews]
            rating = data.get("rating", 0)
            user_ratings_count = data.get("userRatingCount", 0)
            
            # Format reviews to match existing schema
            formatted_reviews = []
            for review in reviews:
                formatted_review = {
                    "author_name": review.get("authorAttribution", {}).get("displayName", "Anonymous"),
                    "author_url": review.get("authorAttribution", {}).get("uri"),
                    "language": language,
                    "profile_photo_url": review.get("authorAttribution", {}).get("photoUri", ""),
                    "rating": review.get("rating", 0),
                    "relative_time_description": review.get("relativePublishTimeDescription", ""),
                    "text": review.get("text", {}).get("text", ""),
                    "time": review.get("publishTime", "")
                }
                formatted_reviews.append(formatted_review)
            
            # Sort by publish time (most recent first)
            formatted_reviews.sort(key=lambda x: x.get("time", ""), reverse=True)
            
            logger.info(f"Got {len(formatted_reviews)} reviews for place: {place_id}")
            
            return {
                "status": "OK",
                "reviews": formatted_reviews,
                "rating": rating,
                "user_ratings_total": user_ratings_count
            }
            
    except Exception as e:
        logger.error(f"Places API reviews exception: {e}")
        return {"status": "ERROR", "reviews": [], "rating": 0, "user_ratings_total": 0}

async def validate_restaurant(entities: dict) -> dict:
    """
    Validate restaurant details using Places API.
    Replacement for the validate_restaurant function in transcription_nlp.py.
    
    Args:
        entities: Dictionary with restaurant details including restaurant_name and location
        
    Returns:
        Dictionary with validated restaurant details
    """
    logger.info(f"Validating restaurant using Places API: {entities}")
    if not entities.get("restaurant_name") or not entities.get("location"):
        logger.warning("No restaurant name or location found")
        return {"valid": False}
    
    try:
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        
        # Use Places API text search
        result = await search_text(query=query)
        
        if result["status"] != "OK" or not result["places"]:
            return {"valid": False}
        
        place = result["places"][0]
        logger.info(f"Validated restaurant with Places API: {place.get('displayName', {}).get('text')} ({place.get('id')})")
        
        # Extract photo URL using new photo media endpoint
        photo_url = None
        try:
            photos = await get_place_photos(place["id"], max_photos=1)
            if photos:
                photo_url = photos[0]["media_url"]
                logger.info(f"Found photo for {place.get('displayName', {}).get('text')}: {photo_url}")
            else:
                logger.info(f"No photos found for {place.get('displayName', {}).get('text')}")
        except Exception as photo_error:
            logger.warning(f"Could not extract photo: {photo_error}")
        
        # Map business status from new API format to existing enum
        business_status_map = {
            "OPERATIONAL": BusinessStatus.OPERATIONAL.value,
            "CLOSED_TEMPORARILY": BusinessStatus.CLOSED_TEMPORARILY.value,
            "CLOSED_PERMANENTLY": BusinessStatus.CLOSED_PERMANENTLY.value
        }
        business_status = business_status_map.get(
            place.get("businessStatus", ""),
            BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value
        )
        
        # Get location data
        location = place.get("location", {})
        lat = location.get("latitude", 0)
        lng = location.get("longitude", 0)
        
        # Get formatted address
        formatted_address = place.get("formattedAddress", "")
        
        # Get rating
        rating = place.get("rating", 0)

        # Opening hours and phone numbers
        current_opening_hours = place.get("currentOpeningHours")
        secondary_opening_hours = place.get("secondaryOpeningHours")
        opening_hours = place.get("regularOpeningHours") or place.get("openingHours")
        international_phone_number = place.get("internationalPhoneNumber")
        national_phone_number = place.get("nationalPhoneNumber")
        website_uri = place.get("websiteUri", "")
        website = website_uri  # alias for model compatibility
        
        return {
            "valid": True,
            "name": place.get("displayName", {}).get("text", entities["restaurant_name"]),
            "address": formatted_address,
            "latitude": lat,
            "longitude": lng,
            "city": entities["location"].get("city"),
            "country": entities["location"].get("country"),
            "google_place_id": place["id"],
            "google_rating": rating,
            "business_status": business_status,
            "photo_url": photo_url,
            "confidence_score": entities.get("confidence_score", 0.8),
            "tags": entities.get("tags", []),
            "cuisines": entities.get("cuisines", []),
            # New fields from Places API
            "types": place.get("types", []),
            "price_level": {
                "PRICE_LEVEL_INEXPENSIVE": 1,
                "PRICE_LEVEL_MODERATE": 2,
                "PRICE_LEVEL_EXPENSIVE": 3,
                "PRICE_LEVEL_VERY_EXPENSIVE": 4,
            }.get(place.get("priceLevel", "")),
            "website_uri": website_uri,
            "website": website,
            "editorial_summary": place.get("editorialSummary", {}).get("text", ""),
            "current_opening_hours": current_opening_hours,
            "secondary_opening_hours": secondary_opening_hours,
            "opening_hours": opening_hours,
            "international_phone_number": international_phone_number,
            "national_phone_number": national_phone_number,
        }
    except Exception as e:
        logger.error(f"Error validating restaurant with Places API: {e}")
        return {"valid": False}

async def fetch_restaurant_details(
    restaurant_name: str, 
    city: Optional[str] = None, 
    country: str = "USA"
) -> dict:
    """
    Fetch restaurant details using Places API.
    Replacement for fetch_restaurant_details_from_google in google_places_service.py.
    
    Args:
        restaurant_name: The restaurant name
        city: Optional city name
        country: Country name (default: USA)
        
    Returns:
        Dictionary with restaurant details
    """
    logger.info(f"Fetching restaurant details from Places API: {restaurant_name}, city: {city}, country: {country}")
    
    if not restaurant_name or not restaurant_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant name is required"
        )
    
    # Build search query
    query_parts = [restaurant_name.strip()]
    if city and city.strip() and city != None:
        query_parts.append(city.strip())
    if country and country.strip() and country != None:
        query_parts.append(country.strip())
    
    query = " ".join(query_parts)
    logger.info(f"Places API search query: {query}")
    
    try:
        # Search for the restaurant using text search
        result = await search_text(query=query)
        
        if result["status"] != "OK" or not result["places"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant '{restaurant_name}' not found in Google Places"
            )
        
        place = result["places"][0]
        place_id = place["id"]
        
        # Get more detailed place information
        # Request details with explicit field mask to ensure opening hours and phone fields
        fields = [
            "id",
            "displayName",
            "formattedAddress",
            "location",
            "rating",
            "userRatingCount",
            "businessStatus",
            "photos",
            "websiteUri",
            "editorialSummary",
            "priceLevel",
            "types",
            "addressComponents",
            "openingHours",
            "currentOpeningHours",
            "secondaryOpeningHours",
            "internationalPhoneNumber",
            "nationalPhoneNumber",
        ]
        details_result = await get_place_details(place_id=place_id, fields=fields)
        if details_result["status"] == "OK" and details_result["place"]:
            # Merge to preserve any fields present in the search payload (like currentOpeningHours)
            place = {**place, **details_result["place"]}
            logger.info(
                f"Merged search+details payload. currentOpeningHours present: {bool(place.get('currentOpeningHours'))}"
            )
        logger.info(f"Found restaurant: {place.get('displayName', {}).get('text')} ({place['id']})")
        
        # Extract photo URL
        photo_url = None
        try:
            photos = await get_place_photos(place["id"], max_photos=1)
            if photos:
                photo_url = photos[0]["media_url"]
                logger.info(f"Found photo: {photo_url}")
        except Exception as photo_error:
            logger.warning(f"Could not extract photo: {photo_error}")
        
        # Map business status
        business_status_map = {
            "OPERATIONAL": BusinessStatus.OPERATIONAL.value,
            "CLOSED_TEMPORARILY": BusinessStatus.CLOSED_TEMPORARILY.value,
            "CLOSED_PERMANENTLY": BusinessStatus.CLOSED_PERMANENTLY.value
        }
        business_status = business_status_map.get(
            place.get("businessStatus", ""),
            BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value
        )
        
        # Extract location data
        location = place.get("location", {})
        lat = location.get("latitude", 0)
        lng = location.get("longitude", 0)
        
        # Get address components (API returns a list directly)
        address_components = place.get("addressComponents", [])
        extracted_city = city
        extracted_country = country
        
        for component in address_components:
            types = component.get("types", [])
            if "locality" in types:
                extracted_city = component.get("longText") or component.get("shortText")
            elif "country" in types:
                extracted_country = component.get("longText") or component.get("shortText")
        
        # Opening hours and phone numbers
        current_opening_hours = place.get("currentOpeningHours")
        secondary_opening_hours = place.get("secondaryOpeningHours")
        opening_hours = place.get("regularOpeningHours") or place.get("openingHours")
        international_phone_number = place.get("internationalPhoneNumber")
        national_phone_number = place.get("nationalPhoneNumber")
        website_uri = place.get("websiteUri", "")
        website = website_uri  # alias for model compatibility
        
        return {
            "name": place.get("displayName", {}).get("text", restaurant_name),
            "address": place.get("formattedAddress", ""),
            "latitude": lat,
            "longitude": lng,
            "city": extracted_city or city,
            "country": extracted_country or country,
            "google_place_id": place["id"],
            "google_rating": place.get("rating", 0),
            "business_status": business_status,
            "photo_url": photo_url,
            # New fields from Places API
            "types": place.get("types", []),
            "price_level": {
                "PRICE_LEVEL_INEXPENSIVE": 1,
                "PRICE_LEVEL_MODERATE": 2,
                "PRICE_LEVEL_EXPENSIVE": 3,
                "PRICE_LEVEL_VERY_EXPENSIVE": 4,
            }.get(place.get("priceLevel", "")),
            "website_uri": website_uri,
            "website": website,
            "editorial_summary": place.get("editorialSummary", {}).get("text", ""),
            "current_opening_hours": current_opening_hours,
            "secondary_opening_hours": secondary_opening_hours,
            "opening_hours": opening_hours,
            "international_phone_number": international_phone_number,
            "national_phone_number": national_phone_number,
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching restaurant details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching restaurant details: {str(e)}"
        )
