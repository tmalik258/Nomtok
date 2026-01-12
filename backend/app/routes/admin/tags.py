from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.api_schema.tags import TagCreate, TagUpdate, TagResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.tag import Tag
from app.utils.logging import setup_logger
from app.services.cache import CacheService

admin_tags_router = APIRouter()

# Setup logging
logger = setup_logger(__name__)

@admin_tags_router.post(
    "/", response_model=TagResponse, status_code=status.HTTP_201_CREATED
)
async def create_tag(
    tag: TagCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new tag (Admin only)"""
    try:
        # Check if tag with same name already exists
        query = select(Tag).filter(Tag.name == tag.name)
        result = await db.execute(query)
        existing_tag = result.scalars().first()
        
        if existing_tag:
            raise HTTPException(
                status_code=400, 
                detail=f"Tag with name '{tag.name}' already exists"
            )
        
        new_tag = Tag(**tag.model_dump())
        db.add(new_tag)
        await db.commit()
        await db.refresh(new_tag)
        # Invalidate cached tag lists/details to reflect new data
        CacheService("tags").invalidate_prefix("")
        return new_tag
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        # Handle unique constraint violations on tag name
        if "duplicate key value violates unique constraint" in error_msg:
            if "ix_tags_name" in error_msg or "tags_name_key" in error_msg:
                logger.warning(f"Duplicate tag name attempt: {tag.name}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A tag with this name already exists"
                )
        logger.error(f"Database integrity error creating tag: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tag data provided"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating tag: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create tag: {str(e)}"
        )

@admin_tags_router.put(
    "/{tag_id}", response_model=TagResponse
)
async def update_tag(
    tag_id: UUID,
    tag_update: TagUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing tag (Admin only)"""
    try:
        query = select(Tag).filter(Tag.id == tag_id)
        result = await db.execute(query)
        existing_tag = result.scalars().first()

        if not existing_tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Check if new name conflicts with existing tag
        if tag_update.name and tag_update.name != existing_tag.name:
            name_query = select(Tag).filter(Tag.name == tag_update.name)
            name_result = await db.execute(name_query)
            conflicting_tag = name_result.scalars().first()
            
            if conflicting_tag:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag with name '{tag_update.name}' already exists"
                )

        for field, value in tag_update.model_dump(exclude_unset=True).items():
            setattr(existing_tag, field, value)

        await db.commit()
        await db.refresh(existing_tag)
        # Invalidate cached tag lists/details and tag-related restaurants
        CacheService("tags").invalidate_prefix("")
        return existing_tag
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        # Handle unique constraint violations on tag name
        if "duplicate key value violates unique constraint" in error_msg:
            if "ix_tags_name" in error_msg or "tags_name_key" in error_msg:
                logger.warning(f"Duplicate tag name update attempt: {tag_update.name}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A tag with this name already exists"
                )
        logger.error(f"Database integrity error updating tag: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tag data provided"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update tag: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update tag: {str(e)}"
        )

@admin_tags_router.delete(
    "/{tag_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a tag (Admin only)"""
    try:
        query = select(Tag).filter(Tag.id == tag_id)
        result = await db.execute(query)
        existing_tag = result.scalars().first()

        if not existing_tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        await db.execute(delete(Tag).filter(Tag.id == tag_id))
        await db.commit()
        # Invalidate cached tag lists/details and tag-related restaurants
        CacheService("tags").invalidate_prefix("")
        
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete tag: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete tag: {str(e)}"
        )