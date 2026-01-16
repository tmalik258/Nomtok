from typing import Optional, List
from uuid import UUID
from datetime import datetime
import asyncio

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, delete, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.models import Blog, BlogCategory, BlogPostCategory
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.api_schema.blog import (
    BlogCreate,
    BlogUpdate,
    AdminBlogResponse,
    BlogResponse,
    PaginatedBlogsResponse,
    BlogCategoryResponse,
    BlogCategoryCreate,
    BlogCategoryUpdate
)
from app.utils.logging import setup_logger
from app.utils.sitemap_trigger import trigger_sitemap_regeneration

logger = setup_logger(__name__)

router = APIRouter()

# Blog Post CRUD
@router.post("/", response_model=AdminBlogResponse, status_code=status.HTTP_201_CREATED)
async def create_blog(
    blog: BlogCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new blog post."""
    try:
        # Check if blog with same title already exists
        query = select(Blog).filter(Blog.title.ilike(f"%{blog.title}%"))
        result = await db.execute(query)
        existing_blog = result.scalars().first()
        
        if existing_blog:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A blog post with a similar title '{existing_blog.title}' already exists"
            )
        
        # Create new blog post
        blog_data = blog.model_dump(exclude={"category_ids"})
        
        # Set published_at if is_published is True and published_at is not provided
        if blog_data.get("is_published") and not blog_data.get("published_at"):
            blog_data["published_at"] = datetime.utcnow()
        
        new_blog = Blog(**blog_data)
        db.add(new_blog)
        await db.flush()  # Flush to get the ID
        
        # Add categories if provided
        if blog.category_ids:
            for category_id in blog.category_ids:
                # Verify category exists
                cat_query = select(BlogCategory).filter(BlogCategory.id == category_id)
                cat_result = await db.execute(cat_query)
                category = cat_result.scalars().first()
                
                if not category:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Category with ID {category_id} not found"
                    )
                
                blog_post_category = BlogPostCategory(
                    blog_id=new_blog.id,
                    category_id=category_id
                )
                db.add(blog_post_category)
        
        await db.commit()
        await db.refresh(new_blog)
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        logger.info(f"Successfully created blog post: {new_blog.title} (ID: {new_blog.id})")
        
        return AdminBlogResponse(
            message="Blog post created successfully",
            blog_id=new_blog.id
        )
    except HTTPException:
        raise
    except IntegrityError as e:
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"Database integrity error creating blog: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid blog data provided"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating blog: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the blog post"
        )

@router.get("/", response_model=PaginatedBlogsResponse)
async def get_blogs_admin(
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by title"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    sort_by: str = Query("created_at", description="Sort by: created_at, updated_at, published_at, title"),
    sort_order: str = Query("desc", description="Sort order: asc or desc")
):
    """Get all blog posts (Admin only - includes unpublished)."""
    try:
        filters = []
        
        # Search filter
        if search:
            filters.append(Blog.title.ilike(f"%{search}%"))
        
        # Published status filter
        if is_published is not None:
            filters.append(Blog.is_published == is_published)
        
        # Featured filter
        if is_featured is not None:
            filters.append(Blog.is_featured == is_featured)
        
        # Category filter
        if category_id:
            filters.append(
                Blog.blog_post_categories.any(
                    BlogPostCategory.category_id == category_id
                )
            )
        
        # Build query
        query = select(Blog).options(
            joinedload(Blog.blog_post_categories).joinedload(BlogPostCategory.category)
        )
        
        if filters:
            query = query.where(and_(*filters))
        
        # Sorting
        if sort_by == "created_at":
            sort_column = Blog.created_at
        elif sort_by == "updated_at":
            sort_column = Blog.updated_at
        elif sort_by == "published_at":
            sort_column = Blog.published_at
        elif sort_by == "title":
            sort_column = Blog.title
        else:
            sort_column = Blog.created_at
        
        if sort_order == "asc":
            query = query.order_by(sort_column.asc().nulls_last())
        else:
            query = query.order_by(sort_column.desc().nulls_last())
        
        # Get total count
        count_query = select(func.count()).select_from(Blog)
        if filters:
            count_query = count_query.where(and_(*filters))
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

@router.get("/{blog_id}/", response_model=BlogResponse)
async def get_blog_admin(
    blog_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Get a single blog post by ID (Admin only - includes unpublished)."""
    try:
        query = select(Blog).options(
            joinedload(Blog.blog_post_categories).joinedload(BlogPostCategory.category)
        ).filter(Blog.id == blog_id)
        
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

@router.put("/{blog_id}/", response_model=AdminBlogResponse)
async def update_blog(
    blog_id: UUID,
    blog_update: BlogUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing blog post."""
    try:
        # Find the blog post
        query = select(Blog).filter(Blog.id == blog_id)
        result = await db.execute(query)
        db_blog = result.scalars().first()
        
        if not db_blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        # Update blog fields if provided
        update_data = blog_update.model_dump(exclude_unset=True, exclude={"category_ids"})
        
        # Handle published_at logic
        if "is_published" in update_data:
            if update_data["is_published"] and not update_data.get("published_at") and not db_blog.published_at:
                update_data["published_at"] = datetime.utcnow()
            elif not update_data["is_published"]:
                update_data["published_at"] = None
        
        for field, value in update_data.items():
            setattr(db_blog, field, value)
        
        # Update categories if provided
        if blog_update.category_ids is not None:
            # Remove existing categories
            delete_stmt = delete(BlogPostCategory).where(BlogPostCategory.blog_id == blog_id)
            await db.execute(delete_stmt)
            
            # Add new categories
            for category_id in blog_update.category_ids:
                # Verify category exists
                cat_query = select(BlogCategory).filter(BlogCategory.id == category_id)
                cat_result = await db.execute(cat_query)
                category = cat_result.scalars().first()
                
                if not category:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Category with ID {category_id} not found"
                    )
                
                blog_post_category = BlogPostCategory(
                    blog_id=blog_id,
                    category_id=category_id
                )
                db.add(blog_post_category)
        
        await db.commit()
        await db.refresh(db_blog)
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        return AdminBlogResponse(
            message="Blog post updated successfully",
            blog_id=db_blog.id
        )
    except HTTPException:
        raise
    except IntegrityError as e:
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"Database integrity error updating blog: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid blog data provided"
        )
    except Exception as e:
        logger.error(f"Failed to update blog: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update blog post: {str(e)}"
        )

@router.delete("/{blog_id}/", response_model=AdminBlogResponse)
async def delete_blog(
    blog_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Delete a blog post."""
    try:
        # Find the blog post
        query = select(Blog).filter(Blog.id == blog_id)
        result = await db.execute(query)
        db_blog = result.scalars().first()
        
        if not db_blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        # Hard delete - remove from database
        await db.delete(db_blog)
        await db.commit()
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        return AdminBlogResponse(
            message="Blog post permanently deleted",
            blog_id=blog_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete blog: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete blog post: {str(e)}"
        )

@router.put("/{blog_id}/publish/", response_model=AdminBlogResponse)
async def toggle_publish_blog(
    blog_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Toggle publish status of a blog post."""
    try:
        query = select(Blog).filter(Blog.id == blog_id)
        result = await db.execute(query)
        db_blog = result.scalars().first()
        
        if not db_blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        db_blog.is_published = not db_blog.is_published
        
        if db_blog.is_published and not db_blog.published_at:
            db_blog.published_at = datetime.utcnow()
        elif not db_blog.is_published:
            db_blog.published_at = None
        
        await db.commit()
        await db.refresh(db_blog)
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        return AdminBlogResponse(
            message=f"Blog post {'published' if db_blog.is_published else 'unpublished'} successfully",
            blog_id=db_blog.id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle publish status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle publish status: {str(e)}"
        )

@router.put("/{blog_id}/feature/", response_model=AdminBlogResponse)
async def toggle_feature_blog(
    blog_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Toggle featured status of a blog post."""
    try:
        query = select(Blog).filter(Blog.id == blog_id)
        result = await db.execute(query)
        db_blog = result.scalars().first()
        
        if not db_blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        db_blog.is_featured = not db_blog.is_featured
        
        await db.commit()
        await db.refresh(db_blog)
        
        # Trigger sitemap regeneration in background
        asyncio.create_task(trigger_sitemap_regeneration())
        
        return AdminBlogResponse(
            message=f"Blog post {'featured' if db_blog.is_featured else 'unfeatured'} successfully",
            blog_id=db_blog.id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle feature status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle feature status: {str(e)}"
        )

# Category Management
@router.post("/categories/", response_model=BlogCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_category(
    category: BlogCategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new blog category."""
    try:
        # Check if category with same name already exists
        query = select(BlogCategory).filter(BlogCategory.name == category.name)
        result = await db.execute(query)
        existing_category = result.scalars().first()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{category.name}' already exists"
            )
        
        new_category = BlogCategory(**category.model_dump())
        db.add(new_category)
        await db.commit()
        await db.refresh(new_category)
        
        return BlogCategoryResponse.model_validate(new_category)
    except HTTPException:
        raise
    except IntegrityError as e:
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"Database integrity error creating category: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category data provided"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the category"
        )

@router.get("/categories/", response_model=List[BlogCategoryResponse])
async def get_blog_categories_admin(
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Get all blog categories (Admin only)."""
    try:
        query = select(BlogCategory).order_by(BlogCategory.name)
        result = await db.execute(query)
        categories = result.scalars().all()
        
        return [BlogCategoryResponse.model_validate(cat) for cat in categories]
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch blog categories"
        )

@router.put("/categories/{category_id}/", response_model=BlogCategoryResponse)
async def update_blog_category(
    category_id: UUID,
    category_update: BlogCategoryUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing blog category."""
    try:
        query = select(BlogCategory).filter(BlogCategory.id == category_id)
        result = await db.execute(query)
        existing_category = result.scalars().first()
        
        if not existing_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check if new name conflicts with existing category
        if category_update.name and category_update.name != existing_category.name:
            name_query = select(BlogCategory).filter(BlogCategory.name == category_update.name)
            name_result = await db.execute(name_query)
            conflicting_category = name_result.scalars().first()
            
            if conflicting_category:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Category with name '{category_update.name}' already exists"
                )
        
        for field, value in category_update.model_dump(exclude_unset=True).items():
            setattr(existing_category, field, value)
        
        await db.commit()
        await db.refresh(existing_category)
        
        return BlogCategoryResponse.model_validate(existing_category)
    except HTTPException:
        raise
    except IntegrityError as e:
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"Database integrity error updating category: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category data provided"
        )
    except Exception as e:
        logger.error(f"Failed to update category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update category: {str(e)}"
        )

@router.delete("/categories/{category_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Delete a blog category."""
    try:
        query = select(BlogCategory).filter(BlogCategory.id == category_id)
        result = await db.execute(query)
        existing_category = result.scalars().first()
        
        if not existing_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        await db.execute(delete(BlogCategory).filter(BlogCategory.id == category_id))
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete category: {str(e)}"
        )
