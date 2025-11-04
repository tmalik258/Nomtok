from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Query

from app.config import GOOGLE_MAPS_API_KEY
from app.utils.logging import setup_logger
from app.services.places_api_new import get_reviews

# Setup logging
logger = setup_logger(__name__)

router = APIRouter()

@router.get("/")
async def get_google_reviews(
    place_id: str = Query(..., description="Google Place ID for the restaurant")
) -> Dict[str, Any]:
    """
    Fetch Google Maps reviews for a restaurant using Places API.
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
        # Use Places API to get reviews
        result = await get_reviews(
            place_id=place_id,
            language="en",
            max_reviews=6
        )
        
        if result["status"] != "OK":
            logger.error(f"Failed to get reviews: {result}")
            raise HTTPException(
                status_code=404,
                detail="Could not find reviews for the provided place ID"
            )
        
        return {
            "status": "OK",
            "result": {
                "reviews": result["reviews"],
                "rating": result["rating"],
                "user_ratings_total": result["user_ratings_total"]
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching Google reviews: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching reviews"
        )