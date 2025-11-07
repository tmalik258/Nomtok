import json
import os
from typing import Tuple

import pytest
from dotenv import load_dotenv

from app.config import GOOGLE_MAPS_API_KEY
from app.utils.logging import setup_logger
from app.services.places_api_new import (
    search_text,
    get_place_details,
    get_place_photos,
    get_reviews,
    validate_restaurant,
    fetch_restaurant_details,
)

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = setup_logger(__name__)

def get_sample_inputs() -> Tuple[str, str, str]:
    """Return a default restaurant test tuple (name, city, country).
    Values can be overridden with env vars TEST_RESTAURANT_NAME, TEST_RESTAURANT_CITY, TEST_RESTAURANT_COUNTRY.
    """
    name = os.getenv("TEST_RESTAURANT_NAME", "Sushi Sho")
    city = os.getenv("TEST_RESTAURANT_CITY", "New York")
    country = os.getenv("TEST_RESTAURANT_COUNTRY", "USA")
    return name, city, country


@pytest.mark.asyncio
async def test_places_api_search_and_details():
    """Exercise Places API search, details, photos, and reviews, logging raw payloads."""
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env file"

    name, city, country = get_sample_inputs()
    query = f"{name} {city} {country}".strip()
    logger.info(f"Places API search query: {query}")

    # Search
    search_result = await search_text(query=query)
    assert search_result["status"] == "OK", "Text search failed"
    assert len(search_result.get("places", [])) > 0, "No places returned from search"

    place = search_result["places"][0]
    place_id = place["id"]
    logger.info("Search result place (raw): " + json.dumps(place, ensure_ascii=False, indent=2))

    # Details with specific field mask covering stored attributes
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
    ]
    details_result = await get_place_details(place_id=place_id, fields=fields)
    assert details_result["status"] == "OK", "Place details call failed"
    assert details_result["place"] is not None, "No place details returned"

    detailed_place = details_result["place"]
    logger.info("Place details (raw): " + json.dumps(detailed_place, ensure_ascii=False, indent=2))

    # Photos
    photos = await get_place_photos(place_id, max_photos=1)
    logger.info("Photos (raw): " + json.dumps(photos, ensure_ascii=False, indent=2))

    # Reviews (limited)
    reviews_result = await get_reviews(place_id, max_reviews=3)
    logger.info("Reviews (raw): " + json.dumps(reviews_result, ensure_ascii=False, indent=2))

    # Basic structural assertions
    assert "displayName" in detailed_place, "Missing displayName"
    assert "formattedAddress" in detailed_place, "Missing formattedAddress"
    assert "location" in detailed_place, "Missing location"


@pytest.mark.asyncio
async def test_places_api_fetch_restaurant_details_mapping():
    """Verify the mapped structure from fetch_restaurant_details includes all stored fields."""
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env file"

    name, city, country = get_sample_inputs()
    mapped = await fetch_restaurant_details(name, city=city, country=country)

    logger.info("Mapped restaurant details: " + json.dumps(mapped, ensure_ascii=False, indent=2))

    # Validate presence of primary stored attributes
    required_keys = [
        "name",
        "address",
        "latitude",
        "longitude",
        "city",
        "country",
        "google_place_id",
        "google_rating",
        "business_status",
        "photo_url",
        "types",
        "price_level",
        "website_uri",
        "editorial_summary",
    ]
    for key in required_keys:
        assert key in mapped, f"Mapped result missing '{key}'"

    # Sanity checks for types
    assert isinstance(mapped.get("types", []), list), "types should be a list"
    assert isinstance(mapped.get("google_rating", 0), (int, float)), "google_rating should be numeric"


@pytest.mark.asyncio
async def test_places_api_validate_restaurant():
    """Validate restaurant using the Places API and log structured output."""
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env file"

    name, city, country = get_sample_inputs()
    entities = {
        "restaurant_name": name,
        "location": {"city": city, "country": country},
        "confidence_score": 0.8,
        "tags": [],
        "cuisines": [],
    }

    result = await validate_restaurant(entities)
    logger.info("Validate restaurant result: " + json.dumps(result, ensure_ascii=False, indent=2))

    assert result.get("valid") is True, "Restaurant validation failed"

    # Check mapped keys from validation
    for key in [
        "name",
        "address",
        "latitude",
        "longitude",
        "google_place_id",
        "google_rating",
        "business_status",
    ]:
        assert key in result, f"Validation result missing '{key}'"


# To run these tests and see detailed logs, use:
#   pytest backend/tests/test_youtube_api.py -s