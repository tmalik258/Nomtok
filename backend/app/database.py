from sqlalchemy import create_engine
from sqlalchemy.orm import (sessionmaker, declarative_base)
from sqlalchemy.ext.asyncio import (create_async_engine, AsyncSession, async_sessionmaker)

from app.config import DATABASE_URL, ASYNC_DATABASE_URL
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

# Validate DATABASE_URL
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable is not set")
    raise ValueError("DATABASE_URL environment variable is required but not set")

if not ASYNC_DATABASE_URL:
    logger.error("ASYNC_DATABASE_URL environment variable is not set")
    raise ValueError("ASYNC_DATABASE_URL environment variable is required but not set")

# Synchronous engine for Supabase
try:
    sync_engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise RuntimeError(f"Database connection failed: {str(e)}")

SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
Base = declarative_base()

# Synchronous session dependency
def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Async engine for Supabase
try:
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_size=20,
        max_overflow=20,
        pool_timeout=60,
        pool_recycle=1800,
        echo=False,
    )
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise RuntimeError(f"Database connection failed: {str(e)}")

AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Async session dependency
async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
