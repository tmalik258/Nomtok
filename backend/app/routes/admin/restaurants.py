from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID

from app.models import Restaurant, RestaurantTag, RestaurantCuisine, Tag, Cuisine, Listing
from app.database import get_db, get_async_db
from app.dependencies import get_current_admin
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.admin_restaurants import (
    RestaurantCreate, 
    RestaurantUpdate, 
    RestaurantTagUpdate,
    RestaurantCuisineUpdate,
    RestaurantResponse as AdminRestaurantResponse
)
from app.services.google_places_service import fetch_restaurant_details_from_google
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)

router = APIRouter()

@router.post("/", response_model=AdminRestaurantResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    restaurant: RestaurantCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new restaurant by fetching details from Google Places API using restaurant name with optional city and country."""
    try:
        # Check if restaurant already exists by name
        result = await db.execute(
            select(Restaurant).filter(Restaurant.name.ilike(f"%{restaurant.name}%"))
        )
        existing_restaurant_by_name = result.scalars().first()
        
        if existing_restaurant_by_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A restaurant with a similar name '{existing_restaurant_by_name.name}' already exists"
            )
        
        # Fetch restaurant details from Google Places API
        google_details = await fetch_restaurant_details_from_google(
            restaurant_name=restaurant.name,
            city=restaurant.city,
            country=restaurant.country
        )
        
        # Check if restaurant already exists by Google Place ID
        result = await db.execute(
            select(Restaurant).filter(
                Restaurant.google_place_id == google_details["google_place_id"]
            )
        )
        existing_restaurant_by_place_id = result.scalars().first()
        
        if existing_restaurant_by_place_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Restaurant '{google_details['name']}' already exists in the database"
            )
        
        # Create new restaurant with Google API data
        new_restaurant = Restaurant(
            name=google_details["name"],
            address=google_details["address"],
            latitude=google_details["latitude"],
            longitude=google_details["longitude"],
            city=google_details["city"],
            country=google_details["country"],
            google_place_id=google_details["google_place_id"],
            google_rating=google_details["google_rating"],
            business_status=google_details["business_status"],
            photo_url=google_details["photo_url"],
            # Persist enhanced fields
            price_level=google_details.get("price_level"),
            website=google_details.get("website") or google_details.get("website_uri"),
            current_opening_hours=google_details.get("current_opening_hours"),
            secondary_opening_hours=google_details.get("secondary_opening_hours"),
            opening_hours=google_details.get("opening_hours"),
            international_phone_number=google_details.get("international_phone_number"),
            is_active=True
        )
        
        # Add to database
        db.add(new_restaurant)
        await db.commit()
        await db.refresh(new_restaurant)
        
        logger.info(f"Successfully created restaurant: {new_restaurant.name} (ID: {new_restaurant.id})")
        
        return AdminRestaurantResponse(
            message="Restaurant created successfully",
            restaurant_id=new_restaurant.id
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like 409 Conflict) as-is
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        if "duplicate key value violates unique constraint" in error_msg:
            if "ix_restaurants_name" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A restaurant with this name already exists"
                )
            elif "restaurants_google_place_id_key" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This restaurant location is already registered in the system"
                )
        
        logger.error(f"Database integrity error creating restaurant: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid restaurant data provided"
        )
    except ValueError as e:
        await db.rollback()
        logger.error(f"Validation error creating restaurant: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating restaurant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the restaurant. Please try again later."
        )

@router.put("/{restaurant_id}/", response_model=AdminRestaurantResponse)
async def update_restaurant(
    restaurant_id: UUID,
    restaurant_update: RestaurantUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing restaurant."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Update restaurant fields if provided
        update_data = restaurant_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_restaurant, field, value)
        
        # Commit changes
        await db.commit()
        await db.refresh(db_restaurant)
        
        return AdminRestaurantResponse(
            message="Restaurant updated successfully",
            restaurant_id=db_restaurant.id
        )
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        if "duplicate key value violates unique constraint" in error_msg:
            if "ix_restaurants_name" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A restaurant with this name already exists"
                )
            elif "restaurants_google_place_id_key" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This restaurant location is already registered in the system"
                )
        
        logger.error(f"Database integrity error updating restaurant: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid restaurant data provided"
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update restaurant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant: {str(e)}"
        )

@router.delete("/{restaurant_id}/", response_model=AdminRestaurantResponse)
async def delete_restaurant(
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Delete a restaurant."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        # Hard delete - remove from database
        await db.delete(db_restaurant)
        message = "Restaurant permanently deleted"
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message=message,
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete restaurant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete restaurant: {str(e)}"
        )

@router.put("/{restaurant_id}/tags/", response_model=AdminRestaurantResponse)
async def update_restaurant_tags(
    restaurant_id: UUID,
    tag_update: RestaurantTagUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update tags associated with a restaurant."""
    try:
        # Find the restaurant
        restaurant_query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        restaurant_result = await db.execute(restaurant_query)
        db_restaurant = restaurant_result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Verify all tags exist
        for tag_id in tag_update.tag_ids:
            tag_query = select(Tag).filter(Tag.id == tag_id)
            tag_result = await db.execute(tag_query)
            tag = tag_result.scalars().first()
            if not tag:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tag with ID {tag_id} not found"
                )
        
        # Remove existing tags
        delete_stmt = delete(RestaurantTag).where(RestaurantTag.restaurant_id == restaurant_id)
        await db.execute(delete_stmt)
        
        # Add new tags
        for tag_id in tag_update.tag_ids:
            restaurant_tag = RestaurantTag(restaurant_id=restaurant_id, tag_id=tag_id)
            db.add(restaurant_tag)
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant tags updated successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update restaurant tags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant tags: {str(e)}"
        )

@router.put("/{restaurant_id}/cuisines/", response_model=AdminRestaurantResponse)
async def update_restaurant_cuisines(
    restaurant_id: UUID,
    cuisine_update: RestaurantCuisineUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update cuisines associated with a restaurant."""
    try:
        # Find the restaurant
        restaurant_query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        restaurant_result = await db.execute(restaurant_query)
        db_restaurant = restaurant_result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Verify all cuisines exist
        for cuisine_id in cuisine_update.cuisine_ids:
            cuisine_query = select(Cuisine).filter(Cuisine.id == cuisine_id)
            cuisine_result = await db.execute(cuisine_query)
            cuisine = cuisine_result.scalars().first()
            if not cuisine:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cuisine with ID {cuisine_id} not found"
                )
        
        # Remove existing cuisines
        delete_stmt = delete(RestaurantCuisine).where(RestaurantCuisine.restaurant_id == restaurant_id)
        await db.execute(delete_stmt)
        
        # Add new cuisines
        for cuisine_id in cuisine_update.cuisine_ids:
            restaurant_cuisine = RestaurantCuisine(restaurant_id=restaurant_id, cuisine_id=cuisine_id)
            db.add(restaurant_cuisine)
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant cuisines updated successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update restaurant cuisines: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant cuisines: {str(e)}"
        )

@router.put("/{restaurant_id}/restore/", response_model=AdminRestaurantResponse)
async def restore_restaurant(
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Restore a soft-deleted restaurant."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Restore by marking as active
        db_restaurant.is_active = True
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant restored successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to restore restaurant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore restaurant: {str(e)}"
        )
