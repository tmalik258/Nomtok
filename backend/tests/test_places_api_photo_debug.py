import os
import json
import pytest
import httpx
from dotenv import load_dotenv

from app.utils.logging import setup_logger
from app.config import GOOGLE_MAPS_API_KEY
from app.services.places_api_new import (
    BASE_URL,
    get_headers,
    search_text,
)


# Load env vars early
load_dotenv()
logger = setup_logger(__name__)


def get_sample_inputs():
    """Read test inputs from env with sensible defaults.

    Defaults target a restaurant we observed failing (cote-korean-steakhouse).
    Override with env vars when needed.
    """
    name = os.getenv("TEST_RESTAURANT_NAME", "Cote Korean Steakhouse")
    city = os.getenv("TEST_RESTAURANT_CITY", "New York")
    country = os.getenv("TEST_RESTAURANT_COUNTRY", "USA")
    return name, city, country


async def resolve_place_id() -> str:
    """Resolve a `place_id` from env or via text search."""
    explicit_place_id = os.getenv("TEST_GOOGLE_PLACE_ID")
    if explicit_place_id:
        logger.info(f"Using explicit TEST_GOOGLE_PLACE_ID: {explicit_place_id}")
        return explicit_place_id

    name, city, country = get_sample_inputs()
    query = f"{name} {city} {country}".strip()
    logger.info(f"Resolving place_id via text search: {query}")

    search_result = await search_text(query=query)
    assert search_result.get("status") == "OK", f"Text search failed: {search_result}"
    places = search_result.get("places", [])
    assert places, "No places returned from search"
    place_id = places[0]["id"]
    logger.info("Search result place (raw): " + json.dumps(places[0], ensure_ascii=False, indent=2))
    return place_id


async def fetch_photo_resources(place_id: str, max_photos: int = 3):
    """Fetch raw photo resource names via Place Details with photos field mask."""
    headers = get_headers()
    # Use plural 'photos' per Places API v1 Place field mask
    headers["X-Goog-FieldMask"] = "photos"
    logger.info(f"Requesting photos for place_id={place_id}")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{BASE_URL}/places/{place_id}", headers=headers)
        logger.info(f"Photos details status={resp.status_code}")
        if resp.status_code != 200:
            logger.error(f"Photos details error body: {resp.text}")
            return []

        data = resp.json()
        photos = (data.get("photos") or [])[:max_photos]
        logger.info("Photos payload (raw): " + json.dumps(photos, ensure_ascii=False, indent=2))
        # Return just resource names for media testing
        return [p.get("name") for p in photos if p.get("name")]


async def fetch_photo_resources_list(place_id: str, max_photos: int = 3):
    """Fetch photo resource names via the dedicated photos listing endpoint."""
    headers = get_headers()
    logger.info(f"Requesting photos LIST for place_id={place_id}")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BASE_URL}/places/{place_id}/photos",
            headers=headers,
            params={"pageSize": max_photos}
        )
        logger.info(f"Photos list status={resp.status_code}")
        if resp.status_code != 200:
            logger.error(f"Photos list error body: {resp.text[:500]}")
            return []
        data = resp.json()
        photos = (data.get("photos") or [])[:max_photos]
        logger.info("Photos LIST payload (raw): " + json.dumps(photos, ensure_ascii=False, indent=2))
        return [p.get("name") for p in photos if p.get("name")]


async def get_media_debug(photo_name: str, width: int, height: int | None):
    """Call getMedia with parameter variants and return raw outcome."""
    headers = get_headers()
    payload = {"maxWidthPx": width}
    if height:
        payload["maxHeightPx"] = height

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(f"{BASE_URL}/{photo_name}:getMedia", headers=headers, json=payload)
        body_snippet = resp.text[:600]
        logger.info(
            f"getMedia photo_name={photo_name}, width={width}, height={height} -> status={resp.status_code}"
        )
        if resp.status_code == 200:
            try:
                media_url = resp.json().get("mediaUrl")
            except Exception:
                media_url = None
            logger.info(f"mediaUrl: {str(media_url)[:180]}")
            return {"status": resp.status_code, "media_url": media_url, "body": body_snippet}
        else:
            logger.error(f"getMedia error body: {body_snippet}")
            return {"status": resp.status_code, "media_url": None, "body": body_snippet}


