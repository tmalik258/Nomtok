from contextlib import asynccontextmanager
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from starlette.requests import Request
from starlette.responses import JSONResponse

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import request_validation_exception_handler

from app.utils.logging import setup_logger
from app.utils.youtube_cookies import refresh_youtube_cookies
from app.services.video_metadata_refresh import refresh_stale_video_metadata
from app.database import AsyncSessionLocal
from app.routes.tags import router as tags_router
from app.routes.cuisines import router as cuisines_router
from app.routes.videos import router as videos_router
from app.routes.pexels_images import router as pexels_images_router
from app.routes.admin.process import router as admin_process_router
from app.routes.listings import router as listings_router
from app.routes.influencers import router as influencers_router
from app.routes.restaurants import router as restaurants_router
from app.routes.google_reviews import router as google_reviews_router
from app.routes.admin.listings import admin_listings_router
from app.routes.admin.jobs import router as admin_jobs_router
from app.routes.admin.restaurants import router as admin_restaurants_router
from app.routes.admin.videos import admin_videos_router
from app.routes.admin.influencers import admin_influencers_router
from app.routes.admin.tags import admin_tags_router
from app.routes.admin.cuisines import admin_cuisines_router
from app.routes.admin.dashboard import router as dashboard_router
from app.routes.geocoding import router as geocoding_router
from app.routes.cache import router as cache_router
from app.routes.youtube_metadata import router as youtube_metadata_router
from app.routes.blog import router as blog_router
from app.routes.admin.blog import router as admin_blog_router
from app.routes.contact import router as contact_router

# Configure logging
logger = setup_logger(__name__)

# Create scheduler before app
scheduler = AsyncIOScheduler()

# Refresh YouTube cookies daily
scheduler.add_job(refresh_youtube_cookies, 'interval', hours=23)

# Refresh YouTube video metadata weekly (Sunday 2 AM)
async def refresh_video_metadata_job():
    """Weekly job to refresh YouTube video metadata."""
    async with AsyncSessionLocal() as db:
        try:
            result = await refresh_stale_video_metadata(db, days_threshold=7)
            logger.info(f"Weekly metadata refresh completed: {result}")
        except Exception as e:
            logger.error(f"Error in weekly metadata refresh job: {e}")

scheduler.add_job(
    refresh_video_metadata_job,
    'cron',
    day_of_week='sun',
    hour=2,
    minute=0
)  # Weekly on Sunday at 2 AM

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler when event loop is running
    scheduler.start()
    yield
    # Shutdown: Clean up scheduler
    scheduler.shutdown()

# Initialize app
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "http://localhost",  # For local development
        "http://frontend:3000",  # For local development
        "https://caribou-equipped-turtle.ngrok-free.app",
        "https://nomtok.com",
        "https://www.nomtok.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Register routes
app.include_router(admin_process_router, prefix="/admin/process", tags=["admin"])
app.include_router(influencers_router, prefix="/influencers", tags=["influencers"])
app.include_router(videos_router, prefix="/videos", tags=["videos"])
app.include_router(pexels_images_router, prefix="/pexels-images", tags=["pexels-images"])
app.include_router(restaurants_router, prefix="/restaurants", tags=["restaurants"])
app.include_router(listings_router, prefix="/listings", tags=["listings"])
app.include_router(tags_router, prefix="/tags", tags=["tags"])
app.include_router(cuisines_router, prefix="/cuisines", tags=["cuisines"])
app.include_router(google_reviews_router, prefix="/google-reviews", tags=["google-reviews"])
app.include_router(admin_listings_router, prefix="/admin/listings", tags=["admin"])
app.include_router(admin_jobs_router, prefix="/admin/jobs", tags=["admin"])
app.include_router(admin_restaurants_router, prefix="/admin/restaurants", tags=["admin"])
app.include_router(admin_videos_router, prefix="/admin/videos", tags=["admin"])
app.include_router(admin_influencers_router, prefix="/admin/influencers", tags=["admin"])
app.include_router(admin_tags_router, prefix="/admin/tags", tags=["admin"])
app.include_router(admin_cuisines_router, prefix="/admin/cuisines", tags=["admin"])
app.include_router(geocoding_router, prefix="/geocoding", tags=["geocoding"])
app.include_router(dashboard_router, prefix="/admin/dashboard", tags=["admin"])
app.include_router(cache_router, prefix="/cache", tags=["cache"])
app.include_router(youtube_metadata_router, prefix="/youtube-metadata", tags=["youtube-metadata"])
app.include_router(blog_router, prefix="/blog", tags=["blog"])
app.include_router(admin_blog_router, prefix="/admin/blog", tags=["admin"])
app.include_router(contact_router, prefix="/contact", tags=["contact"])


# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    # Check if any error is specifically about the 'file' field expecting an UploadFile
    for error in exc.errors():
        if error["loc"] == ["body", "file"] and "Expected UploadFile" in error["msg"]:
            return JSONResponse(
                status_code=422,
                content={
                    "detail": [
                        {
                            "loc": error["loc"],
                            "msg": "Error uploading file: Invalid file input. Please re-select the CSV file or refresh the page and try again.",
                            "type": "value_error",
                        }
                    ]
                },
            )

    # For all other validation errors, use the default handler
    return await request_validation_exception_handler(request, exc)


@app.get("/")
def root():
    return {"message": "Influencer Food Map API is live!"}

@app.get("/health")
def health():
    return {"status": "healthy"}