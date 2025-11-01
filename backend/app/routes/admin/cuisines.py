from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.api_schema.cuisines import CuisineCreate, CuisineUpdate, CuisineResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.cuisine import Cuisine
from app.utils.logging import setup_logger
from app.services.cache import CacheService

admin_cuisines_router = APIRouter()

# Setup logging
logger = setup_logger(__name__)

@admin_cuisines_router.post(
    "/", response_model=CuisineResponse, status_code=status.HTTP_201_CREATED
)
async def create_cuisine(
    cuisine: CuisineCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new cuisine (Admin only)"""
    try:
        # Check if cuisine with same name already exists
        query = select(Cuisine).filter(Cuisine.name == cuisine.name)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()
        
        if existing_cuisine:
            raise HTTPException(
                status_code=400, 
                detail=f"Cuisine with name '{cuisine.name}' already exists"
            )
        
        new_cuisine = Cuisine(**cuisine.model_dump())
        db.add(new_cuisine)
        await db.commit()
        await db.refresh(new_cuisine)
        # Invalidate cached cuisine lists/details to reflect new data
        CacheService("cuisines").invalidate_prefix("")
        return new_cuisine
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        # Handle unique constraint violations on cuisine name
        if "duplicate key value violates unique constraint" in error_msg:
            # Common patterns: index name or unique constraint name
            if "ix_cuisines_name" in error_msg or "cuisines_name_key" in error_msg:
                logger.warning(f"Duplicate cuisine name attempt: {cuisine.name}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A cuisine with this name already exists"
                )
        logger.error(f"Database integrity error creating cuisine: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cuisine data provided"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating cuisine: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create cuisine: {str(e)}"
        )

@admin_cuisines_router.put(
    "/{cuisine_id}", response_model=CuisineResponse
)
async def update_cuisine(
    cuisine_id: UUID,
    cuisine_update: CuisineUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing cuisine (Admin only)"""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()

        if not existing_cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")

        # Check if new name conflicts with existing cuisine
        if cuisine_update.name and cuisine_update.name != existing_cuisine.name:
            name_query = select(Cuisine).filter(Cuisine.name == cuisine_update.name)
            name_result = await db.execute(name_query)
            conflicting_cuisine = name_result.scalars().first()
            
            if conflicting_cuisine:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cuisine with name '{cuisine_update.name}' already exists"
                )

        for field, value in cuisine_update.model_dump(exclude_unset=True).items():
            setattr(existing_cuisine, field, value)

        await db.commit()
        await db.refresh(existing_cuisine)
        # Invalidate cached cuisine lists/details and cuisine-related restaurants
        CacheService("cuisines").invalidate_prefix("")
        return existing_cuisine
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        # Handle unique constraint violations on cuisine name
        if "duplicate key value violates unique constraint" in error_msg:
            if "ix_cuisines_name" in error_msg or "cuisines_name_key" in error_msg:
                logger.warning(f"Duplicate cuisine name update attempt: {cuisine_update.name}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A cuisine with this name already exists"
                )
        logger.error(f"Database integrity error updating cuisine: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cuisine data provided"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update cuisine: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update cuisine: {str(e)}"
        )

@admin_cuisines_router.delete(
    "/{cuisine_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_cuisine(
    cuisine_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a cuisine (Admin only)"""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()

        if not existing_cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")

        await db.execute(delete(Cuisine).filter(Cuisine.id == cuisine_id))
        await db.commit()
        # Invalidate cached cuisine lists/details and cuisine-related restaurants
        CacheService("cuisines").invalidate_prefix("")
        
        return {"message": "Cuisine deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete cuisine: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete cuisine: {str(e)}"
        )