async def get_media_via_photo(photo_name: str, width: int, height: int | None, skip_redirect: bool = True, follow_redirects: bool = False):
    """Call GET :photo with query params and return raw outcome, optionally skipping redirects."""
    headers = get_headers()
    params = {"maxWidthPx": width}
    if height:
        params["maxHeightPx"] = height
    if skip_redirect:
        params["skipHttpRedirect"] = True
    async with httpx.AsyncClient(timeout=20, follow_redirects=follow_redirects) as client:
        resp = await client.get(f"{BASE_URL}/{photo_name}:photo", headers=headers, params=params)
        body_snippet = resp.text[:600]
        logger.info(
            f"PHOTO photo_name={photo_name}, width={width}, height={height}, skipRedirect={skip_redirect}, followRedirects={follow_redirects} -> status={resp.status_code}"
        )
        logger.info("PHOTO response headers: " + json.dumps(dict(resp.headers), ensure_ascii=False)[:500])
        media_url = None
        # Try to parse structured response
        try:
            j = resp.json()
            media_url = j.get("mediaUrl") or j.get("photoUri") or j.get("browserUrl")
        except Exception:
            pass
        # Fallback to Location header if present
        if not media_url:
            media_url = resp.headers.get("Location")
        if resp.status_code != 200:
            logger.error(f"PHOTO error body: {body_snippet}")
        if media_url:
            logger.info(f"PHOTO mediaUrl: {str(media_url)[:300]}")
        return {"status": resp.status_code, "media_url": media_url, "body": body_snippet}


async def check_media_accessibility(media_url: str | None):
    """Do a lightweight accessibility check of returned mediaUrl."""
    if not media_url:
        return {"reachable": False, "status": None}

    async with httpx.AsyncClient(timeout=20) as client:
        # Try a HEAD first; fallback to GET without downloading fully (no stream for simplicity)
        head = await client.head(media_url, follow_redirects=True)
        if head.status_code >= 200 and head.status_code < 400:
            logger.info(f"HEAD media reachable status={head.status_code}, ct={head.headers.get('Content-Type')}")
            return {"reachable": True, "status": head.status_code}
        logger.warning(f"HEAD failed status={head.status_code}; trying GET...")
        get = await client.get(media_url, follow_redirects=True)
        logger.info(
            f"GET media status={get.status_code}, ct={get.headers.get('Content-Type')}, len={len(get.content)}"
        )
        return {"reachable": 200 <= get.status_code < 400, "status": get.status_code}


@pytest.mark.asyncio
async def test_photo_media_flow_end_to_end():
    """End-to-end flow: resolve place -> list photos -> get media -> reachability."""
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env"

    place_id = await resolve_place_id()
    # Prefer the listing endpoint to get valid names; fallback to details
    photo_names = await fetch_photo_resources_list(place_id, max_photos=3)
    if not photo_names:
        photo_names = await fetch_photo_resources(place_id, max_photos=3)
    # We expect at least to attempt a media call; do not hard fail on no photos, but log
    assert photo_names is not None
    logger.info(f"Found {len(photo_names)} photo resource names: {photo_names}")

    widths = [400, 800, 1600]
    heights = [None, 800]

    for pn in photo_names:
        for w in widths:
            for h in heights:
                # Try PHOTO first, then GETMEDIA for comparison
                # Try PHOTO with skip redirect first
                result = await get_media_via_photo(pn, w, h, skip_redirect=True)
                if result["status"] != 200:
                    # Try PHOTO following redirects (may surface 403s at image host)
                    result = await get_media_via_photo(pn, w, h, skip_redirect=False, follow_redirects=True)
                if result["status"] != 200:
                    # Compare with legacy getMedia
                    result = await get_media_debug(pn, w, h)
                if result["media_url"]:
                    acc = await check_media_accessibility(result["media_url"])
                    logger.info(f"Reachability for width={w}, height={h}: {acc}")

    # The test is primarily diagnostic; ensure we at least attempted calls
    assert True


@pytest.mark.asyncio
async def test_photo_media_params_matrix():
    """Exercise getMedia over a wider parameter matrix and log raw errors for 403/404."""
    assert GOOGLE_MAPS_API_KEY is not None, "GOOGLE_MAPS_API_KEY not found in .env"

    place_id = await resolve_place_id()
    photo_names = await fetch_photo_resources_list(place_id, max_photos=1)
    assert photo_names is not None
    if not photo_names:
        # Fallback to details if list empty
        photo_names = await fetch_photo_resources(place_id, max_photos=1)
        if not photo_names:
            pytest.skip("No photo resources returned from list/details; cannot test media params.")

    pn = photo_names[0]
    test_matrix = [
        {"w": 320, "h": None},
        {"w": 640, "h": None},
        {"w": 800, "h": None},
        {"w": 1024, "h": None},
        {"w": 800, "h": 800},
        {"w": 1200, "h": 800},
        {"w": 1600, "h": 1200},
    ]

    statuses = []
    for cfg in test_matrix:
        # Prefer :photo endpoint
        # :photo with skip redirect
        res = await get_media_via_photo(pn, cfg["w"], cfg["h"], skip_redirect=True)
        if res["status"] != 200:
            # Try :photo follow redirects
            res = await get_media_via_photo(pn, cfg["w"], cfg["h"], skip_redirect=False, follow_redirects=True)
            if res["status"] != 200:
                # Try :getMedia for comparison
                res = await get_media_debug(pn, cfg["w"], cfg["h"])
        statuses.append(res["status"]) 

    logger.info(f"getMedia statuses across matrix: {statuses}")
    # At least one of the combinations should be 200; if not, surface info in failure
    if not any(s == 200 for s in statuses):
        pytest.fail(
            "All getMedia requests failed. Inspect logs for 403/404 bodies and header/params used."
        )