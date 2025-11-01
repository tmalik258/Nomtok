from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Query

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.config import GOOGLE_MAPS_API_KEY
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize Google Maps client
gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

router = APIRouter()

@router.get("/")
async def get_google_reviews(
    place_id: str = Query(..., description="Google Place ID for the restaurant")
) -> Dict[str, Any]:
    """
    Fetch Google Maps reviews for a restaurant using Google Places API.
    Returns the 6 most recent reviews with proper error handling.
    """
    
    if not GOOGLE_MAPS_API_KEY:
        logger.error("Google Maps API key not configured")
        raise HTTPException(
            status_code=500, 
            detail="Google Maps API key not configured"
        )
    
    if not place_id:
        raise HTTPException(
            status_code=400, 
            detail="Place ID is required"
        )
    
    try:
        # Use Google Maps client to get place details with reviews
        place_details = gmaps.place(
            place_id=place_id,
            fields=["reviews", "rating", "user_ratings_total"],
            language="en"
        )
        
        # Extract reviews and rating data from the response
        result = place_details.get("result", {})
        reviews = result.get("reviews", [])
        rating = result.get("rating", 0)
        user_ratings_total = result.get("user_ratings_total", 0)
        
        # Sort reviews by time (most recent first) and limit to 6
        sorted_reviews = sorted(
            reviews, 
            key=lambda x: x.get("time", 0), 
            reverse=True
        )[:6]
        
        # Clean and format the response
        formatted_reviews = []
        for review in sorted_reviews:
            formatted_review = {
                "author_name": review.get("author_name", "Anonymous"),
                "author_url": review.get("author_url"),
                "language": review.get("language", "en"),
                "profile_photo_url": review.get("profile_photo_url", ""),
                "rating": review.get("rating", 0),
                "relative_time_description": review.get("relative_time_description", ""),
                "text": review.get("text", ""),
                "time": review.get("time", 0)
            }
            formatted_reviews.append(formatted_review)
        
        logger.info(f"Fetched {len(formatted_reviews)} reviews for place ID {place_id}")
        
        return {
            "status": "OK",
            "result": {
                "reviews": formatted_reviews,
                "rating": rating,
                "user_ratings_total": user_ratings_total
            }
        }
        
    except ApiError as e:
        logger.error(f"Google Maps API error: {str(e)}")
        
        # Handle specific Google API errors based on status
        error_status = getattr(e, 'status', 'UNKNOWN_ERROR')
        
        if error_status == 'NOT_FOUND':
            raise HTTPException(
                status_code=404,
                detail="Restaurant not found in Google Places"
            )
        elif error_status == 'OVER_QUERY_LIMIT':
            raise HTTPException(
                status_code=429,
                detail="Google Places API quota exceeded"
            )
        elif error_status == 'REQUEST_DENIED':
            raise HTTPException(
                status_code=403,
                detail="Google Places API request denied"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Google Places API error: {str(e)}"
            )
    except Exception as e:
        logger.error(f"Unexpected error fetching Google reviews: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching reviews"
        )