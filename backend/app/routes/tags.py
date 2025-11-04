from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request

from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag, Restaurant, RestaurantTag, RestaurantCuisine, Listing
from app.database import get_async_db
from app.utils.logging import setup_logger
from app.api_schema.tags import TagResponse, TagCreate, TagUpdate, PaginatedTagsResponse
from app.api_schema.cuisines import CuisineResponse
from app.api_schema.listings import ListingLightResponse
from app.api_schema.restaurants import RestaurantResponse, PaginatedRestaurantsResponse
from app.api_schema.influencers import InfluencerLightResponse
from app.services.cache import CacheService, cache_json_response

logger = setup_logger(__name__)

router = APIRouter()

@router.post(
    "/", response_model=TagResponse, status_code=status.HTTP_201_CREATED
)
async def create_tag(tag: TagCreate, db: AsyncSession = Depends(get_async_db)):
    """Create a new tag."""
    try:
        db_tag = Tag(**tag.model_dump())
        db.add(db_tag)
        await db.commit()
        await db.refresh(db_tag)
        return db_tag
    except Exception as e:
        logger.error(f"Error creating tag: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while creating tag")


@router.get("/", response_model=PaginatedTagsResponse)
async def get_tags(
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    city: str | None = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get tags with filters for name or city."""
    cache = CacheService("tags")
    key = f"list:name={name}|city={city}|skip={skip}|limit={limit}"

    async def compute():
        try:
            # Build the base query
            query = select(Tag)
            count_query = select(func.count(Tag.id))
            
            # Apply filters
            if name:
                query = query.filter(Tag.name.ilike(f"%{name}%"))
                count_query = count_query.filter(Tag.name.ilike(f"%{name}%"))
            if city:
                query = query.join(Tag.restaurant_tags).join(RestaurantTag.restaurant).filter(Restaurant.city.ilike(f"%{city}%"))
                count_query = count_query.join(Tag.restaurant_tags).join(RestaurantTag.restaurant).filter(Restaurant.city.ilike(f"%{city}%"))
            
            # Get total count
            total_result = await db.execute(count_query)
            total_count = total_result.scalar()
            
            # Get paginated results
            result = await db.execute(query.offset(skip).limit(limit))
            tags = result.scalars().all()
            
            return PaginatedTagsResponse(tags=tags, total=total_count)
        except Exception as e:
            logger.error(f"Error fetching tags: {e}")
            raise HTTPException(status_code=500, detail="Internal server error while fetching tags")

    # Cache-Control for lists: allow revalidation and CDNs
    cache_control = "public, max-age=300, stale-while-revalidate=60"
    return await cache_json_response(request, cache, key, ttl_seconds=300, compute_func=compute, cache_control=cache_control)


@router.get("/{tag_id}/", response_model=TagResponse)
async def get_tag(tag_id: UUID, request: Request, db: AsyncSession = Depends(get_async_db)):
    """Get a single tag by ID."""
    cache = CacheService("tags")
    key = f"detail:{tag_id}"

    async def compute():
        try:
            result = await db.execute(select(Tag).filter(Tag.id == tag_id))
            tag = result.scalars().first()
            if not tag:
                raise HTTPException(status_code=404, detail="Tag not found")
            return tag
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching tag {tag_id}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error while fetching tag")

    cache_control = "public, max-age=3600"
    return await cache_json_response(request, cache, key, ttl_seconds=3600, compute_func=compute, cache_control=cache_control)


@router.put("/{tag_id}/", response_model=TagResponse)
async def update_tag(tag_id: UUID, tag: TagUpdate, db: AsyncSession = Depends(get_async_db)):
    """Update a tag by ID."""
    try:
        result = await db.execute(select(Tag).filter(Tag.id == tag_id))
        db_tag = result.scalars().first()
        if not db_tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        for key, value in tag.model_dump(exclude_unset=True).items():
            setattr(db_tag, key, value)
        await db.commit()
        await db.refresh(db_tag)
        return db_tag
    except Exception as e:
        logger.error(f"Error updating tag {tag_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while updating tag")


@router.delete("/{tag_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: UUID, db: AsyncSession = Depends(get_async_db)):
    """Delete a tag by ID."""
    try:
        result = await db.execute(select(Tag).filter(Tag.id == tag_id))
        tag = result.scalars().first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        await db.delete(tag)
        await db.commit()
        return {"message": "Tag deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting tag {tag_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting tag")


@router.get("/{tag_id}/restaurants/", response_model=PaginatedRestaurantsResponse)
async def get_restaurants_by_tag(
    tag_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 10,
    include_listings: bool = Query(False, description="Include listings with restaurants"),
):
    """Get all restaurants associated with a specific tag, with caching."""
    cache = CacheService("tags")
    key = f"restaurants:{tag_id}|skip={skip}|limit={limit}|listings={include_listings}"

    async def compute():
        # First check if tag exists
        tag_result = await db.execute(select(Tag).filter(Tag.id == tag_id))
        tag = tag_result.scalars().first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Count query for total restaurants with this tag
        count_query = select(func.count(Restaurant.id)).join(
            RestaurantTag, Restaurant.id == RestaurantTag.restaurant_id
        ).filter(
            RestaurantTag.tag_id == tag_id,
            Restaurant.is_active == True
        )
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Data query with eager loading
        query = select(Restaurant).join(
            RestaurantTag, Restaurant.id == RestaurantTag.restaurant_id
        ).filter(
            RestaurantTag.tag_id == tag_id,
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
                slug=restaurant.slug,
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
                    influencer_response = InfluencerLightResponse(
                        id=listing.influencer.id,
                        slug=listing.influencer.slug,
                        name=listing.influencer.name,
                        bio=listing.influencer.bio,
                        avatar_url=listing.influencer.avatar_url,
                        banner_url=listing.influencer.banner_url,
                        youtube_channel_id=listing.influencer.youtube_channel_id,
                        youtube_channel_url=listing.influencer.youtube_channel_url,
                        subscriber_count=listing.influencer.subscriber_count,
                        created_at=listing.influencer.created_at,
                        updated_at=listing.influencer.updated_at,
                    )

                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant_id=listing.restaurant.id,
                        influencer=influencer_response,
                        video=listing.video.id,
                        visit_date=listing.visit_date,
                        review_sections=listing.review_sections,
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

    cache_control = "public, max-age=300, stale-while-revalidate=60"
    return await cache_json_response(request, cache, key, ttl_seconds=300, compute_func=compute, cache_control=cache_control)
            

@router.delete("/{tag_id}/restaurants/{restaurant_id}/")
async def remove_restaurant_from_tag(
    tag_id: UUID,
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """Remove a restaurant from a specific tag."""
    try:
        # Check if tag exists
        tag_result = await db.execute(select(Tag).filter(Tag.id == tag_id))
        tag = tag_result.scalars().first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Check if restaurant exists
        restaurant_result = await db.execute(select(Restaurant).filter(Restaurant.id == restaurant_id))
        restaurant = restaurant_result.scalars().first()
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Check if the restaurant-tag association exists
        restaurant_tag_result = await db.execute(
            select(RestaurantTag).filter(
                RestaurantTag.tag_id == tag_id,
                RestaurantTag.restaurant_id == restaurant_id
            )
        )
        restaurant_tag = restaurant_tag_result.scalars().first()
        
        if not restaurant_tag:
            raise HTTPException(status_code=404, detail="Restaurant is not associated with this tag")
        
        # Remove the association
        await db.delete(restaurant_tag)
        await db.commit()
        
        logger.info(f"Successfully removed restaurant {restaurant_id} from tag {tag_id}")
        return {"message": "Restaurant removed from tag successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing restaurant {restaurant_id} from tag {tag_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to remove restaurant from tag. Please try again later.")