"""Utility functions for optimized restaurant queries."""
from typing import Dict, List, Tuple, Optional, Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantCuisine, Listing, Cuisine, Influencer
from app.api_schema.cuisines import CuisineResponse
from app.api_schema.listings import ListingLightResponse
from app.api_schema.influencers import InfluencerLightResponse
from app.api_schema.restaurants import RestaurantResponse


async def get_top_cities_with_approved_listings(
    db: AsyncSession, limit: int
) -> List[str]:
    """Get top cities with most restaurants that have approved listings."""
    query = select(
        Restaurant.city
    ).join(
        Listing, Restaurant.id == Listing.restaurant_id
    ).filter(
        Restaurant.is_active == True,
        Restaurant.city.isnot(None),
        Listing.approved == True
    ).group_by(Restaurant.city).order_by(
        func.count(Restaurant.city).desc()
    ).limit(limit)
    
    result = await db.execute(query)
    popular_cities = result.fetchall()
    return [city[0] for city in popular_cities]


async def get_restaurant_ids_by_cities(
    db: AsyncSession, city_names: List[str]
) -> Dict[str, List[UUID]]:
    """Get restaurant IDs grouped by city for restaurants with approved listings."""
    # When using DISTINCT, all ORDER BY columns must be in SELECT list
    query = select(
        Restaurant.id,
        Restaurant.city,
        Restaurant.google_rating
    ).join(
        Listing, Restaurant.id == Listing.restaurant_id
    ).filter(
        Restaurant.city.in_(city_names),
        Restaurant.is_active == True,
        Listing.approved == True
    ).distinct().order_by(
        Restaurant.city,
        Restaurant.google_rating.desc().nulls_last()
    )
    
    result = await db.execute(query)
    restaurant_data = result.all()
    
    city_restaurant_ids: Dict[str, List[UUID]] = {}
    for row in restaurant_data:
        city = row.city
        if city and city in city_names:
            if city not in city_restaurant_ids:
                city_restaurant_ids[city] = []
            city_restaurant_ids[city].append(row.id)
    
    return city_restaurant_ids


async def fetch_restaurants_data(
    db: AsyncSession, restaurant_ids: List[UUID]
) -> Dict[UUID, Any]:
    """Fetch restaurants with only required columns for home page."""
    query = select(
        Restaurant.id,
        Restaurant.name,
        Restaurant.slug,
        Restaurant.address,
        Restaurant.city,
        Restaurant.google_rating,
        Restaurant.photo_url,
        Restaurant.current_opening_hours,
        Restaurant.opening_hours,
        Restaurant.price_level,
        Restaurant.latitude,
        Restaurant.longitude,
        Restaurant.country,
        Restaurant.business_status,
        Restaurant.created_at,
        Restaurant.updated_at
    ).filter(
        Restaurant.id.in_(restaurant_ids),
        Restaurant.is_active == True
    )
    
    result = await db.execute(query)
    return {row.id: row for row in result.all()}


async def fetch_cuisines_data(
    db: AsyncSession, restaurant_ids: List[UUID]
) -> Dict[UUID, List[Dict]]:
    """Fetch cuisines for restaurants with only required columns."""
    query = select(
        RestaurantCuisine.restaurant_id,
        Cuisine.id,
        Cuisine.name,
        Cuisine.created_at
    ).join(
        Cuisine, RestaurantCuisine.cuisine_id == Cuisine.id
    ).filter(
        RestaurantCuisine.restaurant_id.in_(restaurant_ids)
    )
    
    result = await db.execute(query)
    cuisines_data: Dict[UUID, List[Dict]] = {}
    for row in result.all():
        if row.restaurant_id not in cuisines_data:
            cuisines_data[row.restaurant_id] = []
        cuisines_data[row.restaurant_id].append({
            'id': row.id,
            'name': row.name,
            'created_at': row.created_at
        })
    
    return cuisines_data


async def fetch_listings_data(
    db: AsyncSession, restaurant_ids: List[UUID]
) -> Dict[UUID, List[Any]]:
    """Fetch listings with influencers for restaurants with only required columns."""
    query = select(
        Listing.id,
        Listing.restaurant_id,
        Listing.review_sections,
        Listing.approved,
        Listing.created_at,
        Listing.updated_at,
        Influencer.id.label('influencer_id'),
        Influencer.name.label('influencer_name'),
        Influencer.slug.label('influencer_slug'),
        Influencer.avatar_url.label('influencer_avatar_url'),
        Influencer.youtube_channel_id,
        Influencer.created_at.label('influencer_created_at'),
        Influencer.updated_at.label('influencer_updated_at')
    ).join(
        Influencer, Listing.influencer_id == Influencer.id
    ).filter(
        Listing.restaurant_id.in_(restaurant_ids),
        Listing.approved == True
    )
    
    result = await db.execute(query)
    listings_data: Dict[UUID, List[Any]] = {}
    for row in result.all():
        if row.restaurant_id not in listings_data:
            listings_data[row.restaurant_id] = []
        listings_data[row.restaurant_id].append(row)
    
    return listings_data


