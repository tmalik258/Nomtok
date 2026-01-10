from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.video import Video
from app.models.influencer import Influencer
from app.api_schema.videos import VideoResponse, VideoCreate, VideoUpdate, VideoCreateFromUrl
from app.api_schema.influencers import InfluencerLightResponse
from app.services.youtube_scraper import get_video_metadata
import uuid
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from app.utils.logging import setup_logger

admin_videos_router = APIRouter()
logger = setup_logger(__name__)

@admin_videos_router.post(
    "/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED
)
async def create_video(
    video_data: VideoCreateFromUrl | VideoCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new video (Admin only) - supports both manual creation and YouTube URL"""
    try:
        # Check if this is a YouTube URL creation request
        if isinstance(video_data, VideoCreateFromUrl):
            # Handle YouTube URL creation with optional influencer association
            # Extract video ID
            video_id = video_data.extract_video_id()

            # Check if video already exists
            query = select(Video).filter(Video.youtube_video_id == video_id)
            result = await db.execute(query)
            existing_video = result.scalars().first()

            if existing_video:
                logger.warning(f"Duplicate video creation attempt for ID: {video_id}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Video with ID {video_id} already exists"
                )

            # Fetch video metadata from YouTube API
            metadata = get_video_metadata(video_id)
            if not metadata:
                logger.error(f"Failed to fetch metadata for video ID: {video_id}")
                raise HTTPException(
                    status_code=400,
                    detail="Could not fetch video metadata from YouTube. Please check the URL."
                )

            channel_id = metadata.get("channel_id")
            channel_title = metadata.get("channel_title")
            if not channel_id:
                logger.error(f"Missing channel_id in metadata for video ID: {video_id}")
                raise HTTPException(
                    status_code=400,
                    detail="YouTube metadata missing channel information; cannot associate influencer."
                )

            # Try to find existing influencer by YouTube channel ID
            inf_query = select(Influencer).filter(Influencer.youtube_channel_id == channel_id)
            inf_result = await db.execute(inf_query)
            influencer = inf_result.scalars().first()

            if influencer:
                influencer_id = influencer.id
            else:
                # Create new influencer using available metadata
                try:
                    influencer = Influencer(
                        id=uuid.uuid4(),
                        name=channel_title or "Unknown Channel",
                        youtube_channel_id=channel_id,
                        youtube_channel_url=f"https://www.youtube.com/channel/{channel_id}",
                        bio=None,
                        avatar_url=None,
                        banner_url=None,
                        subscriber_count=None,
                    )
                    db.add(influencer)
                    await db.refresh(influencer)
                    influencer_id = influencer.id
                except IntegrityError as ie:
                    msg = str(ie.orig) if getattr(ie, 'orig', None) else str(ie)
                    logger.error(f"Integrity error creating influencer for channel {channel_id}: {msg}")
                    raise HTTPException(status_code=400, detail="Failed to create influencer for this video.")

            # Parse published date
            published_at = None
            if metadata.get("published_at"):
                try:
                    published_at = datetime.strptime(
                        metadata["published_at"], "%Y-%m-%dT%H:%M:%SZ"
                    )
                except ValueError:
                    logger.error(f"Invalid published_at format for video ID: {video_id}")
                    pass

            # Create new video with extracted metadata
            new_video = Video(
                influencer_id=influencer_id,
                youtube_video_id=video_id,
                title=metadata["title"],
                description=metadata.get("description"),
                video_url=metadata["video_url"],
                published_at=published_at
            )
        else:
            # Handle manual video creation
            # video_data is already a VideoCreate instance
            new_video = Video(**video_data.model_dump())
        
        db.add(new_video)
        await db.refresh(new_video)
        
        # Fetch the video with influencer data for response
        query = select(Video).options(joinedload(Video.influencer)).filter(Video.id == new_video.id)
        result = await db.execute(query)
        video_with_influencer = result.scalars().first()
        
        # Manually construct VideoResponse with influencer data
        influencer_response = None
        if video_with_influencer.influencer:
            influencer_response = InfluencerLightResponse(
                id=video_with_influencer.influencer.id,
                name=video_with_influencer.influencer.name,
                slug=video_with_influencer.influencer.slug,
                bio=video_with_influencer.influencer.bio,
                avatar_url=video_with_influencer.influencer.avatar_url,
                banner_url=video_with_influencer.influencer.banner_url,
                youtube_channel_id=video_with_influencer.influencer.youtube_channel_id,
                youtube_channel_url=video_with_influencer.influencer.youtube_channel_url,
                subscriber_count=video_with_influencer.influencer.subscriber_count,
                created_at=video_with_influencer.influencer.created_at,
                updated_at=video_with_influencer.influencer.updated_at
            )
        
        return VideoResponse(
            id=video_with_influencer.id,
            influencer=influencer_response,
            youtube_video_id=video_with_influencer.youtube_video_id,
            title=video_with_influencer.title,
            slug=video_with_influencer.slug,
            description=video_with_influencer.description,
            video_url=video_with_influencer.video_url,
            published_at=video_with_influencer.published_at,
            transcription=video_with_influencer.transcription,
            status=video_with_influencer.status,
            error_message=video_with_influencer.error_message,
            created_at=video_with_influencer.created_at,
            updated_at=video_with_influencer.updated_at
        )
        
    except HTTPException:
        raise
    except IntegrityError as ie:
        msg = str(ie.orig) if getattr(ie, 'orig', None) else str(ie)
        # Detect unique constraint violations on youtube_video_id or composite influencer/youtube
        if 'duplicate key value violates unique constraint' in msg and (
            'videos_youtube_video_id_key' in msg or 'uix_influencer_youtube_video_id' in msg or 'ix_videos_youtube_video_id' in msg
        ):
            logger.warning(f"Video create conflict: {msg}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A video with this YouTube ID already exists."
            )
        logger.error(f"Integrity error creating video: {msg}")
        raise HTTPException(status_code=400, detail="Integrity error creating video.")
    except Exception as e:
        logger.error(f"Failed to create video: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create video: {str(e)}"
        )

@admin_videos_router.put(
    "/{video}/", response_model=VideoResponse
)
async def update_video(
    video: UUID,
    video_update: VideoUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing video (Admin only)"""
    try:
        query = select(Video).filter(Video.id == video)
        result = await db.execute(query)
        existing_video = result.scalars().first()
        
        if not existing_video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        for field, value in video_update.model_dump(exclude_unset=True).items():
            setattr(existing_video, field, value)
        
        await db.refresh(existing_video)
        
        # Fetch the updated video with influencer data for response
        query = select(Video).options(joinedload(Video.influencer)).filter(Video.id == video)
        result = await db.execute(query)
        video_with_influencer = result.scalars().first()
        
        # Manually construct VideoResponse with influencer data
        influencer_response = None
        if video_with_influencer.influencer:
            influencer_response = InfluencerLightResponse(
                id=video_with_influencer.influencer.id,
                name=video_with_influencer.influencer.name,
                slug=video_with_influencer.influencer.slug,
                bio=video_with_influencer.influencer.bio,
                avatar_url=video_with_influencer.influencer.avatar_url,
                banner_url=video_with_influencer.influencer.banner_url,
                youtube_channel_id=video_with_influencer.influencer.youtube_channel_id,
                youtube_channel_url=video_with_influencer.influencer.youtube_channel_url,
                subscriber_count=video_with_influencer.influencer.subscriber_count,
                created_at=video_with_influencer.influencer.created_at,
                updated_at=video_with_influencer.influencer.updated_at
            )
        
        return VideoResponse(
            id=video_with_influencer.id,
            influencer=influencer_response,
            youtube_video_id=video_with_influencer.youtube_video_id,
            title=video_with_influencer.title,
            slug=video_with_influencer.slug,
            description=video_with_influencer.description,
            video_url=video_with_influencer.video_url,
            published_at=video_with_influencer.published_at,
            transcription=video_with_influencer.transcription,
            status=video_with_influencer.status,
            error_message=video_with_influencer.error_message,
            created_at=video_with_influencer.created_at,
            updated_at=video_with_influencer.updated_at
        )
    except HTTPException:
        raise
    except IntegrityError as ie:
        msg = str(ie.orig) if getattr(ie, 'orig', None) else str(ie)
        if 'duplicate key value violates unique constraint' in msg and (
            'videos_youtube_video_id_key' in msg or 'uix_influencer_youtube_video_id' in msg or 'ix_videos_youtube_video_id' in msg
        ):
            logger.warning(f"Video update conflict: {msg}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A video with this YouTube ID already exists."
            )
        logger.error(f"Integrity error updating video: {msg}")
        raise HTTPException(status_code=400, detail="Integrity error updating video.")
    except Exception as e:
        logger.error(f"Failed to update video: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update video: {str(e)}"
        )

@admin_videos_router.delete(
    "/{video_id}/", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_video(
    video_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a video (Admin only)"""
    try:
        query = select(Video).filter(Video.id == video_id)
        result = await db.execute(query)
        existing_video = result.scalars().first()
        
        if not existing_video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        await db.execute(delete(Video).filter(Video.id == video_id))
        
        return {"message": "Video deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete video: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete video: {str(e)}"
        )
