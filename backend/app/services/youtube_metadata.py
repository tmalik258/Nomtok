"""
Service to fetch and parse YouTube video metadata from YouTube Data API v3.
"""
import asyncio
import re
from typing import Dict, Any, Optional
from datetime import datetime

from googleapiclient.discovery import build
from googleapiclient.http import HttpRequest
from googleapiclient.errors import HttpError

from app.config import YOUTUBE_API_KEY
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


class CustomHttpRequest(HttpRequest):
    """Custom HTTP client to add referer header for YouTube API."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.headers["referer"] = "http://localhost:8030"


def build_youtube_client():
    """Build YouTube API client with custom referer header."""
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY is not configured")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, requestBuilder=CustomHttpRequest)


youtube = build_youtube_client() if YOUTUBE_API_KEY else None


def parse_duration(iso_duration: str) -> Optional[str]:
    """
    Parse ISO 8601 duration string to seconds.
    
    Args:
        iso_duration: ISO 8601 duration string (e.g., "PT5M30S" for 5 minutes 30 seconds)
        
    Returns:
        Duration in seconds as string, or None if parsing fails
    """
    if not iso_duration:
        return None
    
    try:
        # ISO 8601 duration format: PT[nH][nM][nS]
        # Examples: PT5M30S, PT1H2M3S, PT30S
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, iso_duration)
        
        if not match:
            logger.warning(f"Could not parse duration: {iso_duration}")
            return None
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        total_seconds = hours * 3600 + minutes * 60 + seconds
        return str(total_seconds)
    except Exception as e:
        logger.error(f"Error parsing duration {iso_duration}: {e}")
        return None


def get_best_thumbnail(thumbnails: Dict[str, Any]) -> Optional[str]:
    """
    Select the highest quality thumbnail from YouTube thumbnail options.
    
    Priority: maxres > standard > high > medium > default
    
    Args:
        thumbnails: Dictionary of thumbnail options from YouTube API
        
    Returns:
        URL of the best quality thumbnail, or None if not available
    """
    if not thumbnails:
        return None
    
    # Priority order: maxres > standard > high > medium > default
    quality_order = ['maxres', 'standard', 'high', 'medium', 'default']
    
    for quality in quality_order:
        if quality in thumbnails and thumbnails[quality].get('url'):
            return thumbnails[quality]['url']
    
    return None


async def fetch_video_metadata(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch video metadata from YouTube Data API v3.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Dictionary containing video metadata or None if not found/error
    """
    # Build client if needed
    try:
        client = youtube if youtube else build_youtube_client()
    except ValueError:
        logger.error("YouTube API client not initialized (YOUTUBE_API_KEY missing)")
        return None
    
    if not client:
        logger.error("Could not build YouTube API client")
        return None
    
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.videos().list(
                part="snippet,contentDetails",
                id=video_id
            ).execute()
        )
        
        if "items" not in response or len(response["items"]) == 0:
            logger.warning(f"No video found for ID: {video_id}")
            return None
        
        video_data = response["items"][0]
        snippet = video_data.get("snippet", {})
        content_details = video_data.get("contentDetails", {})
        
        # Extract metadata
        duration_iso = content_details.get("duration", "")
        duration_seconds = parse_duration(duration_iso) if duration_iso else None
        
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = get_best_thumbnail(thumbnails)
        
        metadata = {
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "published_at": snippet.get("publishedAt"),
            "thumbnail_url": thumbnail_url,
            "duration": duration_seconds,
            "duration_iso": duration_iso,
            "channel_title": snippet.get("channelTitle", ""),
            "channel_id": snippet.get("channelId", ""),
        }
        
        logger.info(f"Successfully fetched metadata for video {video_id}")
        return metadata
        
    except HttpError as e:
        logger.error(f"YouTube API error fetching metadata for video {video_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching metadata for video {video_id}: {e}")
        return None

