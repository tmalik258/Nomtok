"""
Script to refresh YouTube video metadata for all videos.
Can be run as a standalone script or scheduled via cron.

Usage:
    python -m app.scripts.refresh_youtube_metadata
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import AsyncSessionLocal
from app.services.video_metadata_refresh import refresh_stale_video_metadata
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


async def main():
    """Main function to run the metadata refresh."""
    logger.info("Starting YouTube metadata refresh job")
    
    async with AsyncSessionLocal() as db:
        try:
            result = await refresh_stale_video_metadata(
                db=db,
                days_threshold=7,
                batch_size=50,
                rate_limit_delay=0.1
            )
            
            logger.info(f"Refresh job completed: {result}")
            
            if result.get("error"):
                logger.error(f"Job failed with error: {result['error']}")
                sys.exit(1)
            else:
                logger.info(
                    f"Successfully refreshed {result['successful']} videos, "
                    f"{result['failed']} failed out of {result['total']} total"
                )
                sys.exit(0)
                
        except Exception as e:
            logger.error(f"Fatal error in metadata refresh job: {e}")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
