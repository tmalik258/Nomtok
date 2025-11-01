from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy import func, select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantTag, RestaurantCuisine, Listing, Tag, Cuisine, Influencer
from app.database import get_async_db
from app.utils.logging import setup_logger
from app.api_schema.tags import TagResponse
from app.api_schema.cuisines import CuisineResponse
from app.api_schema.videos import VideoResponse
from app.api_schema.listings import ListingLightResponse
from app.api_schema.influencers import InfluencerResponse, InfluencerLightResponse
from app.api_schema.restaurants import RestaurantResponse, OptimizedFeaturedResponse, CityRestaurantsResponse, PaginatedRestaurantsResponse, rebuild_models
from app.services.google_places_service import refetch_photo_by_place_id

# Rebuild models to resolve forward references
rebuild_models()

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/", response_model=PaginatedRestaurantsResponse)
async def get_restaurants(
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    id: str | None = None,
    city: str | None = None,
    country: str | None = None,
    google_place_id: str | None = None,
    tag: str | None = Query(None, description="Filter by tag name"),
    cuisine: str | None = Query(None, description="Filter by cuisine name"),
    sort_by: str | None = Query("name", description="Sort by: name, rating, city, updated"),
    skip: int = 0,
    limit: int = 10,
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurants"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details (description, transcription)"),
    slug: str | None = None,
    influencer_id: Optional[str] = Query(None, description="Filter restaurants reviewed by influencer (UUID or slug)")
):
    """Get restaurants with filters for name, ID, city, country, Google Place ID, tags, and cuisines."""
    try:
        # Base query for filtering
        base_filter = Restaurant.is_active == True
        
        # Apply filters
        filters = [base_filter]
        if name:
            filters.append(Restaurant.name.ilike(f"%{name}%"))
        if id:
            filters.append(Restaurant.id == id)
        if city:
            filters.append(Restaurant.city.ilike(f"%{city}%"))
        if country:
            filters.append(Restaurant.country == country)
        if slug:
            filters.append(Restaurant.slug.ilike(f"%{slug}%"))
        if google_place_id:
            filters.append(Restaurant.google_place_id == google_place_id)
        
        # Tag filtering - join with restaurant_tags and tags table
        if tag:
            filters.append(
                Restaurant.restaurant_tags.any(
                    RestaurantTag.tag.has(Tag.name.ilike(f"%{tag}%"))
                )
            )
        
        # Cuisine filtering - join with restaurant_cuisines and cuisines table
        if cuisine:
            filters.append(
                Restaurant.restaurant_cuisines.any(
                    RestaurantCuisine.cuisine.has(Cuisine.name.ilike(f"%{cuisine}%"))
                )
            )
        
        if influencer_id:
            try:
                influencer_uuid = UUID(influencer_id)
                filters.append(
                    Restaurant.listings.any(Listing.influencer_id == influencer_uuid)
                )
            except ValueError:
                # If not UUID, try to find by slug
                filters.append(
                    Restaurant.listings.any(Listing.influencer.has(Influencer.slug == influencer_id))
                )
        
        # Count query for total
        count_query = select(func.count(Restaurant.id)).filter(*filters)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()
        
        # Data query with eager loading
        query = select(Restaurant).filter(*filters)
        query = query.options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine)
        )
        
        # Apply sorting
        if sort_by == "name":
            query = query.order_by(Restaurant.name.asc())
        elif sort_by == "rating":
            query = query.order_by(Restaurant.google_rating.desc().nulls_last())
        elif sort_by == "city":
            query = query.order_by(Restaurant.city.asc().nulls_last())
        elif sort_by == "updated":
            query = query.order_by(Restaurant.updated_at.desc())
        else:
            # Default to name sorting
            query = query.order_by(Restaurant.updated_at.asc())
        
        # Add listings if requested
        if include_listings:
            query = query.options(
                joinedload(Restaurant.listings)
                .joinedload(Listing.video),
                joinedload(Restaurant.listings)
                .joinedload(Listing.influencer)
            )

        result = await db.execute(query.offset(skip).limit(limit))
        restaurants = result.unique().scalars().all()

        # Convert to response format
        result_list = []
        for restaurant in restaurants:
            # Process tags safely - access within the session context
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

            # Process cuisines safely - access within the session context
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

            # Create restaurant data without listings first
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
                    # Create InfluencerResponse manually to avoid lazy loading issues
                    influencer_response = InfluencerResponse(
                        id=listing.influencer.id,
                        name=listing.influencer.name,
                        slug=listing.influencer.slug,
                        bio=listing.influencer.bio,
                        avatar_url=listing.influencer.avatar_url,
                        banner_url=listing.influencer.banner_url,
                        # region=listing.influencer.region,
                        # country=listing.influencer.country,
                        youtube_channel_id=listing.influencer.youtube_channel_id,
                        youtube_channel_url=listing.influencer.youtube_channel_url,
                        subscriber_count=listing.influencer.subscriber_count,
                        created_at=listing.influencer.created_at,
                        updated_at=listing.influencer.updated_at,
                        listings=None  # Explicitly set to None to avoid lazy loading
                    )
                    
                    if include_video_details:
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            video=VideoResponse.model_validate(listing.video),
                            influencer=influencer_response,
                            visit_date=listing.visit_date,
                            timestamp=listing.timestamp,
                            approved=listing.approved,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                    else:
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            influencer=influencer_response,
                            video=listing.video.id,
                            visit_date=listing.visit_date,
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

    except Exception as e:
        logger.error(f"Error fetching restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants. Please try again later.")

