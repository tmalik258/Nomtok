import json
import time
import redis
import asyncio
import os
from pathlib import Path

from fastapi import (APIRouter, Depends, HTTPException, status, UploadFile, File)

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import (REDIS_URL, SCRAPE_YOUTUBE_LOCK, TRANSCRIPTION_NLP_LOCK, REFRESH_YOUTUBE_COOKIES_LOCK, INFLUENCER_CHANNELS, YTDLP_COOKIES_FILE)
from app.database import (AsyncSessionLocal, get_async_db)
from app.services import (scrape_youtube, transcription_nlp_pipeline, JobService)
from app.models.job import JobType, LockType
from app.dependencies import get_current_admin
from app.utils.logging import setup_logger
from app.api_schema.jobs import JobCreateRequest
from app.api_schema.process import ScrapeRequest
from app.utils.youtube_cookies import refresh_youtube_cookies, get_cookies_age_hours

router = APIRouter()

logger = setup_logger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

@router.post("/scrape-youtube/")
async def trigger_scrape(
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Trigger YouTube scraping asynchronously with Redis lock and job tracking."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(SCRAPE_YOUTUBE_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube scraping is already running. Please wait until the current task completes."
        )
    
    # Create a job to track this process
    job_description = "Scraping videos from YouTube channels"

    job_data = JobCreateRequest(
        job_type=JobType.SCRAPE_YOUTUBE,
        title="YouTube Video Scraping",
        description=job_description,
        redis_lock_key=SCRAPE_YOUTUBE_LOCK,
        trigger_type=LockType.SYSTEM
    )
    
    job = await JobService.create_job(db, job_data)
    job_id = job.id
    
    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(SCRAPE_YOUTUBE_LOCK, 3600, "locked")
    
    async def run_scrape():
        start_time = time.time()
        last_heartbeat = start_time
        
        # Create a new async session for the background task
        async with AsyncSessionLocal() as task_session:
            try:
                # Start the job
                await JobService.start_job(task_session, job_id)
                
                # Initialize progress tracking
                await JobService.update_progress(task_session, job_id, 0, 0)
                await JobService.update_queue_metrics(task_session, job_id, len(INFLUENCER_CHANNELS), 0)
                
                async def monitored_scrape():
                    nonlocal last_heartbeat
                    
                    # Check for cancellation
                    current_job = await JobService.get_job(task_session, job_id)
                    if current_job and current_job.cancellation_requested:
                        await JobService.cancel_job(task_session, job_id, "Job cancelled by user request")
                        redis_client.delete(SCRAPE_YOUTUBE_LOCK)
                        return {"cancelled": True}
                    
                    # Heartbeat update
                    await JobService.update_heartbeat(task_session, job_id)
                    
                    logger.info(f"Heartbeat: {time.time() - last_heartbeat:.2f} seconds since last update")

                    # Run the actual pipeline
                    return await scrape_youtube(task_session, job_id)
                
                result = await monitored_scrape()
                
                if result and result.get("cancelled"):
                    return
                
                # Complete the job
                elapsed_time = time.time() - start_time
                result_data = json.dumps({
                    "message": "YouTube scraping completed successfully",
                    "elapsed_time": elapsed_time,
                    "channels_processed": result.get("channels_processed", 0) if result else 0,
                    "videos_processed": result.get("videos_processed", 0) if result else 0,
                    "failed_channels": result.get("failed_channels", 0) if result else 0
                })
                await JobService.complete_job(task_session, job_id, result_data)
                
            except Exception as e:
                # Check if it's a cancellation
                if "cancelled" in str(e).lower():
                    await JobService.cancel_job(task_session, job_id, str(e))
                    logger.info(f"Scrape YouTube job cancelled: {e}")
                else:
                    await JobService.fail_job(task_session, job_id, str(e))
                    logger.error(f"Scrape YouTube job failed: {e}")
                raise
            finally:
                redis_client.delete(SCRAPE_YOUTUBE_LOCK)  # Release lock when done
    
    task = asyncio.create_task(run_scrape())
    
    return {
        "message": "YouTube scraping started in the background",
        "task_id": id(task),
        "job_id": str(job_id),
        "influencer_count": len(INFLUENCER_CHANNELS)
    }

