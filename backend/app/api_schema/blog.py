from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

# Category Schemas
class BlogCategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BlogCategoryCreate(BaseModel):
    name: str = Field(..., description="Category name")

# Public Blog Schemas
class BlogResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_published: bool
    is_featured: bool
    published_at: Optional[datetime] = None
    categories: Optional[List[BlogCategoryResponse]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedBlogsResponse(BaseModel):
    """Response model for paginated blog posts"""
    blogs: List[BlogResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)

# Admin Blog Schemas
class BlogCreate(BaseModel):
    """Schema for creating a new blog post"""
    title: str = Field(..., description="Blog post title")
    content: str = Field(..., description="Blog post content in markdown")
    excerpt: Optional[str] = Field(None, description="Short preview/excerpt")
    cover_image_url: Optional[str] = Field(None, description="URL to cover image")
    meta_title: Optional[str] = Field(None, description="SEO meta title")
    meta_description: Optional[str] = Field(None, description="SEO meta description")
    meta_keywords: Optional[str] = Field(None, description="SEO meta keywords")
    is_published: bool = Field(False, description="Whether the post is published")
    is_featured: bool = Field(False, description="Whether the post is featured")
    published_at: Optional[datetime] = Field(None, description="Publication date")
    category_ids: Optional[List[UUID]] = Field(None, description="List of category IDs")

    model_config = ConfigDict(from_attributes=True)

class BlogUpdate(BaseModel):
    """Schema for updating an existing blog post"""
    title: Optional[str] = Field(None, description="Blog post title")
    content: Optional[str] = Field(None, description="Blog post content in markdown")
    excerpt: Optional[str] = Field(None, description="Short preview/excerpt")
    cover_image_url: Optional[str] = Field(None, description="URL to cover image")
    meta_title: Optional[str] = Field(None, description="SEO meta title")
    meta_description: Optional[str] = Field(None, description="SEO meta description")
    meta_keywords: Optional[str] = Field(None, description="SEO meta keywords")
    is_published: Optional[bool] = Field(None, description="Whether the post is published")
    is_featured: Optional[bool] = Field(None, description="Whether the post is featured")
    published_at: Optional[datetime] = Field(None, description="Publication date")
    category_ids: Optional[List[UUID]] = Field(None, description="List of category IDs")

    model_config = ConfigDict(from_attributes=True)

class AdminBlogResponse(BaseModel):
    """Response after blog post creation or update"""
    message: str
    blog_id: UUID

class BlogCategoryUpdate(BaseModel):
    """Schema for updating a blog category"""
    name: Optional[str] = Field(None, description="Category name")