@router.get("/popular-cities/", response_model=List[str])
async def get_popular_cities(db: AsyncSession = Depends(get_async_db)):
    """Get the top 5 cities with the most restaurant listings."""
    try:
        query = select(Restaurant.city).filter(
            Restaurant.is_active == True,
            Restaurant.city.isnot(None)
        ).group_by(Restaurant.city).order_by(func.count(Restaurant.city).desc()).limit(5)
        result = await db.execute(query)
        popular_cities = result.fetchall()
        return [city[0] for city in popular_cities]
    except Exception as e:
        # Log the error and return default cities if database query fails
        logger.error(f"Error fetching popular cities: {e}")
        return []

@router.get("/countries/")
async def get_countries(db: AsyncSession = Depends(get_async_db), influencer: Optional[str] = None):
    """Get unique countries from restaurants, optionally filtered by influencer (UUID or slug)."""
    try:
        query = select(Restaurant.country).filter(
            Restaurant.is_active == True,
            Restaurant.country.isnot(None)
        )
        
        # If influencer_id is provided, filter by restaurants reviewed by that influencer
        if influencer:
            try:
                influencer_uuid = UUID(influencer)
                query = query.join(Listing, Restaurant.id == Listing.restaurant_id).filter(
                    Listing.influencer_id == influencer_uuid
                )
            except ValueError:
                # If not a UUID, assume it's a slug
                query = query.join(Listing, Restaurant.id == Listing.restaurant_id).join(Influencer, Listing.influencer_id == Influencer.id).filter(
                    Influencer.slug == influencer
                )
        
        query = query.distinct().order_by(Restaurant.country)
        result = await db.execute(query)
        countries_result = result.fetchall()
        
        countries = [{
            "code": country[0],
            "name": country[0]
        } for country in countries_result]
        
        return {"country": countries}
    except Exception as e:
        logger.error(f"Error fetching countries from restaurants: {e}")
        return {"country": []}

