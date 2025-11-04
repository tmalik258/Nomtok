# Google Maps API Migration Guide

This guide documents the urgent migration from legacy Google Maps Platform APIs to the newer Places API and related modern endpoints. Follow these steps to avoid service disruption and align the backend with current Google Maps Platform standards.

## Overview

- Legacy Places API endpoints and client libraries are transitioning to Legacy status and are no longer available in new projects.
- We must disable legacy APIs, enable Places API, and ensure our backend uses modern endpoints and response formats.
- Reference: Google Maps Platform Legacy products and features (https://developers.google.com/maps/legacy#LegacyApiNotActivatedMapError).

## Detection: Find Legacy Usage

- Search for `googlemaps` imports or `gmaps.` calls.
- Search for legacy endpoints like `maps.googleapis.com/maps/api/place/` and old photo/details endpoints.
- Confirm only `httpx` REST calls to `https://places.googleapis.com/v1` remain for Places operations.

## Cloud Console Changes

1. Navigate to Google Cloud Console → APIs & Services → Dashboard.
2. Verify our project API key set in `GOOGLE_MAPS_API_KEY`.
3. Disable Legacy APIs, if enabled:
   - Places API (Legacy)
   - Directions API (Legacy)
   - Distance Matrix API (Legacy)
4. Enable modern APIs:
   - Places API
   - Geocoding API (for address geocoding)
   - Routes API (only if our code uses Directions/Distance Matrix equivalents)
5. API key restrictions:
   - Application restrictions: allow server-side use (IP or none temporarily for testing).
   - API restrictions: restrict to `Places API`, `Geocoding API`, and `Routes API` if needed.

## Backend Code: Modern Endpoints

- We already use a REST client (`app/services/places_api_new.py`) built on `httpx`.
- Key endpoints:
  - Text Search: `POST https://places.googleapis.com/v1/places:searchText`
  - Place Details: `GET https://places.googleapis.com/v1/places/{place_id}`
  - Photos (media): `GET https://places.googleapis.com/v1/{photo_resource}:photo` (via helper)
  - Reviews: included via field masks where available
  - Geocoding: `GET https://maps.googleapis.com/maps/api/geocode/json`

### Authentication

- Use API key header: `X-Goog-Api-Key: ${GOOGLE_MAPS_API_KEY}`.
- Use field masks via `X-Goog-FieldMask` to limit response payloads.

### Response Differences

- `displayName.text` replaces legacy `name`.
- `formattedAddress` replaces legacy `formatted_address`.
- `location.latitude` and `location.longitude` replace legacy `geometry.location`.
- `businessStatus` values map to our `BusinessStatus` enum.
- `priceLevel` enum maps to integers: 1–4.
- `websiteUri` replaces legacy `website`.

## Migration Mappings

- Legacy Text Search → New Text Search
  - Old: `gmaps.places(query=...)`
  - New: `places_api_new.search_text(query, ...)`
- Legacy Place Details → New Place Details
  - Old: `gmaps.place(place_id=..., fields=[...])`
  - New: `places_api_new.get_place_details(place_id, fields)`
- Legacy Place Photos → New Photo Media
  - Old: `gmaps.places_photo(photo_reference, maxwidth=...)`
  - New: `places_api_new.get_place_photos(place_id)` then `get_photo_media(photo_resource)`
- Legacy Reviews → New Reviews via `get_reviews(place_id)` (implemented in our client)
- Geocoding remains via Geocoding API.

## Code Touchpoints Updated

- `app/services/places_api_new.py`: Implements new endpoints and data mapping.
- `app/services/google_places_service.py`: Delegates calls to the new client, preserving function names used elsewhere.
- `app/routes/google_reviews.py`: Uses `get_reviews` and returns structured response.
- `app/seeds/populate_restaurant_photos.py`: Fetches photo media from new Places API.
- `app/services/transcription_nlp.py`: Persists new fields (`price_level`, `website`) when storing `Restaurant`.

## Requirements

- Remove legacy `googlemaps` library from `backend/requirements.txt`.
- No additional client library is required; our REST implementation uses `httpx`.

## Testing Checklist

- Ensure `GOOGLE_MAPS_API_KEY` is set in `backend/.env` and available to Docker.
- Backend runs on `8030` in Docker. Use `dclogs backend` to verify startup.
- Smoke test reviews:
  - `curl -L "http://localhost:8030/google-reviews/?place_id=<PLACE_ID>"`
  - Expect: `{ status: "OK", result: { reviews, rating, user_ratings_total } }`
- Validate photo retrieval in seeds and ensure URLs are accessible.
- Validate `store_restaurant_and_listing` persists `price_level` and `website`.

## Rollout

1. Enable new APIs and adjust key restrictions.
2. Deploy backend with updated environment.
3. Verify logs and smoke tests.
4. Once stable, disable legacy APIs.

## Troubleshooting

- If responses include links to enable `places.googleapis.com` or `PERMISSION_DENIED`, verify API enablement and key restrictions.
- If `ModuleNotFoundError: slugify` appears, rebuild Docker image to install `python-slugify` from `requirements.txt`.

## Notes

- Keep frontend calling `/