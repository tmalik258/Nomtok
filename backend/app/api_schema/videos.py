from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, field_validator, validator
from pydantic.config import ConfigDict
import re

from app.api_schema.influencers import InfluencerLightResponse
from app.models.video import VideoProcessingStatus

class VideoResponse(BaseModel):
    id: UUID
    influencer: Optional[InfluencerLightResponse] = None
    youtube_video_id: str
    title: str
    slug: str
    description: Optional[str] = None
    video_url: str
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None
    status: VideoProcessingStatus
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    listings_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class VideosResponse(BaseModel):
    videos: List[VideoResponse]
    total: int

class VideoCreate(BaseModel):
    influencer_id: UUID
    youtube_video_id: str
    title: str
    description: Optional[str] = None
    video_url: str
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None
    status: Optional[VideoProcessingStatus] = None
    error_message: Optional[str] = None

class VideoCreateFromUrl(BaseModel):
    """Simplified schema for creating videos from YouTube URL"""
    youtube_url: str
    
    @field_validator('youtube_url')
    def validate_youtube_url(cls, v):
        """Validate YouTube URL format"""
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/v/([\w-]+)'
        ]
        
        for pattern in youtube_patterns:
            if re.match(pattern, v):
                return v
        
        raise ValueError('Invalid YouTube URL format')
    
    def extract_video_id(self) -> str:
        """Extract video ID from YouTube URL"""
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/v/([\w-]+)'
        ]
        
        for pattern in youtube_patterns:
            match = re.match(pattern, self.youtube_url)
            if match:
                return match.group(1)
        
        raise ValueError('Could not extract video ID from URL')