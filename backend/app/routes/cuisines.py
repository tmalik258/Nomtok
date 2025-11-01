from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request

from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Cuisine, Restaurant, RestaurantCuisine, RestaurantTag, Listing
from app.database import get_async_db
from app.api_schema.cuisines import CuisineResponse, CuisineCreate, CuisineUpdate
from app.api_schema.restaurants import RestaurantResponse, PaginatedRestaurantsResponse
from app.api_schema.tags import TagResponse
from app.api_schema.listings import ListingLightResponse
from app.api_schema.influencers import InfluencerResponse
from app.utils.logging import setup_logger
from app.services.cache import CacheService, cache_json_response

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/", response_model=List[CuisineResponse])
async def get_cuisines(
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    id: str | None = None,
    city: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """Get cuisines with filters for name or ID."""
    cache = CacheService("cuisines")
    key = f"list:name={name}|id={id}|city={city}|skip={skip}|limit={limit}"

    async def compute():
        try:
            query = select(Cuisine)
            if name:
                query = query.filter(Cuisine.name.ilike(f"%{name}%"))
            if id:
                query = query.filter(Cuisine.id == id)
            if city:
                query = query.join(Cuisine.restaurant_cuisines).join(RestaurantCuisine.restaurant).filter(Restaurant.city.ilike(f"%{city}%"))
            
            # Distinct to avoid duplicate cuisines
            query = query.distinct()

            # Order by name to ensure consistent ordering
            query = query.order_by(Cuisine.name)

            # Apply pagination
            query = query.offset(skip).limit(limit)

            result = await db.execute(query)
            cuisines = result.scalars().all()
            return cuisines
        except Exception as e:
            logger.error(f"Error fetching cuisines: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while fetching cuisines")

    cache_control = "public, max-age=300, stale-while-revalidate=60"
    return await cache_json_response(request, cache, key, ttl_seconds=300, compute_func=compute, cache_control=cache_control)

@router.post("/", response_model=CuisineResponse, status_code=status.HTTP_201_CREATED)
async def create_cuisine(cuisine: CuisineCreate, db: AsyncSession = Depends(get_async_db)):
    """Create a new cuisine."""
    try:
        db_cuisine = Cuisine(name=cuisine.name)
        db.add(db_cuisine)
        await db.commit()
        await db.refresh(db_cuisine)
        return db_cuisine
    except Exception as e:
        logger.error(f"Error creating cuisine: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while creating cuisine")

@router.put("/{cuisine_id}/", response_model=CuisineResponse)
async def update_cuisine(cuisine_id: UUID, cuisine: CuisineUpdate, db: AsyncSession = Depends(get_async_db)):
    """Update an existing cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        db_cuisine = result.scalar_one_or_none()
        if not db_cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
        db_cuisine.name = cuisine.name
        await db.commit()
        await db.refresh(db_cuisine)
        return db_cuisine
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while updating cuisine")

@router.delete("/{cuisine_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cuisine(cuisine_id: UUID, db: AsyncSession = Depends(get_async_db)):
    """Delete a cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        db_cuisine = result.scalar_one_or_none()
        if not db_cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
        await db.delete(db_cuisine)
        await db.commit()
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while deleting cuisine")

@router.get("/{cuisine_id}/", response_model=CuisineResponse)
async def get_cuisine(cuisine_id: UUID, request: Request, db: AsyncSession = Depends(get_async_db)):
    """Get a single cuisine by ID."""
    cache = CacheService("cuisines")
    key = f"detail:{cuisine_id}"

    async def compute():
        try:
            query = select(Cuisine).filter(Cuisine.id == cuisine_id)
            result = await db.execute(query)
            cuisine = result.scalar_one_or_none()
            if not cuisine:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
            return cuisine
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching cuisine {cuisine_id}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while fetching cuisine")

    cache_control = "public, max-age=3600"
    return await cache_json_response(request, cache, key, ttl_seconds=3600, compute_func=compute, cache_control=cache_control)


@router.get("/{cuisine_id}/restaurants/", response_model=PaginatedRestaurantsResponse)
async def get_restaurants_by_cuisine(
    cuisine_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 10,
    include_listings: bool = Query(False, description="Include listings with restaurants"),
):
    """Get all restaurants associated with a specific cuisine."""

        
    cache = CacheService("cuisines")
    key = f"restaurants:{cuisine_id}|skip={skip}|limit={limit}|listings={include_listings}"

    async def compute():
        try:
            # First check if cuisine exists
            cuisine_result = await db.execute(select(Cuisine).filter(Cuisine.id == cuisine_id))
            cuisine = cuisine_result.scalars().first()
            if not cuisine:
                raise HTTPException(status_code=404, detail="Cuisine not found")
            
            # Count query for total restaurants with this cuisine
            count_query = select(func.count(Restaurant.id)).join(
                RestaurantCuisine, Restaurant.id == RestaurantCuisine.restaurant_id
            ).filter(
                RestaurantCuisine.cuisine_id == cuisine_id,
                Restaurant.is_active == True
            )
            count_result = await db.execute(count_query)
            total_count = count_result.scalar()
            
            # Data query with eager loading
            query = select(Restaurant).join(
                RestaurantCuisine, Restaurant.id == RestaurantCuisine.restaurant_id
            ).filter(
                RestaurantCuisine.cuisine_id == cuisine_id,
                Restaurant.is_active == True
            ).options(
                joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
                joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine)
            )
            
            # Add listings if requested
            if include_listings:
                query = query.options(
                    joinedload(Restaurant.listings).joinedload(Listing.video),
                    joinedload(Restaurant.listings).joinedload(Listing.influencer)
                )
            
            result = await db.execute(query.offset(skip).limit(limit))
            restaurants = result.unique().scalars().all()
            
            # Convert to response format
            result_list = []
            for restaurant in restaurants:
                # Process tags safely
                tags = None
                try:
                    if restaurant.restaurant_tags:
                        tags = []
                        for restaurant_tag in restaurant.restaurant_tags:
                            tag_data = {
                                'id': restaurant_tag.tag.id,
                                'name': restaurant_tag.tag.name,
                                'created_at': restaurant_tag.tag.created_at,
                            }
                            tags.append(TagResponse(**tag_data))
                except Exception as tag_error:
                    logger.warning(f"Error processing tags for restaurant {restaurant.id}: {tag_error}")
                    tags = None
                
                # Process cuisines safely
                cuisines = None
                try:
                    if restaurant.restaurant_cuisines:
                        cuisines = []
                        for restaurant_cuisine in restaurant.restaurant_cuisines:
                            cuisine_data = {
                                'id': restaurant_cuisine.cuisine.id,
                                'name': restaurant_cuisine.cuisine.name,
                                'created_at': restaurant_cuisine.cuisine.created_at,
                            }
                            cuisines.append(CuisineResponse(**cuisine_data))
                except Exception as cuisine_error:
                    logger.warning(f"Error processing cuisines for restaurant {restaurant.id}: {cuisine_error}")
                    cuisines = None
                
                # Create restaurant data
                restaurant_data = RestaurantResponse(
                    id=restaurant.id,
                    name=restaurant.name,
                    address=restaurant.address,
                    latitude=restaurant.latitude,
                    longitude=restaurant.longitude,
                    city=restaurant.city,
                    country=restaurant.country,
                    google_place_id=restaurant.google_place_id,
                    google_rating=restaurant.google_rating,
                    business_status=restaurant.business_status,
                    photo_url=restaurant.photo_url,
                    is_active=restaurant.is_active,
                    created_at=restaurant.created_at,
                    updated_at=restaurant.updated_at,
                    tags=tags,
                    cuisines=cuisines,
                    listings=None
                )
                
                if include_listings and restaurant.listings:
                    listings_data = []
                    for listing in restaurant.listings:
                        # Create InfluencerResponse manually to avoid lazy loading issues
                        influencer_response = InfluencerResponse(
                            id=listing.influencer.id,
                            name=listing.influencer.name,
                            bio=listing.influencer.bio,
                            avatar_url=listing.influencer.avatar_url,
                            banner_url=listing.influencer.banner_url,
                            youtube_channel_id=listing.influencer.youtube_channel_id,
                            youtube_channel_url=listing.influencer.youtube_channel_url,
                            subscriber_count=listing.influencer.subscriber_count,
                            created_at=listing.influencer.created_at,
                            updated_at=listing.influencer.updated_at,
                            listings=None
                        )
                        
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            influencer=influencer_response,
                            visit_date=listing.visit_date,
                            confidence_score=listing.confidence_score,
                            timestamp=listing.timestamp,
                            approved=listing.approved,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                        listings_data.append(listing_response)
                    restaurant_data.listings = listings_data
                
                result_list.append(restaurant_data)
            
            return PaginatedRestaurantsResponse(
                restaurants=result_list,
                total=total_count
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching restaurants for cuisine {cuisine_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch restaurants for cuisine. Please try again later.")

    cache_control = "public, max-age=300, stale-while-revalidate=60"
    return await cache_json_response(request, cache, key, ttl_seconds=300, compute_func=compute, cache_control=cache_control)


@router.delete("/{cuisine_id}/restaurants/{restaurant_id}/")
async def remove_restaurant_from_cuisine(
    cuisine_id: UUID,
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Remove a restaurant from a specific cuisine."""
    try:
        # Check if cuisine exists
        cuisine_result = await db.execute(select(Cuisine).filter(Cuisine.id == cuisine_id))
        cuisine = cuisine_result.scalars().first()
        if not cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")
        
        # Check if restaurant exists
        restaurant_result = await db.execute(select(Restaurant).filter(Restaurant.id == restaurant_id))
        restaurant = restaurant_result.scalars().first()
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Check if the restaurant-cuisine association exists
        restaurant_cuisine_result = await db.execute(
            select(RestaurantCuisine).filter(
                RestaurantCuisine.cuisine_id == cuisine_id,
                RestaurantCuisine.restaurant_id == restaurant_id
            )
        )
        restaurant_cuisine = restaurant_cuisine_result.scalars().first()
        
        if not restaurant_cuisine:
            raise HTTPException(status_code=404, detail="Restaurant is not associated with this cuisine")
        
        # Remove the association
        await db.delete(restaurant_cuisine)
        await db.commit()
        
        logger.info(f"Successfully removed restaurant {restaurant_id} from cuisine {cuisine_id}")
        return {"message": "Restaurant removed from cuisine successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing restaurant {restaurant_id} from cuisine {cuisine_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to remove restaurant from cuisine. Please try again later.")