@router.post("/transcription-nlp/")
async def trigger_transcription_nlp(
    request: ScrapeRequest = ScrapeRequest(),
    release_lock: bool = False,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Trigger asynchronous video transcription and NLP processing with Redis lock and job tracking."""
    if release_lock:
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock if requested
        # return {"message": "Redis lock released successfully"}

    # Try to acquire the lock (non-blocking)
    if redis_client.get(TRANSCRIPTION_NLP_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Video transcription and NLP processing is already running. Please wait until the current task completes."
        )

    # Create a job to track this process
    job_description = (
        f"Processing {len(request.video_ids)} specific videos for transcription and NLP"
        if request.video_ids
        else "Processing video transcriptions and extracting restaurant information using NLP"
    )
    
    job_data = JobCreateRequest(
        job_type=JobType.TRANSCRIPTION_NLP,
        title="Video Transcription & NLP Processing",
        description=job_description,
        redis_lock_key=TRANSCRIPTION_NLP_LOCK,
        trigger_type=request.trigger_type
    )
    
    # Create job and get the ID - use the session only for this
    job = await JobService.create_job(db, job_data)
    job_id = job.id  # Store the job ID

    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(TRANSCRIPTION_NLP_LOCK, 3600, "locked")

    async def run_pipeline():
        start_time = time.time()
        last_heartbeat = start_time
        
        # Create a new session for the background task
        async with AsyncSessionLocal() as task_session:
            try:
                # Start the job
                await JobService.start_job(task_session, job_id)
                
                # Initialize progress tracking
                await JobService.update_progress(task_session, job_id, 0, 0)
                
                async def monitored_pipeline():
                    nonlocal last_heartbeat
                    
                    # Use the task_session for all operations
                    # Check for cancellation before starting
                    current_job = await JobService.get_job(task_session, job_id)
                    if current_job and current_job.cancellation_requested:
                        await JobService.cancel_job(task_session, job_id, "Job cancelled by user request")
                        redis_client.delete(TRANSCRIPTION_NLP_LOCK)
                        return {"cancelled": True}
                    
                    # Heartbeat update
                    await JobService.update_heartbeat(task_session, job_id)
                    
                    # Run pipeline with job tracking and video_ids
                    result = await transcription_nlp_pipeline(task_session, video_ids=request.video_ids or [], job_id=job_id)
                    return result
                
                result = await monitored_pipeline()
                
                if result and result.get("cancelled"):
                    return
                
                if result and result.get("failed_videos") == result.get("total_videos"):
                    # If all failed, fail job with detailed errors
                    details = {
                        "summary": result.get("error_summary"),
                        "errors": result.get("errors"),
                        "videos_processed": result.get("videos_processed"),
                        "total_videos": result.get("total_videos"),
                        "failed_videos": result.get("failed_videos"),
                    }
                    await JobService.fail_job(task_session, job_id, json.dumps(details))
                    raise Exception(f"Transcription and NLP pipeline completed with {result.get('failed_videos')} failures.")
                
                # Complete the job
                elapsed_time = time.time() - start_time
                result_data = json.dumps({
                    "message": "Video transcription and NLP processing completed successfully",
                    "elapsed_time": elapsed_time,
                    "videos_processed": result.get("videos_processed", 0) if result else 0,
                    "total_videos": result.get("total_videos", 0) if result else 0,
                    "failed_videos": result.get("failed_videos", 0) if result else 0,
                    "error_summary": result.get("error_summary"),
                    "errors": result.get("errors"),
                })
                await JobService.complete_job(task_session, job_id, result_data)
                
            except Exception as e:
                # Check if it's a cancellation
                if "cancelled" in str(e).lower():
                    await JobService.cancel_job(task_session, job_id)
                    logger.info(f"Transcription and NLP pipeline cancelled: {str(e)}")
                else:
                    await JobService.fail_job(task_session, job_id, str(e))
                    logger.error(f"Transcription and NLP pipeline failed: {str(e)}")
                raise
            finally:
                redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock when done

    task = asyncio.create_task(run_pipeline())
    
    response_message = (
        f"Video transcription and NLP processing started for {len(request.video_ids)} specific videos"
        if request.video_ids
        else "Video transcription and NLP processing started in the background"
    )
    
    return {
        "message": response_message, 
        "task_id": id(task),
        "job_id": str(job_id),
        "video_count": len(request.video_ids) if request.video_ids else None
    }

@router.post("/refresh-youtube-cookies/")
async def trigger_refresh_youtube_cookies(
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Trigger YouTube cookies refresh with Redis lock and job tracking."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(REFRESH_YOUTUBE_COOKIES_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube cookies refresh is already running. Please wait until the current task completes."
        )

    job_description = "Refreshing YouTube cookies via automated login"
    job_data = JobCreateRequest(
        job_type=JobType.REFRESH_YOUTUBE_COOKIES,
        title="YouTube Cookies Refresh",
        description=job_description,
        redis_lock_key=REFRESH_YOUTUBE_COOKIES_LOCK,
        trigger_type=LockType.SYSTEM
    )

    job = await JobService.create_job(db, job_data)
    job_id = job.id

    # Set the lock with a 30-minute TTL (cookie refresh should be quicker)
    redis_client.setex(REFRESH_YOUTUBE_COOKIES_LOCK, 1800, "locked")

    async def run_refresh_task():
        start_time = time.time()
        async with AsyncSessionLocal() as task_session:
            try:
                await JobService.start_job(task_session, job_id)
                await JobService.update_progress(task_session, job_id, 0, 0)

                success = await refresh_youtube_cookies(headless=True)

                if not success:
                    await JobService.fail_job(task_session, job_id, "Failed to refresh YouTube cookies")
                    raise Exception("Failed to refresh YouTube cookies")

                elapsed_time = time.time() - start_time
                result_data = json.dumps({
                    "message": "YouTube cookies refreshed successfully",
                    "elapsed_time": elapsed_time,
                })
                await JobService.complete_job(task_session, job_id, result_data)
            except Exception as e:
                if "cancelled" in str(e).lower():
                    await JobService.cancel_job(task_session, job_id, str(e))
                    logger.info(f"YouTube cookies refresh cancelled: {e}")
                else:
                    await JobService.fail_job(task_session, job_id, str(e))
                    logger.error(f"YouTube cookies refresh failed: {e}")
                raise
            finally:
                redis_client.delete(REFRESH_YOUTUBE_COOKIES_LOCK)

    task = asyncio.create_task(run_refresh_task())

    return {
        "message": "YouTube cookies refresh started in the background",
        "task_id": id(task),
        "job_id": str(job_id),
    }

@router.get("/youtube-cookies-status/")
async def youtube_cookies_status(
    admin_user = Depends(get_current_admin)
):
    """Return the age in hours since the last cookies refresh."""
    age_hours = get_cookies_age_hours()
    return {"age_hours": age_hours}

@router.post("/upload-youtube-cookies/")
async def upload_youtube_cookies(
    file: UploadFile = File(...),
    admin_user = Depends(get_current_admin)
):
    """Upload a cookies.txt file and save to configured path."""
    if not YTDLP_COOKIES_FILE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="YTDLP_COOKIES_FILE is not configured")

    # Ensure directory exists
    target_dir = os.path.dirname(str(YTDLP_COOKIES_FILE))
    try:
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create directory {target_dir}: {e}")

    # Save the uploaded file
    try:
        content = await file.read()
        with open(str(YTDLP_COOKIES_FILE), "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save uploaded cookies: {e}")

    return {"message": "Cookies uploaded successfully", "target_path": str(YTDLP_COOKIES_FILE)}
