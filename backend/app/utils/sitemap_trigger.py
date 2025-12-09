import httpx
from typing import Optional
from app.config import FRONTEND_URL, FRONTEND_SITEMAP_SECRET
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


async def trigger_sitemap_regeneration() -> bool:
    """
    Trigger sitemap regeneration by calling the frontend API endpoint.

    Returns:
        bool: True if regeneration was triggered successfully, False otherwise
    """
    if not FRONTEND_SITEMAP_SECRET:
        logger.warning("FRONTEND_SITEMAP_SECRET not configured; skipping sitemap regeneration")
        return False

    if not FRONTEND_URL:
        logger.warning("FRONTEND_URL not configured; skipping sitemap regeneration")
        return False

    try:
        url = f"{FRONTEND_URL.rstrip('/')}/api/admin/regenerate-sitemaps"
        headers = {
            "Authorization": f"Bearer {FRONTEND_SITEMAP_SECRET}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers)

            if response.status_code == 200:
                logger.info("Sitemap regeneration triggered successfully")
                return True
            else:
                logger.warning(
                    f"Sitemap regeneration failed with status {response.status_code}: {response.text}"
                )
                return False

    except httpx.TimeoutException:
        logger.error("Sitemap regeneration request timed out")
        return False
    except httpx.RequestError as e:
        logger.error(f"Sitemap regeneration request failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error triggering sitemap regeneration: {e}", exc_info=True)
        return False

