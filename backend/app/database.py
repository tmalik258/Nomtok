import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import (sessionmaker, declarative_base)
from sqlalchemy.ext.asyncio import (create_async_engine, AsyncSession, async_sessionmaker)
from sqlalchemy.exc import OperationalError, TimeoutError as SQLTimeoutError
from asyncpg.exceptions import TooManyConnectionsError, ConnectionDoesNotExistError

from app.config import (
    DATABASE_URL,
    ASYNC_DATABASE_URL,
    DB_POOL_SIZE,
    DB_MAX_OVERFLOW,
    DB_POOL_TIMEOUT,
    DB_POOL_RECYCLE,
    DB_CONNECT_TIMEOUT,
)
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
    sync_engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"},
        pool_pre_ping=True,
        pool_recycle=1800,
    )
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
        pool_size=DB_POOL_SIZE,
        max_overflow=DB_MAX_OVERFLOW,
        pool_timeout=DB_POOL_TIMEOUT,
        pool_recycle=DB_POOL_RECYCLE,
        echo=False,
        pool_pre_ping=True,
        # Set connection args for asyncpg to prevent connection leaks
        connect_args={
            "server_settings": {
                "application_name": "nomtok_backend",
            },
            "command_timeout": 120,  # Increased command timeout
            "timeout": DB_CONNECT_TIMEOUT,  # Connection establishment timeout
        },
    )
    logger.info(
        f"Database connection pool configured: pool_size={DB_POOL_SIZE}, "
        f"max_overflow={DB_MAX_OVERFLOW}, max_connections={DB_POOL_SIZE + DB_MAX_OVERFLOW}, "
        f"pool_timeout={DB_POOL_TIMEOUT}s, connect_timeout={DB_CONNECT_TIMEOUT}s"
    )
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise RuntimeError(f"Database connection failed: {str(e)}")

AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Async session dependency with auto-commit/rollback
async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Auto-commit successful requests
        except Exception as e:
            # Rollback on any error (context manager will close session)
            await session.rollback()
            # Log database connection errors specifically
            if isinstance(e, (OperationalError, SQLTimeoutError, TooManyConnectionsError, ConnectionDoesNotExistError)):
                logger.error(f"Database connection error in session: {str(e)}")
            raise
