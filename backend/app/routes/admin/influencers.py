from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import get_async_db
from app.dependencies import get_current_admin
from app.utils.logging import setup_logger
from app.utils.sitemap_trigger import trigger_sitemap_regeneration
from app.models.influencer import Influencer
from app.api_schema.influencers import InfluencerCreateFromUrl, InfluencerUpdate, InfluencerResponse
from app.services.youtube_scraper import get_channel
import asyncio

# Configure logger
logger = setup_logger(__name__)

admin_influencers_router = APIRouter()

def sanitize_string(value: str) -> str:
    """Sanitize string input by stripping whitespace and limiting length"""
    if not value:
        return value
    return value.strip()[:1000]  # Limit to 1000 characters

@admin_influencers_router.post(
    "/", response_model=InfluencerResponse, status_code=status.HTTP_201_CREATED
)
async def create_influencer(
    influencer_data: InfluencerCreateFromUrl,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new influencer from YouTube URL (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to create influencer from URL: {influencer_data.youtube_url}")

    try:
        # Scrape YouTube channel data
        channel = get_channel(influencer_data.youtube_url)

        if not channel:
            logger.error(f"Failed to scrape channel data for URL: {influencer_data.youtube_url}")
            raise HTTPException(
                status_code=400, 
                detail="Failed to scrape channel data from YouTube URL"
            )

        youtube_channel_id = channel.get('channel_id', '')
        
        # Check if influencer already exists by youtube_channel_id
        existing_query = select(Influencer).filter(Influencer.youtube_channel_id == youtube_channel_id)
        existing_result = await db.execute(existing_query)
        existing_influencer = existing_result.scalars().first()

        if existing_influencer:
            # Update existing influencer
            logger.info(f"Influencer with YouTube channel ID {youtube_channel_id} already exists. Updating existing influencer.")
            
            # Update fields with new data
            existing_influencer.name = channel.get('name', existing_influencer.name)
            existing_influencer.bio = channel.get('bio', existing_influencer.bio)
            existing_influencer.avatar_url = channel.get('avatar_url', existing_influencer.avatar_url)
            existing_influencer.banner_url = channel.get('banner_url', existing_influencer.banner_url)
            existing_influencer.youtube_channel_url = channel.get('channel_url', influencer_data.youtube_url)
            existing_influencer.subscriber_count = channel.get('subscriber_count', existing_influencer.subscriber_count)
            
            await db.commit()
            await db.refresh(existing_influencer)
            
            logger.info(f"Admin {current_admin.email} successfully updated influencer: {existing_influencer.name} (ID: {existing_influencer.id})")
            
            # Trigger sitemap regeneration in background
            asyncio.create_task(trigger_sitemap_regeneration())
            
            # Return the updated influencer
            return InfluencerResponse(
                id=existing_influencer.id,
                name=existing_influencer.name,
                slug=existing_influencer.slug,
                bio=existing_influencer.bio,
                avatar_url=existing_influencer.avatar_url,
                banner_url=existing_influencer.banner_url,
                youtube_channel_id=existing_influencer.youtube_channel_id,
                youtube_channel_url=existing_influencer.youtube_channel_url,
                subscriber_count=existing_influencer.subscriber_count,
                created_at=existing_influencer.created_at,
                updated_at=existing_influencer.updated_at,
                listings=None
            )

        # Create new influencer
        logger.info(f"Creating new influencer with YouTube channel ID: {youtube_channel_id}")
        
        influencer = Influencer(
            name=channel.get('name', ''),
            bio=channel.get('bio', ''),
            avatar_url=channel.get('avatar_url', ''),
            banner_url=channel.get('banner_url', ''),
            youtube_channel_id=youtube_channel_id,
            youtube_channel_url=channel.get('channel_url', influencer_data.youtube_url),
            subscriber_count=channel.get('subscriber_count', 0),
        )
        db.add(influencer)
        await db.commit()
        await db.refresh(influencer)
        
        logger.info(f"Admin {current_admin.email} successfully created new influencer: {influencer.name} (ID: {influencer.id})")
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        # Return the created influencer
        return InfluencerResponse(
            id=influencer.id,
            name=influencer.name,
            slug=influencer.slug,
            bio=influencer.bio,
            avatar_url=influencer.avatar_url,
            banner_url=influencer.banner_url,
            youtube_channel_id=influencer.youtube_channel_id,
            youtube_channel_url=influencer.youtube_channel_url,
            subscriber_count=influencer.subscriber_count,
            created_at=influencer.created_at,
            updated_at=influencer.updated_at,
            listings=None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error while creating/updating influencer from YouTube URL: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while creating/updating influencer from YouTube URL"
        )

@admin_influencers_router.put(
    "/{influencer_id}", response_model=InfluencerResponse
)
async def update_influencer(
    influencer_id: UUID,
    influencer_update: InfluencerUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing influencer (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to update influencer: {influencer_id}")
    
    try:
        # Get existing influencer
        query = select(Influencer).filter(Influencer.id == influencer_id)
        result = await db.execute(query)
        existing_influencer = result.scalars().first()
        
        if not existing_influencer:
            logger.warning(f"Admin {current_admin.email} attempted to update non-existent influencer: {influencer_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Influencer with ID {influencer_id} not found"
            )
        
        # Sanitize and validate update data
        update_data = influencer_update.model_dump(exclude_unset=True)
        
        # Sanitize string fields
        if "name" in update_data and update_data["name"]:
            update_data["name"] = sanitize_string(update_data["name"])
            if len(update_data["name"].strip()) == 0:
                logger.warning(f"Admin {current_admin.email} attempted to update influencer {influencer_id} with empty name")
                raise HTTPException(
                    status_code=400,
                    detail="Influencer name cannot be empty"
                )
        
        if "bio" in update_data and update_data["bio"]:
            update_data["bio"] = sanitize_string(update_data["bio"])
        
        if "youtube_channel_id" in update_data and update_data["youtube_channel_id"]:
            update_data["youtube_channel_id"] = sanitize_string(update_data["youtube_channel_id"])
        
        if "youtube_channel_name" in update_data and update_data["youtube_channel_name"]:
            update_data["youtube_channel_name"] = sanitize_string(update_data["youtube_channel_name"])
        
        # Validate subscriber count if provided
        if "subscriber_count" in update_data and update_data["subscriber_count"] is not None:
            if update_data["subscriber_count"] < 0:
                logger.warning(f"Admin {current_admin.email} attempted to set negative subscriber count for influencer {influencer_id}")
                raise HTTPException(
                    status_code=400,
                    detail="Subscriber count cannot be negative"
                )
        
        # Check if YouTube channel ID is being updated and if it conflicts
        if "youtube_channel_id" in update_data and update_data["youtube_channel_id"]:
            # Check if another influencer already has this YouTube channel ID
            conflict_query = select(Influencer).filter(
                Influencer.youtube_channel_id == update_data["youtube_channel_id"],
                Influencer.id != influencer_id
            )
            conflict_result = await db.execute(conflict_query)
            conflicting_influencer = conflict_result.scalars().first()
            
            if conflicting_influencer:
                logger.warning(
                    f"Admin {current_admin.email} attempted to update influencer {influencer_id} with duplicate YouTube channel ID: {update_data['youtube_channel_id']}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Another influencer already has YouTube channel ID '{update_data['youtube_channel_id']}'"
                )
        
        # Update fields
        for field, value in update_data.items():
            setattr(existing_influencer, field, value)
        
        await db.commit()
        await db.refresh(existing_influencer)
        
        logger.info(f"Admin {current_admin.email} successfully updated influencer: {existing_influencer.name} (ID: {influencer_id})")
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        # Return response without listings to avoid circular dependencies
        return InfluencerResponse(
            id=existing_influencer.id,
            name=existing_influencer.name,
            slug=existing_influencer.slug,
            bio=existing_influencer.bio,
            avatar_url=existing_influencer.avatar_url,
            banner_url=existing_influencer.banner_url,
            youtube_channel_id=existing_influencer.youtube_channel_id,
            youtube_channel_url=existing_influencer.youtube_channel_url,
            subscriber_count=existing_influencer.subscriber_count,
            created_at=existing_influencer.created_at,
            updated_at=existing_influencer.updated_at,
            listings=None
        )
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Database constraint violation. Please check for duplicate values."
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while updating influencer"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while updating influencer"
        )

@admin_influencers_router.delete(
    "/{influencer_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_influencer(
    influencer_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete an influencer (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to delete influencer: {influencer_id}")
    
    try:
        # Check if influencer exists
        query = select(Influencer).filter(Influencer.id == influencer_id)
        result = await db.execute(query)
        existing_influencer = result.scalars().first()
        
        if not existing_influencer:
            logger.warning(f"Admin {current_admin.email} attempted to delete non-existent influencer: {influencer_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Influencer with ID {influencer_id} not found"
            )
        
        # Log influencer details before deletion for audit purposes
        logger.info(f"Deleting influencer: {existing_influencer.name} (ID: {influencer_id}, YouTube: {existing_influencer.youtube_channel_id})")
        
        # Check if influencer has associated listings
        from app.models.listing import Listing
        listings_query = select(Listing).filter(Listing.influencer_id == influencer_id)
        listings_result = await db.execute(listings_query)
        associated_listings = listings_result.scalars().first()
        
        if associated_listings:
            logger.warning(f"Admin {current_admin.email} attempted to delete influencer {influencer_id} with associated listings")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete influencer with associated listings. Please remove listings first."
            )
        
        # Delete the influencer
        delete_query = delete(Influencer).filter(Influencer.id == influencer_id)
        delete_result = await db.execute(delete_query)
        
        # Check if deletion was successful
        if delete_result.rowcount == 0:
            logger.error(f"Failed to delete influencer {influencer_id} - no rows affected")
            raise HTTPException(
                status_code=500,
                detail="Failed to delete influencer - no rows were affected"
            )
        
        await db.commit()
        logger.info(f"Admin {current_admin.email} successfully deleted influencer: {existing_influencer.name} (ID: {influencer_id})")
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        return None  # 204 No Content
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Cannot delete influencer due to existing references. Please remove associated data first."
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while deleting influencer"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while deleting influencer"
        )
