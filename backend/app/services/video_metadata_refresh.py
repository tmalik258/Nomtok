"""
Background service for refreshing YouTube video metadata.
Refreshes metadata for videos that haven't been updated in 7+ days.
"""
import asyncio
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

from app.models.video import Video
from app.services.youtube_metadata import fetch_video_metadata
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


async def refresh_video_metadata(
    db: AsyncSession,
    video_id: str,
    video: Video
) -> bool:
    """
    Refresh metadata for a single video.
    
    Args:
        db: Database session
        video_id: YouTube video ID
        video: Video model instance
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"Refreshing metadata for video {video_id}")
        metadata = await fetch_video_metadata(video_id)
        
        if not metadata:
            logger.warning(f"Could not fetch metadata for video {video_id}")
            return False
        
        # Update database
        await db.execute(
            update(Video)
            .where(Video.id == video.id)
            .values(
                youtube_thumbnail_url=metadata.get("thumbnail_url"),
                youtube_duration=metadata.get("duration_iso"),
                youtube_channel_title=metadata.get("channel_title"),
                youtube_metadata_updated_at=datetime.now()
            )
        )
        await db.commit()
        
        logger.info(f"Successfully refreshed metadata for video {video_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error refreshing metadata for video {video_id}: {e}")
        await db.rollback()
        return False


async def refresh_stale_video_metadata(
    db: AsyncSession,
    days_threshold: int = 7,
    batch_size: int = 50,
    rate_limit_delay: float = 0.1
) -> dict:
    """
    Refresh metadata for videos that haven't been updated in the specified number of days.
    
    Respects YouTube API rate limits by processing in batches with delays.
    
    Args:
        db: Database session
        days_threshold: Number of days since last update to consider stale (default: 7)
        batch_size: Number of videos to process in each batch (default: 50)
        rate_limit_delay: Delay in seconds between API calls (default: 0.1)
        
    Returns:
        Dictionary with refresh statistics
    """
    try:
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=days_threshold)
        
        # Query videos that need refreshing
        # Either never updated or updated more than threshold days ago
        result = await db.execute(
            select(Video).where(
                and_(
                    Video.youtube_video_id.isnot(None),
                    (
                        (Video.youtube_metadata_updated_at.is_(None)) |
                        (Video.youtube_metadata_updated_at < cutoff_date)
                    )
                )
            )
        )
        videos = result.scalars().all()
        
        total_videos = len(videos)
        logger.info(f"Found {total_videos} videos to refresh metadata for")
        
        if total_videos == 0:
            return {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "skipped": 0
            }
        
        successful = 0
        failed = 0
        
        # Process in batches to respect rate limits
        for i in range(0, total_videos, batch_size):
            batch = videos[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1} ({len(batch)} videos)")
            
            for video in batch:
                success = await refresh_video_metadata(db, video.youtube_video_id, video)
                if success:
                    successful += 1
                else:
                    failed += 1
                
                # Rate limiting delay
                await asyncio.sleep(rate_limit_delay)
            
            # Longer delay between batches
            if i + batch_size < total_videos:
                await asyncio.sleep(1)
        
        logger.info(
            f"Metadata refresh completed: {successful} successful, {failed} failed out of {total_videos} total"
        )
        
        return {
            "total": total_videos,
            "successful": successful,
            "failed": failed,
            "skipped": 0
        }
        
    except Exception as e:
        logger.error(f"Error in refresh_stale_video_metadata: {e}")
        return {
            "total": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "error": str(e)
        }


