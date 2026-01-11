from sqlalchemy import (Column, ForeignKey, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class BlogPostCategory(Base):
    __tablename__ = "blog_post_categories"

    blog_id = Column(UUID(as_uuid=True), ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("blog_categories.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    blog = relationship("Blog", back_populates="blog_post_categories")
    category = relationship("BlogCategory", back_populates="blog_post_categories")
