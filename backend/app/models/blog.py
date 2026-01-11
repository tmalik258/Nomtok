import uuid
from sqlalchemy import (Column, String, Text, Boolean, DateTime, event, inspect)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from slugify import slugify
from app.utils.slug_utils import ensure_unique_slug

from app.database import Base

class Blog(Base):
    __tablename__ = "blogs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=False)  # Markdown content
    excerpt = Column(Text, nullable=True)  # Short preview
    cover_image_url = Column(Text, nullable=True)
    meta_title = Column(String(255), nullable=True)  # SEO
    meta_description = Column(Text, nullable=True)  # SEO
    meta_keywords = Column(Text, nullable=True)  # SEO
    is_published = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    blog_post_categories = relationship("BlogPostCategory", back_populates="blog", cascade="all, delete-orphan")
    
    @hybrid_property
    def categories(self):
        """Return the actual BlogCategory objects for serialization"""
        return [bpc.category for bpc in self.blog_post_categories] if self.blog_post_categories else []


@event.listens_for(Blog, "before_insert")
def _blog_before_insert(mapper, connection, target):
    base_slug = slugify(target.title or "")
    target.slug = ensure_unique_slug(
        connection,
        target.__table__,
        slug_column="slug",
        base_value=base_slug,
        id_column="id",
        current_id=None,
    )


@event.listens_for(Blog, "before_update")
def _blog_before_update(mapper, connection, target):
    state = inspect(target)
    title_changed = False
    try:
        title_changed = state.attrs.title.history.has_changes()
    except Exception:
        title_changed = True
    if title_changed or not getattr(target, "slug", None):
        base_slug = slugify(target.title or "")
        target.slug = ensure_unique_slug(
            connection,
            target.__table__,
            slug_column="slug",
            base_value=base_slug,
            id_column="id",
            current_id=target.id,
        )
