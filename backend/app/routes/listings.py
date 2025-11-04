from enum import Enum
from typing import Optional
from uuid import UUID

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, joinedload

from app.models import (Listing, Influencer, Restaurant, RestaurantTag, RestaurantCuisine, Video)
from app.database import get_db
from app.utils.logging import setup_logger
from app.api_schema.videos import VideoResponse
from app.api_schema.listings import ListingResponse, PaginatedListingsResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.influencers import InfluencerLightResponse, InfluencerResponse
from app.api_schema.tags import TagResponse
from app.api_schema.cuisines import CuisineResponse

logger = setup_logger(__name__)

router = APIRouter()

class ApprovedStatus(str, Enum):
    APPROVED = "Approved"
    NOT_APPROVED = "Not Approved"
    ALL = "All"

@router.get("/", response_model=PaginatedListingsResponse)
def get_listings(
    db: Session = Depends(get_db),
    # Search filters
    search: Optional[str] = None,
    restaurant_name: Optional[str] = None,
    influencer_name: Optional[str] = None,
    video_title: Optional[str] = None,
    restaurant_slug: Optional[str] = None,
    influencer_slug: Optional[str] = None,
    video_slug: Optional[str] = None,
    # Status filters
    approved: Optional[bool] = None,
    status: Optional[str] = None,  # 'approved', 'rejected', 'pending', 'all'
    # Pagination
    page: int = 1,
    limit: int = 10,
    # Sorting
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    # Existing filters for backward compatibility
    id: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    video_id: Optional[str] = None,
    influencer_id: Optional[str] = None,
    approved_status: Optional[ApprovedStatus] = None,
    sort_by_published_date: bool = False,
    skip: int = 0
):
    """Get listings with search, filtering, and pagination support."""
    try:
        # Start with base query using ORM-style queries
        query = db.query(Listing).options(
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Listing.video),
            joinedload(Listing.influencer)
        )

        # Apply search filter (searches across restaurant, influencer, and video names and slugs)
        if search:
            query = query.join(Restaurant).join(Video).join(Influencer, isouter=True)
            query = query.filter(
                or_(
                    Restaurant.name.ilike(f"%{search}%"),
                    Influencer.name.ilike(f"%{search}%"),
                    Video.title.ilike(f"%{search}%"),
                    Restaurant.slug.ilike(f"%{search}%"),
                    Influencer.slug.ilike(f"%{search}%"),
                    Video.slug.ilike(f"%{search}%")
                )
            )

        # Apply individual name/slug filters
        if restaurant_name:
            query = query.join(Restaurant).filter(Restaurant.name.ilike(f"%{restaurant_name}%"))
        if restaurant_slug:
            query = query.join(Restaurant).filter(Restaurant.slug.ilike(f"%{restaurant_slug}%"))
        if influencer_name:
            query = query.join(Influencer).filter(Influencer.name.ilike(f"%{influencer_name}%"))
        if influencer_slug:
            query = query.join(Influencer).filter(Influencer.slug.ilike(f"%{influencer_slug}%"))
        if video_title:
            query = query.join(Video).filter(Video.title.ilike(f"%{video_title}%"))
        if video_slug:
            query = query.join(Video).filter(Video.slug.ilike(f"%{video_slug}%"))

        # Apply status filters
        if status and status != 'all':
            if status == 'approved':
                query = query.filter(Listing.approved == True)
            elif status == 'rejected':
                query = query.filter(Listing.approved == False)
            elif status == 'pending':
                query = query.filter(Listing.approved == None)
        elif approved is not None:
            query = query.filter(Listing.approved == approved)
        elif approved_status == ApprovedStatus.APPROVED:
            query = query.filter(Listing.approved == True)
        elif approved_status == ApprovedStatus.NOT_APPROVED:
            query = query.filter(Listing.approved == False)

        # Apply existing filters for backward compatibility
        if id:
            query = query.filter(Listing.id == id)
        if restaurant_id:
            query = query.filter(Listing.restaurant_id == restaurant_id)
        if video_id:
            query = query.filter(Listing.video_id == video_id)
        if influencer_id:
            query = query.filter(Listing.influencer_id == influencer_id)

        # Apply sorting
        if sort_by_published_date:
            query = query.join(Video).order_by(desc(Video.published_at))
        elif sort_by:
            if sort_by == "created_at":
                order_col = Listing.created_at
            elif sort_by == "visit_date":
                order_col = Listing.visit_date
            elif sort_by == "confidence_score":
                order_col = Listing.confidence_score
            else:
                order_col = Listing.created_at
            
            if sort_order and sort_order.lower() == "asc":
                query = query.order_by(order_col.asc())
            else:
                query = query.order_by(order_col.desc())

        # Get total count before pagination
        total_count = query.count()

        # Calculate pagination (use new pagination parameters if provided, otherwise fall back to skip)
        if page > 0 and limit > 0:
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)
        else:
            # Fallback to legacy skip parameter
            query = query.offset(skip).limit(limit)

        # Execute main query
        listings = query.all()

        # Handle empty results gracefully
        if not listings and page > 1:
            # If requesting a page beyond available data, return empty result
            return PaginatedListingsResponse(
                listings=[],
                total=total_count,
                page=page,
                limit=limit,
                total_pages=(total_count + limit - 1) // limit
            )

        # Manually construct response objects to avoid circular dependencies
        response_listings = []
        for listing in listings:
            # Process tags
            tags = None
            if listing.restaurant.restaurant_tags:
                tags = [TagResponse(
                    id=rt.tag.id,
                    name=rt.tag.name,
                    created_at=rt.tag.created_at
                ) for rt in listing.restaurant.restaurant_tags]
            
            # Process cuisines
            cuisines = None
            if listing.restaurant.restaurant_cuisines:
                cuisines = [CuisineResponse(
                    id=rc.cuisine.id,
                    name=rc.cuisine.name,
                    created_at=rc.cuisine.created_at
                ) for rc in listing.restaurant.restaurant_cuisines]
            
            # Construct RestaurantResponse manually
            restaurant_response = RestaurantResponse(
                id=listing.restaurant.id,
                name=listing.restaurant.name,
                slug=listing.restaurant.slug,
                address=listing.restaurant.address,
                latitude=listing.restaurant.latitude,
                longitude=listing.restaurant.longitude,
                city=listing.restaurant.city,
                country=listing.restaurant.country,
                google_place_id=listing.restaurant.google_place_id,
                google_rating=listing.restaurant.google_rating,
                business_status=listing.restaurant.business_status,
                photo_url=listing.restaurant.photo_url,
                is_active=listing.restaurant.is_active,
                created_at=listing.restaurant.created_at,
                updated_at=listing.restaurant.updated_at,
                tags=tags,
                cuisines=cuisines,
                listings=None  # Prevent circular dependency
            )
            
            # Construct VideoResponse manually if video exists
            video_response = None
            if listing.video:
                # Get influencer data for the video
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

            # Construct InfluencerResponse manually if influencer exists
            influencer_response = None
            if listing.influencer:
                influencer_response = InfluencerResponse(
                    id=listing.influencer.id,
                    name=listing.influencer.name,
                    slug=listing.influencer.slug,
                    bio=listing.influencer.bio,
                    avatar_url=listing.influencer.avatar_url,
                    banner_url=listing.influencer.banner_url,
                    youtube_channel_id=listing.influencer.youtube_channel_id,
                    youtube_channel_url=listing.influencer.youtube_channel_url,
                    subscriber_count=listing.influencer.subscriber_count,
                    created_at=listing.influencer.created_at,
                    updated_at=listing.influencer.updated_at,
                    listings=None  # Prevent circular dependency
                )

            # Construct ListingResponse manually
            listing_response = ListingResponse(
                id=listing.id,
                restaurant=restaurant_response,
                video=video_response,
                influencer=influencer_response,
                visit_date=listing.visit_date,
                confidence_score=listing.confidence_score,
                review_sections=listing.review_sections,
                timestamp=listing.timestamp,
                approved=listing.approved,
                created_at=listing.created_at,
                updated_at=listing.updated_at
            )

            response_listings.append(listing_response)

        return PaginatedListingsResponse(
            listings=response_listings,
            total=total_count,
            page=page,
            limit=limit,
            total_pages=(total_count + limit - 1) // limit
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching listings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch listings. Please try again later.")

@router.get("/{listing_id}/", response_model=ListingResponse)
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    """Get a single approved listing by ID or slug of related entities.
    If a UUID is provided, fetch by listing ID.
    If a slug is provided, match by Video, Restaurant, or Influencer slug and return the most recent approved listing.
    """
    try:
        base_query = db.query(Listing).options(
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Listing.video),
            joinedload(Listing.influencer)
        ).filter(Listing.approved == True)

        # Detect if path is UUID
        is_uuid = True
        try:
            UUID(str(listing_id))
        except Exception:
            is_uuid = False

        if is_uuid:
            query = base_query.filter(Listing.id == listing_id)
        else:
            # Match by nested slugs. Order by most recent to return a single deterministic record.
            query = base_query.join(Video, isouter=True).join(Restaurant, isouter=True).join(Influencer, isouter=True).filter(
                or_(
                    Video.slug == listing_id,
                    Restaurant.slug == listing_id,
                    Influencer.slug == listing_id
                )
            ).order_by(desc(Listing.created_at))
        listing = query.first()

        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Process tags
        tags = None
        if listing.restaurant.restaurant_tags:
            tags = [TagResponse(
                id=rt.tag.id,
                name=rt.tag.name,
                created_at=rt.tag.created_at
            ) for rt in listing.restaurant.restaurant_tags]
        
        # Process cuisines
        cuisines = None
        if listing.restaurant.restaurant_cuisines:
            cuisines = [CuisineResponse(
                id=rc.cuisine.id,
                name=rc.cuisine.name,
                created_at=rc.cuisine.created_at
            ) for rc in listing.restaurant.restaurant_cuisines]
        
        # Construct RestaurantResponse manually
        restaurant_response = RestaurantResponse(
            id=listing.restaurant.id,
            name=listing.restaurant.name,
            slug=listing.restaurant.slug,
            address=listing.restaurant.address,
            latitude=listing.restaurant.latitude,
            longitude=listing.restaurant.longitude,
            city=listing.restaurant.city,
            country=listing.restaurant.country,
            google_place_id=listing.restaurant.google_place_id,
            google_rating=listing.restaurant.google_rating,
            business_status=listing.restaurant.business_status,
            photo_url=listing.restaurant.photo_url,
            is_active=listing.restaurant.is_active,
            created_at=listing.restaurant.created_at,
            updated_at=listing.restaurant.updated_at,
            tags=tags,
            cuisines=cuisines,
            listings=None  # Prevent circular dependency
        )

        # Construct VideoResponse manually if video exists
        video_response = None
        if listing.video:
            # Get influencer data for the video
            video_influencer_response = None
            if listing.video.influencer:
                video_influencer_response = InfluencerLightResponse(
                    id=listing.video.influencer.id,
                    name=listing.video.influencer.name,
                    slug=listing.video.influencer.slug,
                    bio=listing.video.influencer.bio,
                    avatar_url=listing.video.influencer.avatar_url,
                    banner_url=listing.video.influencer.banner_url,
                    # region=listing.video.influencer.region,
                    # country=listing.video.influencer.country,
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

        # Construct InfluencerResponse manually if influencer exists
        influencer_response = None
        if listing.influencer:
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
                listings=None  # Prevent circular dependency
            )

        # Construct ListingResponse manually
        listing_response = ListingResponse(
            id=listing.id,
            restaurant=restaurant_response,
            video=video_response,
            influencer=influencer_response,
            visit_date=listing.visit_date,
            confidence_score=listing.confidence_score,
            review_sections=listing.review_sections,
            timestamp=listing.timestamp,
            approved=listing.approved,
            created_at=listing.created_at,
            updated_at=listing.updated_at
        )

        return listing_response
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch listing. Please try again later.")