@router.get("/featured-optimized/", response_model=OptimizedFeaturedResponse)
async def get_featured_optimized(db: AsyncSession = Depends(get_async_db)):
    """Get top 5 cities with 3 latest restaurants each in a single optimized call.
    
    Enhanced implementation that:
    - Retrieves complete restaurant information including all fields and associated tags
    - Includes optimized listings with influencer details only (excludes restaurant and video data)
    - Maintains data integrity while significantly improving API efficiency and performance
    """
    try:
        # Get top 5 cities with most restaurants in a single query
        popular_cities_query = select(
            Restaurant.city
        ).filter(
            Restaurant.is_active == True,
            Restaurant.city.isnot(None)
        ).group_by(Restaurant.city).order_by(
            func.count(Restaurant.city).desc()
        ).limit(5)
        
        result = await db.execute(popular_cities_query)
        popular_cities = result.fetchall()
        
        if not popular_cities:
            return OptimizedFeaturedResponse(cities=[])
        
        city_names = [city[0] for city in popular_cities]
        
        # Single optimized query to get all restaurants for all cities with proper joins
        # Using window function to get top 3 restaurants per city efficiently
        restaurants_query = select(Restaurant).options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Restaurant.listings).joinedload(Listing.influencer)
        ).filter(
            Restaurant.city.in_(city_names),
            Restaurant.is_active == True
        ).order_by(Restaurant.city, Restaurant.created_at.desc())
        
        result = await db.execute(restaurants_query)
        all_restaurants = result.scalars().unique().all()
        
        # Group restaurants by city and limit to 3 per city
        city_restaurant_map = {}
        for restaurant in all_restaurants:
            city = restaurant.city
            if city not in city_restaurant_map:
                city_restaurant_map[city] = []
            if len(city_restaurant_map[city]) < 3:
                city_restaurant_map[city].append(restaurant)
        
        # Build response with optimized data structure
        city_restaurants = []
        for city in city_names:
            if city not in city_restaurant_map:
                continue
                
            restaurants = city_restaurant_map[city]
            restaurant_responses = []
            
            for restaurant in restaurants:
                # Convert SQLAlchemy object to dictionary for clean serialization
                restaurant_dict = {
                    'id': restaurant.id,
                    'name': restaurant.name,
                    'slug': restaurant.slug,
                    'address': restaurant.address,
                    'latitude': restaurant.latitude,
                    'longitude': restaurant.longitude,
                    'city': restaurant.city,
                    'country': restaurant.country,
                    'google_place_id': restaurant.google_place_id,
                    'google_rating': restaurant.google_rating,
                    'business_status': restaurant.business_status,
                    'photo_url': restaurant.photo_url,
                    'is_active': restaurant.is_active,
                    'created_at': restaurant.created_at,
                    'updated_at': restaurant.updated_at
                }
                
                # Process optimized listings (exclude restaurant and video data)
                listings_data = []
                for listing in restaurant.listings:
                    if listing.influencer:
                        # Create optimized listing with only essential data
                        # Manually construct InfluencerResponse to avoid lazy loading issues
                        influencer_response = InfluencerResponse(
                            id=listing.influencer.id,
                            name=listing.influencer.name,
                            slug=listing.influencer.slug,
                            bio=listing.influencer.bio,
                            avatar_url=listing.influencer.avatar_url,
                            banner_url=listing.influencer.banner_url,
                            # region=listing.influencer.region,
                            # country=listing.influencer.country,
                            youtube_channel_id=listing.influencer.youtube_channel_id,
                            youtube_channel_url=listing.influencer.youtube_channel_url,
                            subscriber_count=listing.influencer.subscriber_count,
                            created_at=listing.influencer.created_at,
                            updated_at=listing.influencer.updated_at,
                            listings=None  # Explicitly set to None to avoid lazy loading
                        )
                        
                        listing_optimized = ListingLightResponse(
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
                        listings_data.append(listing_optimized)

                restaurant_dict['listings'] = listings_data
                
                # Process tags with complete data integrity
                tags_data = []
                if restaurant.restaurant_tags:
                    for restaurant_tag in restaurant.restaurant_tags:
                        if restaurant_tag.tag:
                            tags_data.append(TagResponse.model_validate(restaurant_tag.tag))
                restaurant_dict['tags'] = tags_data if tags_data else None
                
                # Process cuisines with complete data integrity
                cuisines_data = []
                if restaurant.restaurant_cuisines:
                    for restaurant_cuisine in restaurant.restaurant_cuisines:
                        if restaurant_cuisine.cuisine:
                            cuisines_data.append(CuisineResponse.model_validate(restaurant_cuisine.cuisine))
                restaurant_dict['cuisines'] = cuisines_data if cuisines_data else None
                
                # Create RestaurantResponse with all fields maintained
                restaurant_response = RestaurantResponse.model_validate(restaurant_dict)
                restaurant_responses.append(restaurant_response)
            
            if restaurant_responses:  # Only add cities that have restaurants
                city_restaurants.append(CityRestaurantsResponse(
                    city=city,
                    restaurants=restaurant_responses
                ))
        
        return OptimizedFeaturedResponse(cities=city_restaurants)
    except Exception as e:
        logger.exception("Error fetching featured optimized data")
        raise HTTPException(status_code=500, detail="Failed to fetch featured data. Please try again later.")

@router.get("/{restaurant}/", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant: str, 
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurant"),
    include_video_details: Optional[bool] = Query(True, description="Include full video details and not just video_id")
):
    """Get a single restaurant by ID or slug."""
    try:
        # Base query with tags and cuisines
        query = select(Restaurant).options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine)
        )
        
        # Add listings if requested
        if include_listings:
            query = query.options(
                joinedload(Restaurant.listings)
                .joinedload(Listing.video),
                joinedload(Restaurant.listings)
                .joinedload(Listing.influencer)
            )
        
        # Choose filter by UUID or slug
        is_uuid = True
        try:
            UUID(str(restaurant))
        except Exception:
            is_uuid = False
        
        if is_uuid:
            query = query.filter(Restaurant.id == restaurant, Restaurant.is_active == True)
        else:
            query = query.filter(Restaurant.slug == restaurant, Restaurant.is_active == True)
        result = await db.execute(query)
        restaurant_obj = result.scalars().first()

        if not restaurant_obj:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Convert to response format - manually construct to avoid validation issues
        restaurant_data = RestaurantResponse(
            id=restaurant_obj.id,
            name=restaurant_obj.name,
            slug=restaurant_obj.slug,
            address=restaurant_obj.address,
            latitude=restaurant_obj.latitude,
            longitude=restaurant_obj.longitude,
            city=restaurant_obj.city,
            country=restaurant_obj.country,
            google_place_id=restaurant_obj.google_place_id,
            google_rating=restaurant_obj.google_rating,
            business_status=restaurant_obj.business_status,
            photo_url=restaurant_obj.photo_url,
            is_active=restaurant_obj.is_active,
            created_at=restaurant_obj.created_at,
            updated_at=restaurant_obj.updated_at,
            tags=[TagResponse.model_validate(rt.tag) for rt in restaurant_obj.restaurant_tags] if restaurant_obj.restaurant_tags else None,
            cuisines=[CuisineResponse.model_validate(rc.cuisine) for rc in restaurant_obj.restaurant_cuisines] if restaurant_obj.restaurant_cuisines else None,
            listings=None  # Will be set separately if needed
        )
        
        if include_listings and restaurant_obj.listings:
            listings_data = []
            for listing in restaurant_obj.listings:
                # Create InfluencerResponse manually to avoid lazy loading issues
                influencer_response = InfluencerResponse(
                    id=listing.influencer.id,
                    name=listing.influencer.name,
                    slug=listing.influencer.slug,
                    bio=listing.influencer.bio,
                    avatar_url=listing.influencer.avatar_url,
                    banner_url=listing.influencer.banner_url,
                    # region=listing.influencer.region,
                    # country=listing.influencer.country,
                    youtube_channel_id=listing.influencer.youtube_channel_id,
                    youtube_channel_url=listing.influencer.youtube_channel_url,
                    subscriber_count=listing.influencer.subscriber_count,
                    created_at=listing.influencer.created_at,
                    updated_at=listing.influencer.updated_at,
                    listings=None  # Explicitly set to None to avoid lazy loading
                )
                
                if include_video_details:
                    # Manually construct VideoResponse to avoid validation issues
                    video_influencer_response = None
                    if listing.video.influencer:
                        video_influencer_response = InfluencerLightResponse(
                            id=listing.video.influencer.id,
                            name=listing.video.influencer.name,
                            slug=listing.video.influencer.slug,
                            bio=listing.video.influencer.bio,
                            avatar_url=listing.video.influencer.avatar_url,
                            banner_url=listing.video.influencer.banner_url,
                            youtube_channel_id=listing.video.influencer.youtube_channel_id,
                            youtube_channel_url=listing.video.influencer.youtube_channel_url,
                            subscriber_count=listing.video.influencer.subscriber_count,
                            created_at=listing.video.influencer.created_at,
                            updated_at=listing.video.influencer.updated_at
                        )
                    
                    video_response = VideoResponse(
                        id=listing.video.id,
                        influencer=video_influencer_response,
                        youtube_video_id=listing.video.youtube_video_id,
                        title=listing.video.title,
                        slug=listing.video.slug,
                        description=listing.video.description,
                        video_url=listing.video.video_url,
                        published_at=listing.video.published_at,
                        transcription=listing.video.transcription,
                        status=listing.video.status,
                        error_message=listing.video.error_message,
                        created_at=listing.video.created_at,
                        updated_at=listing.video.updated_at
                    )
                    
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=listing.restaurant.id,
                        video=video_response,
                        influencer=influencer_response,
                        visit_date=listing.visit_date,
                        timestamp=listing.timestamp,
                        approved=listing.approved,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                else:
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=listing.restaurant.id,
                        video=listing.video.id,
                        influencer=influencer_response,
                        visit_date=listing.visit_date,
                        timestamp=listing.timestamp,
                        approved=listing.approved,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                listings_data.append(listing_response)
            restaurant_data.listings = listings_data
        
        return restaurant_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching restaurant")