def build_restaurant_cuisines(
    restaurant_id: UUID, cuisines_data: Dict[UUID, List[Dict]]
) -> List[CuisineResponse]:
    """Build cuisine responses for a restaurant."""
    restaurant_cuisines = []
    if restaurant_id in cuisines_data:
        for cuisine in cuisines_data[restaurant_id]:
            restaurant_cuisines.append(CuisineResponse(
                id=cuisine['id'],
                name=cuisine['name'],
                created_at=cuisine['created_at']
            ))
    return restaurant_cuisines


def build_restaurant_listings(
    restaurant_id: UUID, listings_data: Dict[UUID, List[Any]]
) -> List[ListingLightResponse]:
    """Build listing responses for a restaurant."""
    restaurant_listings = []
    if restaurant_id in listings_data:
        for listing_row in listings_data[restaurant_id]:
            # Only include influencer fields actually used on home page
            influencer_response = InfluencerLightResponse(
                id=listing_row.influencer_id,
                name=listing_row.influencer_name,
                slug=listing_row.influencer_slug,
                bio=None,  # Not used on home page
                avatar_url=listing_row.influencer_avatar_url,
                banner_url=None,  # Not used on home page
                youtube_channel_id=listing_row.youtube_channel_id,  # Required by schema
                youtube_channel_url=None,  # Not used on home page
                subscriber_count=None,  # Not used on home page
                created_at=listing_row.influencer_created_at,  # Required by schema
                updated_at=listing_row.influencer_updated_at,  # Required by schema
            )
            
            # Only include listing fields actually used on home page
            listing_response = ListingLightResponse(
                id=listing_row.id,
                restaurant_id=restaurant_id,
                influencer=influencer_response,
                visit_date=None,  # Not used on home page
                review_sections=listing_row.review_sections,  # Used for review text display
                timestamp=None,  # Not used on home page
                approved=listing_row.approved,  # Required by schema
                created_at=listing_row.created_at,  # Required by schema
                updated_at=listing_row.updated_at  # Required by schema
            )
            restaurant_listings.append(listing_response)
    
    return restaurant_listings


def build_restaurant_response(
    restaurant_id: UUID,
    restaurant_row: Any,
    cuisines_data: Dict[UUID, List[Dict]],
    listings_data: Dict[UUID, List[Any]]
) -> Optional[RestaurantResponse]:
    """Build a restaurant response with only essential fields for home page."""
    restaurant_cuisines = build_restaurant_cuisines(restaurant_id, cuisines_data)
    restaurant_listings = build_restaurant_listings(restaurant_id, listings_data)
    
    # Only include restaurants with approved listings
    if not restaurant_listings:
        return None
    
    restaurant_dict = {
        'id': restaurant_id,
        'name': restaurant_row.name,
        'slug': restaurant_row.slug,
        'address': restaurant_row.address,  # Required by schema
        'city': restaurant_row.city,  # Used for display
        'google_rating': restaurant_row.google_rating,  # Used for display
        'photo_url': restaurant_row.photo_url,  # Used for display
        'current_opening_hours': restaurant_row.current_opening_hours,  # Used for open_now status
        'opening_hours': restaurant_row.opening_hours,  # Fallback for open_now
        'price_level': restaurant_row.price_level,  # Used for price display
        'cuisines': restaurant_cuisines if restaurant_cuisines else None,  # Used for display
        'listings': restaurant_listings,  # Used for display
        # Required fields for RestaurantResponse schema
        'latitude': restaurant_row.latitude,
        'longitude': restaurant_row.longitude,
        'country': restaurant_row.country,  # Required by schema
        'business_status': restaurant_row.business_status,  # Required by schema
        'created_at': restaurant_row.created_at,  # Required by schema
        'updated_at': restaurant_row.updated_at,  # Required by schema
        # Optional fields not used on home page - set to None to reduce payload
        'google_place_id': None,
        'is_active': None,
        'tags': None,  # Not loaded for home page
        'website': None,
        'international_phone_number': None,
        'secondary_opening_hours': None,
    }
    
    return RestaurantResponse.model_validate(restaurant_dict)

