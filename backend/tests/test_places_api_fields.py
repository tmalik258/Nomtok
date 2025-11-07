import os
import json
import pytest
from dotenv import load_dotenv

from app.config import GOOGLE_MAPS_API_KEY
from app.services.places_api_new import validate_restaurant, fetch_restaurant_details

# Load env vars
load_dotenv()


def get_sample_inputs():
    name = os.getenv("TEST_RESTAURANT_NAME", "Sushi Sho")
    city = os.getenv("TEST_RESTAURANT_CITY", "New York")
    country = os.getenv("TEST_RESTAURANT_COUNTRY", "USA")
    return name, city, country


@pytest.mark.asyncio
async def test_fetch_restaurant_details_includes_opening_hours_and_phone():
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env file"

    name, city, country = get_sample_inputs()
    mapped = await fetch_restaurant_details(name, city=city, country=country)

    # Sanity: basic fields
    for key in [
        "name",
        "address",
        "latitude",
        "longitude",
        "google_place_id",
    ]:
        assert key in mapped, f"Mapped result missing '{key}'"

    # Opening hours and phone fields must be present (may be None if Google lacks data)
    assert "current_opening_hours" in mapped, "Missing current_opening_hours"
    assert "opening_hours" in mapped, "Missing opening_hours"
    assert "international_phone_number" in mapped, "Missing international_phone_number"
    assert "national_phone_number" in mapped, "Missing national_phone_number"


@pytest.mark.asyncio
async def test_validate_restaurant_includes_opening_hours_and_phone():
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
    assert result.get("valid") is True, "Restaurant validation failed"

    # Opening hours and phone presence
    assert "current_opening_hours" in result, "Missing current_opening_hours in validation"
    assert "opening_hours" in result, "Missing opening_hours in validation"
    assert "international_phone_number" in result, "Missing international_phone_number in validation"
    assert "national_phone_number" in result, "Missing national_phone_number in validation"

    # Log a compact summary for debugging when reading logs
    summary = {
        "name": result.get("name"),
        "google_place_id": result.get("google_place_id"),
        "has_current_opening_hours": bool(result.get("current_opening_hours")),
        "has_opening_hours": bool(result.get("opening_hours")),
        "international_phone_number": result.get("international_phone_number"