@router.post("/{restaurant}/refetch-photo/")
async def refetch_restaurant_photo(
    restaurant: str,
    db: AsyncSession = Depends(get_async_db),
):
    """Refetch restaurant photo via Google Place ID and update photo_url.
    Accepts either UUID or slug in the path parameter."""
    try:
        # Determine if path param is UUID
        is_uuid = True
        try:
            UUID(str(restaurant))
        except Exception:
            is_uuid = False

        # Load the restaurant by ID or slug
        if is_uuid:
            result = await db.execute(select(Restaurant).filter(Restaurant.id == restaurant))
        else:
            result = await db.execute(select(Restaurant).filter(Restaurant.slug == restaurant))
        restaurant_obj = result.scalars().first()
        if not restaurant_obj:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        if not restaurant_obj.google_place_id:
            raise HTTPException(status_code=400, detail="Restaurant missing google_place_id")

        final_url = await refetch_photo_by_place_id(restaurant_obj.google_place_id)
        if not final_url:
            raise HTTPException(status_code=502, detail="Failed to refetch photo from Google")

        restaurant_obj.photo_url = final_url
        await db.commit()
        await db.refresh(restaurant_obj)

        return {"photo_url": restaurant_obj.photo_url}
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error refetching photo for restaurant {restaurant}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while refetching photo")
