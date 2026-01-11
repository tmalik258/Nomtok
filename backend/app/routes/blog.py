from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Blog, BlogCategory, BlogPostCategory
from app.database import get_async_db
from app.utils.logging import setup_logger
from app.api_schema.blog import BlogResponse, PaginatedBlogsResponse, BlogCategoryResponse

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/", response_model=PaginatedBlogsResponse)
async def get_blogs(
    db: AsyncSession = Depends(get_async_db),
    category: Optional[str] = Query(None, description="Filter by category slug"),
    featured: Optional[bool] = Query(None, description="Filter featured posts"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("published_at", description="Sort by: published_at, created_at, title"),
    sort_order: str = Query("desc", description="Sort order: asc or desc")
):
    """Get published blog posts with optional filtering by category and featured status."""
    try:
        # Base query - only published posts
        base_filter = Blog.is_published == True
        
        filters = [base_filter]
        
        # Category filtering
        if category:
            filters.append(
                Blog.blog_post_categories.any(
                    BlogPostCategory.category.has(BlogCategory.slug == category)
                )
            )
        
        # Featured filtering
        if featured is not None:
            filters.append(Blog.is_featured == featured)
        
        # Build query with relationships
        query = select(Blog).options(
            joinedload(Blog.blog_post_categories).joinedload(BlogPostCategory.category)
        ).where(and_(*filters))
        
        # Sorting
        if sort_by == "published_at":
            sort_column = Blog.published_at
        elif sort_by == "created_at":
            sort_column = Blog.created_at
        elif sort_by == "title":
            sort_column = Blog.title
        else:
            sort_column = Blog.published_at
        
        if sort_order == "asc":
            query = query.order_by(sort_column.asc().nulls_last())
        else:
            query = query.order_by(sort_column.desc().nulls_last())
        
        # Get total count
        count_query = select(func.count()).select_from(Blog).where(and_(*filters))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        blogs = result.unique().scalars().all()
        
        # Build response
        blog_responses = []
        for blog in blogs:
            categories = [BlogCategoryResponse.model_validate(bpc.category) for bpc in blog.blog_post_categories]
            blog_responses.append(BlogResponse(
                id=blog.id,
                title=blog.title,
                slug=blog.slug,
                content=blog.content,
                excerpt=blog.excerpt,
                cover_image_url=blog.cover_image_url,
                meta_title=blog.meta_title,
                meta_description=blog.meta_description,
                meta_keywords=blog.meta_keywords,
                is_published=blog.is_published,
                is_featured=blog.is_featured,
                published_at=blog.published_at,
                categories=categories if categories else None,
                created_at=blog.created_at,
                updated_at=blog.updated_at
            ))
        
        return PaginatedBlogsResponse(blogs=blog_responses, total=total)
        
    except Exception as e:
        logger.error(f"Error fetching blogs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch blog posts"
        )

@router.get("/{slug}/", response_model=BlogResponse)
async def get_blog_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_db)
):
    """Get a single published blog post by slug."""
    try:
        query = select(Blog).options(
            joinedload(Blog.blog_post_categories).joinedload(BlogPostCategory.category)
        ).where(
            and_(
                Blog.slug == slug,
                Blog.is_published == True
            )
        )
        
        result = await db.execute(query)
        blog = result.unique().scalar_one_or_none()
        
        if not blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        categories = [BlogCategoryResponse.model_validate(bpc.category) for bpc in blog.blog_post_categories]
        
        return BlogResponse(
            id=blog.id,
            title=blog.title,
            slug=blog.slug,
            content=blog.content,
            excerpt=blog.excerpt,
            cover_image_url=blog.cover_image_url,
            meta_title=blog.meta_title,
            meta_description=blog.meta_description,
            meta_keywords=blog.meta_keywords,
            is_published=blog.is_published,
            is_featured=blog.is_featured,
            published_at=blog.published_at,
            categories=categories if categories else None,
            created_at=blog.created_at,
            updated_at=blog.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching blog post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch blog post"
        )

@router.get("/featured/", response_model=PaginatedBlogsResponse)
async def get_featured_blogs(
    db: AsyncSession = Depends(get_async_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get featured published blog posts."""
    try:
        query = select(Blog).options(
            joinedload(Blog.blog_post_categories).joinedload(BlogPostCategory.category)
        ).where(
            and_(
                Blog.is_published == True,
                Blog.is_featured == True
            )
        ).order_by(Blog.published_at.desc().nulls_last()).limit(limit)
        
        result = await db.execute(query)
        blogs = result.unique().scalars().all()
        
        # Get total count
        count_query = select(func.count()).select_from(Blog).where(
            and_(
                Blog.is_published == True,
                Blog.is_featured == True
            )
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Build response
        blog_responses = []
        for blog in blogs:
            categories = [BlogCategoryResponse.model_validate(bpc.category) for bpc in blog.blog_post_categories]
            blog_responses.append(BlogResponse(
                id=blog.id,
                title=blog.title,
                slug=blog.slug,
                content=blog.content,
                excerpt=blog.excerpt,
                cover_image_url=blog.cover_image_url,
                meta_title=blog.meta_title,
                meta_description=blog.meta_description,
                meta_keywords=blog.meta_keywords,
                is_published=blog.is_published,
                is_featured=blog.is_featured,
                published_at=blog.published_at,
                categories=categories if categories else None,
                created_at=blog.created_at,
                updated_at=blog.updated_at
            ))
        
        return PaginatedBlogsResponse(blogs=blog_responses, total=total)
        
    except Exception as e:
        logger.error(f"Error fetching featured blogs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch featured blog posts"
        )

@router.get("/categories/", response_model=list[BlogCategoryResponse])
async def get_blog_categories(
    db: AsyncSession = Depends(get_async_db)
):
    """Get all blog categories that have published posts."""
    try:
        # Get categories that have at least one published blog post
        query = select(BlogCategory).join(
            BlogPostCategory
        ).join(
            Blog
        ).where(
            Blog.is_published == True
        ).distinct().order_by(BlogCategory.name)
        
        result = await db.execute(query)
        categories = result.scalars().all()
        
        return [BlogCategoryResponse.model_validate(cat) for cat in categories]
        
    except Exception as e:
        logger.error(f"Error fetching blog categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch blog categories"
        )
