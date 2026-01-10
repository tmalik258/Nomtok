"""
API endpoints for fetching and refreshing YouTube video metadata.
"""
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from redis import Redis
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.config import REDIS_URL, YOUTUBE_API_KEY
from app.database import get_async_db
from app.models.video import Video
from app.services.youtube_metadata import fetch_video_metadata
from app.utils.logging import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

redis_client = Redis.from_url(REDIS_URL) if REDIS_URL else None


@router.get("/{video_id}")
async def get_youtube_metadata(
    video_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get YouTube metadata for a video ID.
    
    Returns cached metadata from database or Redis if available,
    otherwise fetches fresh from YouTube API.
    
    - **video_id**: YouTube video ID
    """
    try:
        if not YOUTUBE_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="YouTube API key not configured"
            )
        
        # Check Redis cache first (1 week TTL)
        cache_key = f"youtube_metadata:{video_id}"
        if redis_client:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.info(f"Returning cached metadata for video {video_id} from Redis")
                return json.loads(cached_data)
        
        # Check database for existing video record
        result = await db.execute(
            select(Video).where(Video.youtube_video_id == video_id)
        )
        video = result.scalar_one_or_none()
        
        # If video exists in DB and has recent metadata, return it
        if video and video.youtube_metadata_updated_at:
            # Check if metadata is less than 7 days old
            days_since_update = (datetime.now(video.youtube_metadata_updated_at.tzinfo) - video.youtube_metadata_updated_at).days
            if days_since_update < 7:
                metadata = {
                    "title": video.title,
                    "description": video.description,
                    "published_at": video.published_at.isoformat() if video.published_at else None,
                    "thumbnail_url": video.youtube_thumbnail_url,
                    "duration": video.youtube_duration,
                    "channel_title": video.youtube_channel_title,
                }
                # Cache in Redis
                if redis_client:
                    redis_client.setex(cache_key, 604800, json.dumps(metadata))  # 1 week
                logger.info(f"Returning cached metadata for video {video_id} from database")
                return metadata
        
        # Fetch fresh metadata from YouTube API
        logger.info(f"Fetching fresh metadata for video {video_id} from YouTube API")
        metadata = await fetch_video_metadata(video_id)
        
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail=f"Could not fetch metadata for video {video_id}"
            )
        
        # Update database if video exists
        if video:
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
        
        # Prepare response (exclude internal fields)
        response_metadata = {
            "title": metadata.get("title"),
            "description": metadata.get("description"),
            "published_at": metadata.get("published_at"),
            "thumbnail_url": metadata.get("thumbnail_url"),
            "duration": metadata.get("duration"),
            "channel_title": metadata.get("channel_title"),
        }
        
        # Cache in Redis (1 week)
        if redis_client:
            redis_client.setex(cache_key, 604800, json.dumps(response_metadata))
        
        return response_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching YouTube metadata for video {video_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching YouTube metadata: {str(e)}"
        )


@router.post("/{video_id}/refresh")
async def refresh_youtube_metadata(
    video_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Force refresh YouTube metadata for a video ID.
    
    Fetches fresh metadata from YouTube API and updates database/cache.
    
    - **video_id**: YouTube video ID
    """
    try:
        if not YOUTUBE_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="YouTube API key not configured"
            )
        
        # Fetch fresh metadata from YouTube API
        logger.info(f"Force refreshing metadata for video {video_id}")
        metadata = await fetch_video_metadata(video_id)
        
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail=f"Could not fetch metadata for video {video_id}"
            )
        
        # Find video in database
        result = await db.execute(
            select(Video).where(Video.youtube_video_id == video_id)
        )
        video = result.scalar_one_or_none()
        
        if video:
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
            logger.info(f"Updated metadata for video {video_id} in database")
        
        # Update Redis cache
        cache_key = f"youtube_metadata:{video_id}"
        response_metadata = {
            "title": metadata.get("title"),
            "description": metadata.get("description"),
            "published_at": metadata.get("published_at"),
            "thumbnail_url": metadata.get("thumbnail_url"),
            "duration": metadata.get("duration"),
            "channel_title": metadata.get("channel_title"),
        }
        
        if redis_client:
            redis_client.setex(cache_key, 604800, json.dumps(response_metadata))  # 1 week
            logger.info(f"Updated cache for video {video_id}")
        
        return response_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing YouTube metadata for video {video_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while refreshing YouTube metadata: {str(e)}"
        )


