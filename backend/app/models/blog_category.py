import uuid
from sqlalchemy import (Column, String, DateTime, event, inspect)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from slugify import slugify
from app.utils.slug_utils import ensure_unique_slug

from app.database import Base

class BlogCategory(Base):
    __tablename__ = "blog_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    blog_post_categories = relationship("BlogPostCategory", back_populates="category", cascade="all, delete-orphan")


@event.listens_for(BlogCategory, "before_insert")
def _blog_category_before_insert(mapper, connection, target):
    base_slug = slugify(target.name or "")
    target.slug = ensure_unique_slug(
        connection,
        target.__table__,
        slug_column="slug",
        base_value=base_slug,
        id_column="id",
        current_id=None,
    )


@event.listens_for(BlogCategory, "before_update")
def _blog_category_before_update(mapper, connection, target):
    state = inspect(target)
    name_changed = False
    try:
        name_changed = state.attrs.name.history.has_changes()
    except Exception:
        name_changed = True
    if name_changed or not getattr(target, "slug", None):
        base_slug = slugify(target.name or "")
        target.slug = ensure_unique_slug(
            connection,
            target.__table__,
            slug_column="slug",
            base_value=base_slug,
            id_column="id",
            current_id=target.id,
        )
