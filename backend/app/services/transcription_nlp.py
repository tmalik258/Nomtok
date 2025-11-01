import os
import uuid
import redis
import yt_dlp
import asyncio
import tempfile
import subprocess
from datetime import datetime, timedelta
import json
import time
import re
from typing import Optional, Dict, Any, Tuple

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError
from googleapiclient.http import HttpRequest
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build

from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.sql import func, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag, Cuisine, RestaurantCuisine, BusinessStatus
from app.models.video import VideoProcessingStatus
from app.config import (
    GOOGLE_MAPS_API_KEY,
    REDIS_URL,
    TRANSCRIPTION_NLP_LOCK,
    AUDIO_BASE_DIR,
    YOUTUBE_API_KEY,
    YTDLP_COOKIES_FILE,
    TOR_PROXY,
    POT_PROVIDER_METHOD,
    POT_PROVIDER_BASE_URL,
    POT_SCRIPT_PATH,
    POT_DISABLE_INNERTUBE,
    YTDLP_PLAYER_CLIENT,
    YTDLP_COOKIES_FROM_BROWSER,
    YTDLP_BROWSER_PROFILE,
    YTDLP_PROXY,
    YTDLP_GEO_BYPASS,
    YTDLP_GEO_COUNTRY,
)
from app.database import AsyncSessionLocal
from app.services.jobs import JobService
from app.utils.logging import setup_logger
from app.api_schema.jobs import JobUpdateRequest
from app.utils.youtube_cookies import get_cookies_age_hours, refresh_youtube_cookies
from app.utils.ytdlp_error_classifier import classify_ytdlp_error
from app.scripts.gpt_food_place_processor import GPTFoodPlaceProcessor
from app.exceptions import PipelineError

# Setup logging
logger = setup_logger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

# Custom HTTP client to add referer header for YouTube API
class CustomHttpRequest(HttpRequest):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.headers["referer"] = "http://localhost:8030"  # Adjust for your domain

def build_youtube_client():
    """Build YouTube API client with custom referer header."""
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, requestBuilder=CustomHttpRequest)

youtube = build_youtube_client()

async def get_channel_from_video_url(video_url: str) -> Optional[Dict[str, Any]]:
    """Extract channel data from a YouTube video URL.
    
    Args:
        video_url: The YouTube video URL
        
    Returns:
        Dictionary containing channel data or None if not found
    """
    try:
        # Extract video ID from URL
        video_id_match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', video_url)
        if not video_id_match:
            logger.error(f"Could not extract video ID from URL: {video_url}")
            return None
            
        video_id = video_id_match.group(1)
        
        # Get video details to extract channel ID
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: youtube.videos().list(
                part="snippet",
                id=video_id
            ).execute()
        )
        
        if "items" not in response or len(response["items"]) == 0:
            logger.error(f"No video found for ID: {video_id}")
            return None
            
        video_data = response["items"][0]
        snippet = video_data["snippet"]
        channel_id = snippet["channelId"]
        
        # Get channel details
        channel_response = await loop.run_in_executor(
            None,
            lambda: youtube.channels().list(
                part="id,snippet,brandingSettings,statistics",
                id=channel_id
            ).execute()
        )
        
        if "items" not in channel_response or len(channel_response["items"]) == 0:
            logger.error(f"No channel found for ID: {channel_id}")
            return None
            
        channel = channel_response["items"][0]
        banner_url = None
        if "brandingSettings" in channel and "image" in channel["brandingSettings"]:
            banner_url = channel["brandingSettings"]["image"].get("bannerExternalUrl")
            
        return {
            "id": channel["id"],
            "title": channel["snippet"]["title"],
            "description": channel["snippet"].get("description", ""),
            "avatar_url": channel["snippet"]["thumbnails"]["default"]["url"],
            "banner_url": banner_url,
            "subscriber_count": int(channel["statistics"].get("subscriberCount", 0)) if "statistics" in channel else None,
            "youtube_channel_url": f"https://www.youtube.com/channel/{channel_id}"
        }
    except HttpError as e:
        logger.error(f"Error fetching channel data for video URL {video_url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching channel data for video URL {video_url}: {e}")
        return None

async def store_influencer_from_video(db: AsyncSession, video: Video) -> Tuple[Influencer, bool]:
    """Store or update influencer from video data if not already linked.
    
    Args:
        db: Database session
        video: Video object
        
    Returns:
        Tuple of (Influencer object, bool indicating if it's newly created)
    """
    try:
        # Check if video already has an influencer
        if video.influencer_id is not None:
            # Get the existing influencer
            result = await db.execute(
                select(Influencer).filter(Influencer.id == video.influencer_id)
            )
            influencer = result.scalars().first()
            if influencer:
                logger.info(f"Video {video.youtube_video_id} already linked to influencer {influencer.name}")
                return influencer, False
        
        # Get channel data from video URL
        channel_data = await get_channel_from_video_url(video.video_url)
        if not channel_data:
            logger.error(f"Could not retrieve channel data for video {video.youtube_video_id}")
            return None, False  # type: ignore
            
        # Check if influencer already exists by channel ID
        result = await db.execute(
            select(Influencer).filter(Influencer.youtube_channel_id == channel_data["id"])
        )
        influencer = result.scalars().first()
        
        if influencer:
            # Update existing influencer with latest data
            logger.info(f"Updating existing influencer {influencer.name} from video {video.youtube_video_id}")
            influencer.name = channel_data["title"]
            influencer.bio = channel_data["description"]
            influencer.avatar_url = channel_data["avatar_url"]
            influencer.banner_url = channel_data.get("banner_url")
            influencer.subscriber_count = channel_data.get("subscriber_count")
            
            # Link video to influencer if not already linked
            if video.influencer_id != influencer.id:
                video.influencer_id = influencer.id
                db.add(video)
                
            await db.flush()
            return influencer, False
        else:
            # Create new influencer
            logger.info(f"Creating new influencer from video {video.youtube_video_id}")
            new_influencer = Influencer(
                id=uuid.uuid4(),
                name=channel_data["title"],
                youtube_channel_id=channel_data["id"],
                youtube_channel_url=channel_data["youtube_channel_url"],
                bio=channel_data["description"],
                avatar_url=channel_data["avatar_url"],
                banner_url=channel_data.get("banner_url"),
                subscriber_count=channel_data.get("subscriber_count")
            )
            db.add(new_influencer)
            await db.flush()
            await db.refresh(new_influencer)
            
            # Link video to new influencer
            video.influencer_id = new_influencer.id
            db.add(video)
            await db.flush()
            
            return new_influencer, True
    except Exception as e:
        logger.error(f"Error storing influencer from video {video.youtube_video_id}: {e}")
        return None, False  # type: ignore

async def download_audio(video_url: str, video: Video) -> Optional[str]:
    """Download audio from a YouTube video using PO tokens and cookie files.
    PO tokens bypass bot detection, cookies handle authentication, 
    with Tor proxy fallback for geo-restrictions.
    """
    os.makedirs(AUDIO_BASE_DIR, exist_ok=True)

    influencer_name = (
        video.influencer.name.replace(" ", "_").replace("/", "_")
        if video.influencer
        else "unknown"
    )
    influencer_dir = os.path.join(AUDIO_BASE_DIR, influencer_name)
    os.makedirs(influencer_dir, exist_ok=True)

    base_filename = video.youtube_video_id
    final_output_path = os.path.join(influencer_dir, f"{base_filename}_converted.mp3")

    if os.path.exists(final_output_path) and os.path.getsize(final_output_path) > 0:
        logger.info(f"Audio file already exists and has content: {final_output_path}")
        return final_output_path

    loop = asyncio.get_event_loop()

    # Multiple attempts: try different strategies for bot detection and geo-restrictions
    use_tor = False
    max_attempts = 4  # Increased to allow for multiple fallback strategies

    for attempt in range(max_attempts):
        downloaded_file = None
        try:
            logger.info(f"=== ATTEMPT {attempt + 1}/{max_attempts} === downloading audio for {video_url} (tor={use_tor})")

            with tempfile.NamedTemporaryFile(suffix=".%(ext)s", delete=False) as temp_file:
                temp_output_template = temp_file.name

            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": temp_output_template,
                "quiet": False,  # Enable verbose output to see what's happening
                "verbose": True,  # Enable verbose logging
                "retries": 3,
                "fragment_retries": 10,
                # Re-enable postprocessors now that we've identified the real issue
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
                # Add error handling for postprocessors
                "ignoreerrors": False,
                "no_warnings": False,
                # Additional options to handle YouTube bot detection
                "sleep_interval": 1,
                "max_sleep_interval": 5,
                "sleep_interval_requests": 1,
                "sleep_interval_subtitles": 1,
            }

            # Configure PO tokens and cookies
            extractor_args = {}
            
            # Add PO token configuration
            if POT_PROVIDER_METHOD == "http":
                logger.info(f"Using PO token HTTP provider: {POT_PROVIDER_BASE_URL}")
                extractor_args["youtubepot-bgutilhttp"] = f"base_url={POT_PROVIDER_BASE_URL}"
                if POT_DISABLE_INNERTUBE:
                    extractor_args["youtubepot-bgutilhttp"] += ";disable_innertube=1"
            elif POT_PROVIDER_METHOD == "script" and POT_SCRIPT_PATH:
                logger.info(f"Using PO token script provider: {POT_SCRIPT_PATH}")
                extractor_args["youtubepot-bgutilscript"] = f"script_path={POT_SCRIPT_PATH}"
                if POT_DISABLE_INNERTUBE:
                    extractor_args["youtubepot-bgutilscript"] += ";disable_innertube=1"
            
            # Add player client configuration with fallback strategies
            player_client = YTDLP_PLAYER_CLIENT
            if attempt == 0:
                # First attempt: Use configured player client
                if YTDLP_PLAYER_CLIENT:
                    extractor_args["youtube"] = f"player-client={YTDLP_PLAYER_CLIENT}"
                    logger.info(f"Attempt {attempt + 1}: Using configured player client: {YTDLP_PLAYER_CLIENT}")
            elif attempt == 1:
                # Second attempt: Try android client
                extractor_args["youtube"] = "player-client=android"
                logger.info(f"Attempt {attempt + 1}: Using android player client as fallback")
            elif attempt == 2:
                # Third attempt: Try ios client
                extractor_args["youtube"] = "player-client=ios"
                logger.info(f"Attempt {attempt + 1}: Using ios player client as fallback")
            elif attempt >= 3:
                # Fourth+ attempt: Try web client
                extractor_args["youtube"] = "player-client=web"
                logger.info(f"Attempt {attempt + 1}: Using web player client as fallback")
            
            if extractor_args:
                ydl_opts["extractor_args"] = extractor_args
                logger.info(f"Extractor args for attempt {attempt + 1}: {extractor_args}")
            
            # Add cookie configuration
            if get_cookies_age_hours() > 24:
                logger.info("Cookies stale; refreshing...")
                await refresh_youtube_cookies()
            
            if YTDLP_COOKIES_FILE and os.path.exists(YTDLP_COOKIES_FILE):
                ydl_opts["cookiefile"] = YTDLP_COOKIES_FILE
                logger.info(f"Using cookie file: {YTDLP_COOKIES_FILE}")
            else:
                logger.warning("No valid cookie file found - this may cause authentication issues")
            
            # Force cookie refresh if authentication fails
            # logger.info("Forcing cookie refresh to ensure fresh authentication")
            # await refresh_youtube_cookies()
            
            if YTDLP_COOKIES_FILE and os.path.exists(YTDLP_COOKIES_FILE):
                ydl_opts["cookiefile"] = YTDLP_COOKIES_FILE
                logger.info(f"Using refreshed cookie file: {YTDLP_COOKIES_FILE}")
            # elif YTDLP_COOKIES_FROM_BROWSER:
            #     # Handle browser profile properly - if None or empty, use just the browser name
            #     if YTDLP_BROWSER_PROFILE and YTDLP_BROWSER_PROFILE.strip():
            #         ydl_opts["cookiesfrombrowser"] = (YTDLP_COOKIES_FROM_BROWSER, YTDLP_BROWSER_PROFILE)
            #         logger.info(f"Using cookies from browser: {YTDLP_COOKIES_FROM_BROWSER} with profile: {YTDLP_BROWSER_PROFILE}")
            #     else:
            #         ydl_opts["cookiesfrombrowser"] = (YTDLP_COOKIES_FROM_BROWSER,)
            #         logger.info(f"Using cookies from browser: {YTDLP_COOKIES_FROM_BROWSER} (default profile)")
            
            # Add proxy configuration
            if use_tor and TOR_PROXY:
                ydl_opts["proxy"] = TOR_PROXY
                logger.info(f"Using Tor proxy: {TOR_PROXY}")
            elif YTDLP_PROXY:
                ydl_opts["proxy"] = YTDLP_PROXY
                logger.info(f"Using proxy: {YTDLP_PROXY}")
            
            # Disable geo-bypass configuration to fix tuple unpacking error
            # The error occurs in yt-dlp's GeoUtils.random_ipv4 function when parsing IP blocks
            ydl_opts["geo_bypass"] = False
            # if YTDLP_GEO_BYPASS:
            #     ydl_opts["geo_bypass"] = True
            #     if YTDLP_GEO_COUNTRY:
            #         ydl_opts["geo_bypass_country"] = YTDLP_GEO_COUNTRY
            #         logger.info(f"Using geo-bypass for country: {YTDLP_GEO_COUNTRY}")
            
            logger.info(f"yt-dlp options configured: format={ydl_opts.get('format')}, cookies={'cookiefile' in ydl_opts or 'cookiesfrombrowser' in ydl_opts}, proxy={'proxy' in ydl_opts}")
            
            # Download the audio
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Starting yt-dlp extract_info for {video_url}")
                logger.info(f"ydl_opts configuration: {ydl_opts}")
                
                def extract_info_wrapper():
                    logger.info("Inside extract_info_wrapper, about to call ydl.extract_info")
                    try:
                        # Try with download=False first to see if it's a download-related issue
                        logger.info("First attempting extract_info with download=False")
                        info_no_download = ydl.extract_info(video_url, download=False)
                        logger.info(f"extract_info (no download) succeeded, info type: {type(info_no_download)}")
                        
                        # Now try with download=True
                        logger.info("Now attempting extract_info with download=True")
                        result = ydl.extract_info(video_url, download=True)
                        logger.info(f"extract_info (with download) returned successfully, result type: {type(result)}")
                        return result
                    except Exception as wrapper_e:
                        logger.error(f"Exception inside extract_info_wrapper: {wrapper_e}")
                        logger.error(f"Exception type: {type(wrapper_e)}")
                        import traceback
                        logger.error(f"Full traceback: {traceback.format_exc()}")
                        raise
                
                try:
                    info = await loop.run_in_executor(None, extract_info_wrapper)
                    logger.info(f"yt-dlp extract_info completed successfully, info type: {type(info)}")
                    logger.info(f"Info keys: {list(info.keys()) if isinstance(info, dict) else 'Not a dict'}")
                except Exception as e:
                    logger.error(f"Error in yt-dlp extract_info executor: {e}")
                    logger.error(f"Exception type: {type(e)}")
                    import traceback
                    logger.error(f"Full traceback: {traceback.format_exc()}")
                    raise
                
                logger.info(f"Calling ydl.prepare_filename with info type: {type(info)}")
                try:
                    filename_result = ydl.prepare_filename(info)
                    logger.info(f"prepare_filename result: {filename_result}, type: {type(filename_result)}")
                    
                    # Handle FFmpegExtractAudio postprocessor - it converts to .mp3
                    # Remove the original extension and add .mp3
                    base_path = filename_result
                    if ".%(ext)s" in base_path:
                        base_path = base_path.replace(".%(ext)s", "")
                    else:
                        # Remove existing extension if present
                        base_path = os.path.splitext(base_path)[0]
                    
                    downloaded_file = f"{base_path}.mp3"
                    logger.info(f"Expected MP3 file path: {downloaded_file}")
                except Exception as e:
                    logger.error(f"Error in prepare_filename: {e}")
                    raise
                
                if not os.path.exists(downloaded_file):
                    logger.info(f"MP3 file {downloaded_file} does not exist, trying alternative paths and extensions")
                    
                    # First try the original filename with different extensions
                    filename_result = ydl.prepare_filename(info)
                    base_path = filename_result
                    if ".%(ext)s" in base_path:
                        base_path = base_path.replace(".%(ext)s", "")
                    else:
                        base_path = os.path.splitext(base_path)[0]
                    
                    # Try different extensions that FFmpeg might produce
                    for ext in [".mp3", ".m4a", ".webm", ".mp4", ".wav"]:
                        alt_file = f"{base_path}{ext}"
                        logger.info(f"Checking alternative file: {alt_file}")
                        if os.path.exists(alt_file):
                            downloaded_file = alt_file
                            logger.info(f"Found alternative file: {alt_file}")
                            break
                    else:
                        # List files in the temp directory for debugging
                        temp_dir = os.path.dirname(base_path)
                        if os.path.exists(temp_dir):
                            temp_files = os.listdir(temp_dir)
                            logger.error(f"Files in temp directory {temp_dir}: {temp_files}")
                        raise Exception("Downloaded file not found")

            logger.info(f"Downloaded temporary file: {downloaded_file}")

            # Convert with FFmpeg
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                downloaded_file,
                "-ar",
                "16000",
                "-ac",
                "1",
                "-y",
                final_output_path,
            ]
            await loop.run_in_executor(
                None,
                lambda: subprocess.run(ffmpeg_command, check=True, capture_output=True, text=True),
            )

            # Cleanup
            if os.path.exists(downloaded_file):
                os.remove(downloaded_file)

            if os.path.exists(final_output_path) and os.path.getsize(final_output_path) > 0:
                logger.info(f"Audio successfully converted and saved to: {final_output_path}")
                return final_output_path
            else:
                raise Exception("Converted file is empty or doesn't exist")

        except yt_dlp.utils.DownloadError as e:
            err = str(e)
            logger.error(f"Download error for {video_url}: {err}")

            # Detect geo-restriction; fallback to Tor on next attempt
            err_l = err.lower()
            geo_hit = (
                "not made this video available in your country" in err_l
                or "available in your country" in err_l
                or "video is not available in your country" in err_l
            )
            if geo_hit and not use_tor and attempt < max_attempts - 1:
                logger.warning("Geo-restriction detected; will retry with Tor proxy")
                use_tor = True
                # Cleanup and retry
                if downloaded_file and os.path.exists(downloaded_file):
                    os.remove(downloaded_file)
                if os.path.exists(final_output_path):
                    os.remove(final_output_path)
                await asyncio.sleep(1)
                continue

            # Detect bot detection; try fallback strategies
            bot_detection_hit = (
                "sign in to confirm" in err_l
                or "not a bot" in err_l
                or "confirm you're not a bot" in err_l
            )
            if bot_detection_hit and attempt < max_attempts - 1:
                logger.warning(f"=== BOT DETECTION DETECTED === on attempt {attempt + 1}, trying fallback strategies")
                
                # Try different fallback strategies based on attempt number
                if attempt == 0:
                    # First fallback: Try with different player client
                    logger.info("=== FALLBACK 1 === Trying with android player client")
                    # This will be handled by the retry loop with modified extractor_args
                elif attempt == 1:
                    # Second fallback: Try with Tor proxy
                    logger.info("=== FALLBACK 2 === Trying with Tor proxy")
                    use_tor = True
                elif attempt == 2:
                    # Third fallback: Try with ios player client and Tor
                    logger.info("=== FALLBACK 3 === Trying with ios player client and Tor")
                    use_tor = True
                
                # Cleanup and retry
                if downloaded_file and os.path.exists(downloaded_file):
                    os.remove(downloaded_file)
                if os.path.exists(final_output_path):
                    os.remove(final_output_path)
                
                # Add exponential backoff delay for bot detection
                delay = 2 ** attempt
                logger.info(f"=== WAITING === {delay} seconds before retry due to bot detection")
                await asyncio.sleep(delay)
                continue

            # Detect geo-restriction; try fallback strategies
            geo_restricted = (
                "video is not available in your country" in err_l
                or "this video is not available" in err_l
                or "geo" in err_l
            )
            if geo_restricted and attempt < max_attempts - 1:
                logger.warning(f"=== GEO-RESTRICTION DETECTED === on attempt {attempt + 1}, trying fallback strategies")
                use_tor = True
                
                # Cleanup and retry
                if downloaded_file and os.path.exists(downloaded_file):
                    os.remove(downloaded_file)
                if os.path.exists(final_output_path):
                    os.remove(final_output_path)
                
                # Add exponential backoff delay for geo-restriction
                delay = 2 ** attempt
                logger.info(f"=== WAITING === {delay} seconds before retry due to geo-restriction")
                await asyncio.sleep(delay)
                continue

            # Final failure
            cls = classify_ytdlp_error(err)
            details = {
                "video_url": video_url,
                "youtube_video_id": video.youtube_video_id,
                "raw": err,
                "hint": cls.get("hint"),
            }
            raise PipelineError(cls.get("type", "yt_dlp_download"), err, details)

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed for {video_url}: {e.stderr}")
            if downloaded_file and os.path.exists(downloaded_file):
                os.remove(downloaded_file)
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            details = {"video_url": video_url, "stderr": e.stderr}
            raise PipelineError("ffmpeg_failed", "FFmpeg conversion failed", details)

        except Exception as e:
            logger.error(f"Unexpected error for {video_url}: {e}")
            cls = classify_ytdlp_error(str(e))
            details = {
                "video_url": video_url,
                "youtube_video_id": video.youtube_video_id,
                "raw": str(e),
                "hint": cls.get("hint"),
            }
            raise PipelineError(cls.get("type", "unknown"), str(e), details)

async def validate_restaurant(entities: dict) -> dict:
    """Validate restaurant details using Google Maps Places API with referer header."""
    logger.info(f"Validating restaurant using Google Maps: {entities}")
    if not entities.get("restaurant_name") or not entities.get("location"):
        logger.warning("No restaurant name or location found")
        return {"valid": False}

    loop = asyncio.get_event_loop()
    try:
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        result = await loop.run_in_executor(None, lambda: gmaps.places(query=query))
        if result["status"] == "OK" and result["results"]:
            place = result["results"][0]
            logger.info(
                f"Validated restaurant with Google Maps: {place['name']} ({place['place_id']})"
            )
            
            # Extract photo URL from Text Search response (no additional API call needed)
            photo_url = None
            try:
                photos = place.get("photos")
                if photos and len(photos) > 0:
                    photo_reference = photos[0]["photo_reference"]
                    # Construct photo URL using legacy Google Places API format
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_MAPS_API_KEY}"
                    logger.info(f"Found photo for {place['name']}: {photo_url}")
                else:
                    logger.info(f"No photos found for {place['name']}")
            except Exception as photo_error:
                logger.warning(f"Could not extract photo for {place['name']}: {photo_error}")
            
            return {
                "valid": True,
                "name": place["name"],
                "address": place.get("formatted_address", ""),
                "latitude": place["geometry"]["location"]["lat"],
                "longitude": place["geometry"]["location"]["lng"],
                "city": entities["location"].get("city"),
                "country": entities["location"].get("country"),
                "google_place_id": place["place_id"],
                "google_rating": place.get("rating"),
                "business_status": place.get("business_status", BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value),
                "photo_url": photo_url,
                "confidence_score": entities.get("confidence_score", 0.8),
                "tags": entities.get("tags", []),
                "cuisines": entities.get("cuisines", []),
            }
        return {"valid": False}
    except ApiError as e:
        logger.error(f"Error validating restaurant with Google Maps: {e}")
        return {"valid": False}

async def store_restaurant_and_listing(
    db: AsyncSession, video: Video, entities: dict, validated: dict
):
    """Store restaurant, listing, and tags in the database."""
    try:
        logger.info(f"Storing restaurant and listing for video {video.youtube_video_id}")
        if validated["valid"]:
            # Check for existing restaurant
            result = await db.execute(
                select(Restaurant).filter(
                    Restaurant.google_place_id == validated["google_place_id"]
                )
            )
            restaurant = result.scalars().first()
            if not restaurant:
                restaurant = Restaurant(
                    name=validated["name"],
                    address=validated["address"],
                    latitude=validated["latitude"],
                    longitude=validated["longitude"],
                    city=validated["city"],
                    country=validated["country"],
                    google_place_id=validated["google_place_id"],
                    google_rating=validated["google_rating"],
                    business_status=validated["business_status"],
                    photo_url=validated["photo_url"],
                    is_active=True,
                )
                db.add(restaurant)
                await db.flush()
                await db.refresh(restaurant)
            else:
                restaurant.business_status = validated["business_status"]
                await db.flush()

            # Store tags
            for tag_name in validated.get("tags", []):
                tag_name = tag_name.lower().strip()
                result = await db.execute(select(Tag).filter(Tag.name == tag_name))
                tag = result.scalars().first()
                if not tag:
                    tag = Tag(id=uuid.uuid4(), name=tag_name)
                    db.add(tag)
                    await db.flush()
                    await db.refresh(tag)

                # Check for existing restaurant_tag
                result = await db.execute(
                    select(RestaurantTag).filter(
                        RestaurantTag.restaurant_id == restaurant.id,
                        RestaurantTag.tag_id == tag.id,
                    )
                )
                if not result.scalars().first():
                    restaurant_tag = RestaurantTag(
                        restaurant_id=restaurant.id, tag_id=tag.id
                    )
                    db.add(restaurant_tag)
                    await db.flush()

            # Store cuisines
            for cuisine_name in validated.get("cuisines", []):
                cuisine_name = cuisine_name.lower().strip()
                result = await db.execute(select(Cuisine).filter(Cuisine.name == cuisine_name))
                cuisine = result.scalars().first()
                if not cuisine:
                    cuisine = Cuisine(id=uuid.uuid4(), name=cuisine_name)
                    db.add(cuisine)
                    await db.flush()
                    await db.refresh(cuisine)

                # Check for existing restaurant_cuisine
                result = await db.execute(
                    select(RestaurantCuisine).filter(
                        RestaurantCuisine.restaurant_id == restaurant.id,
                        RestaurantCuisine.cuisine_id == cuisine.id,
                    )
                )
                if not result.scalars().first():
                    restaurant_cuisine = RestaurantCuisine(
                        restaurant_id=restaurant.id, cuisine_id=cuisine.id
                    )
                    db.add(restaurant_cuisine)
                    await db.flush()

            # Store listing
            if not isinstance(db, AsyncSession):
                raise ValueError("db is not an AsyncSession instance")

            result = await db.execute(
                select(Listing)
                .filter(Listing.restaurant_id == restaurant.id)
                .filter(Listing.video_id == video.id)
                .filter(Listing.influencer_id == video.influencer_id)
            )
            existing_listing = result.scalar()
            if existing_listing:
                logger.warning(
                    f"Listing already exists for video {video.youtube_video_id}"
                )
                if existing_listing.visit_date is None:
                    existing_listing.visit_date = video.published_at.date()
                
                # Handle new review sections format only
                if "review_sections" in entities:
                    existing_listing.review_sections = entities["review_sections"]
                
                existing_listing.confidence_score = validated["confidence_score"]
                await db.flush()
                return

            listing = Listing(
                restaurant_id=restaurant.id,
                video_id=video.id,
                influencer_id=video.influencer_id,
                visit_date=video.published_at.date() if video.published_at else None,
                review_sections=entities.get("review_sections"),
                confidence_score=validated["confidence_score"],
                approved=False,  # Requires admin approval
            )
            db.add(listing)
            await db.flush()
            logger.info(
                f"Stored restaurant {restaurant.name}, tags, and listing for video {video.youtube_video_id}"
            )
        else:
            logger.warning(
                f"Skipped storing restaurant and listing for video {video.youtube_video_id} (invalid)"
            )
    except HTTPException as e:
        logger.error(
            f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}"
        )
        raise
    except Exception as e:
        logger.error(
            f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}"
        )
        raise # Let the outer transaction handle the rollback

async def process_video(video: Video):
    """Process a single video: transcribe, extract entities, validate, and store."""
    async with AsyncSessionLocal() as db:  # Create a new session for each video
        async with db.begin():  # Start a transaction for the entire process
            try:
                logger.info(f"Processing video {video.youtube_video_id}")

                # Merge the video object into the new session
                video = await db.merge(video)
                
                # Retrieve influencer data if not already linked
                if not video.influencer_id:
                    logger.info(f"No influencer linked to video {video.youtube_video_id}, retrieving channel data...")
                    try:
                        logger.info(f"Calling store_influencer_from_video for video {video.youtube_video_id}")
                        result = await store_influencer_from_video(db, video)
                        logger.info(f"store_influencer_from_video returned: {result}, type: {type(result)}")
                        
                        # Check if result is a tuple before unpacking
                        if isinstance(result, tuple) and len(result) == 2:
                            influencer, is_new = result
                            logger.info(f"Successfully unpacked tuple: influencer={influencer}, is_new={is_new}")
                        else:
                            logger.error(f"store_influencer_from_video returned unexpected format: {result}")
                            influencer, is_new = None, False
                        
                        if influencer:
                            logger.info(f"{'Created new' if is_new else 'Linked existing'} influencer {influencer.name} for video {video.youtube_video_id}")
                        else:
                            logger.warning(f"Could not retrieve influencer data for video {video.youtube_video_id}")
                    except Exception as e:
                        logger.error(f"Failed to store influencer for video {video.youtube_video_id}: {e}")
                        logger.error(f"Exception type: {type(e)}")
                        import traceback
                        logger.error(f"Traceback: {traceback.format_exc()}")
                        # Continue processing without influencer data

                transcription = video.transcription or ""

                gpt_processor = GPTFoodPlaceProcessor()

                # If no transcription, download and transcribe
                if not transcription:
                    logger.info(
                        f"No transcription found for video {video.youtube_video_id}, downloading and transcribing..."
                    )
                    audio_path = await download_audio(video.video_url, video)
                    if audio_path is None:
                        logger.error(f"No audio file downloaded for video {video.youtube_video_id}")
                        raise PipelineError("audio_download_failed", "Audio download returned None", {"video_id": video.youtube_video_id})
                    transcription = await gpt_processor.transcribe_audio(audio_path)

                    logger.info(
                        f"Transcription completed for video {video.youtube_video_id}: {transcription[:255]}..."
                    )

                    # Update video with transcription
                    video.transcription = transcription
                    db.add(video)
                    await db.flush()

                # Extract entities
                entities_list = await gpt_processor.extract_entities(video.description, transcription)
                if not entities_list:
                    logger.info(
                        f"No restaurant entities found for video {video.youtube_video_id}"
                    )
                    # Treat videos with no entities as successfully processed
                    video.status = VideoProcessingStatus.COMPLETED
                    db.add(video)
                    await db.flush()
                    logger.info(f"Marked video {video.youtube_video_id} as completed (no entities)")
                    return True
                logger.info(
                    f"Entities extracted for video {video.youtube_video_id}: {entities_list}"
                )

                for entity in entities_list:
                    # Validate with Google Maps
                    validated = await validate_restaurant(entity)
                    if not validated["valid"]:
                        logger.info(
                            f"No valid restaurant found for video {video.youtube_video_id}"
                        )
                        continue
                    logger.info(
                        f"Validated restaurant for video {video.youtube_video_id}: {validated}"
                    )

                    # Store restaurant, tags, and listing
                    await store_restaurant_and_listing(db, video, entity, validated)

                logger.info(
                    f"Stored restaurant, tags, and listing for video {video.youtube_video_id}"
                )
                
                # Mark video as completed
                video.status = VideoProcessingStatus.COMPLETED
                db.add(video)
                await db.flush()
                logger.info(f"Marked video {video.youtube_video_id} as completed")
                
                return True  # Return success value
            except Exception as e:
                logger.error(f"Error processing video {video.youtube_video_id}: {e}")
                # Set failure status and error message before propagating
                try:
                    video.status = VideoProcessingStatus.FAILED
                    video.error_message = str(e)
                    db.add(video)
                    await db.flush()
                except Exception as _status_err:
                    logger.warning(f"Failed to set video status to FAILED: {_status_err}")
                raise  # Let the transaction rollback automatically

async def transcription_nlp_pipeline(db: AsyncSession, video_ids: Optional[list] = None, job_id: Optional[uuid.UUID] = None):
    """Main pipeline to process videos with job tracking."""
    start_time = time.time()
    processed_videos = 0
    failed_videos = 0
    errors_list: list[dict] = []
    
    try:
        # Limit to 4-5 concurrent downloads to avoid rate limits
        semaphore = asyncio.Semaphore(5)  # Only 5 concurrent downloads

        # Select videos to process
        if video_ids:
            result = await db.execute(
                select(Video)
                .filter(Video.id.in_(video_ids))
                .options(selectinload(Video.influencer))
            )
        else:
            result = await db.execute(
                select(Video)
                .join(Influencer)
                .distinct(Influencer.id)
                .order_by(
                    Influencer.id,
                    case(
                        (Video.transcription.is_(None), 1),
                        else_=0
                    ).asc(),  # Videos with transcriptions (non-null) come first
                    func.length(Video.transcription).asc(),  # Sort by transcription length (smallest to largest)
                    Video.published_at.desc()
                )
                .options(selectinload(Video.influencer))
            )
        
        videos = result.scalars().all()
        total_videos = len(videos)

        if not videos:
            logger.info("No videos to process")
            if job_id:
                result_data = {"message": "No videos to process", "total_videos": 0}
                job_data = JobUpdateRequest(result_data=json.dumps(result_data))
                await JobService.update_job(db, job_id, job_data)
            return {"message": "No videos to process", "total_videos": 0}

        logger.info(f"Selected {total_videos} videos for processing")
        
        # Initialize job tracking
        if job_id:
            await JobService.update_tracking_stats(db, job_id,
                queue_size=total_videos,
                items_in_progress=0,
                failed_items=0
            )
            await JobService.update_progress(db, job_id, 0, total_videos)

        async def process_with_semaphore(video):
            nonlocal processed_videos, failed_videos, errors_list
            
            async with semaphore:
                try:
                    # Update heartbeat and check for cancellation
                    if job_id:
                        await JobService.update_heartbeat(db, job_id)
                        
                        # Check for cancellation
                        current_job = await JobService.get_job(db, job_id)
                        if current_job and current_job.cancellation_requested:
                            logger.info(f"Job {job_id} cancellation requested, stopping pipeline")
                            await JobService.cancel_job(db, job_id)
                            return None
                        
                        # Update items in progress
                        await JobService.update_progress(db, job_id, min(5, total_videos - processed_videos - failed_videos))
                    
                    await asyncio.sleep(1)  # Add 1-second delay between downloads
                    logger.info(f"Processing video {video.id} ({video.youtube_video_id})")
                    result = await process_video(video)
                    logger.info(f"Video {video.id} ({video.youtube_video_id}) processed successfully")
                    processed_videos += 1
                    
                    # Update progress and processing rate
                    if job_id:
                        elapsed_time = time.time() - start_time
                        processing_rate = processed_videos / (elapsed_time / 60) if elapsed_time > 0 else 0
                        
                        await JobService.update_progress(db, job_id, processed_videos + failed_videos, total_videos)
                        await JobService.update_tracking_stats(db, job_id,
                            processing_rate=processing_rate
                        )
                        
                        # Estimate completion time
                        if processing_rate > 0:
                            remaining_items = total_videos - processed_videos - failed_videos
                            estimated_minutes = remaining_items / processing_rate
                            estimated_completion = datetime.now() + timedelta(minutes=estimated_minutes)
                            job_data = JobUpdateRequest(estimated_completion_time=estimated_completion)
                            await JobService.update_job(db, job_id, job_data)
                    
                    # Return True for successful processing
                    return True
                    
                except Exception as e:
                    failed_videos += 1
                    if job_id:
                        await JobService.update_tracking_stats(db, job_id, failed_items=failed_videos)
                    logger.error(f"Error processing video {video.id}: {e}")
                    # Collect structured error info
                    try:
                        if isinstance(e, PipelineError):
                            err_info = {
                                "type": e.error_type,
                                "message": str(e),
                                "video_id": getattr(video, "youtube_video_id", None),
                                "details": e.details or {},
                            }
                            # Prefer raw error message from yt-dlp/exception if available
                            raw_msg = None
                            try:
                                raw_msg = (e.details or {}).get("raw") if isinstance(e.details, dict) else None
                            except Exception:
                                raw_msg = None
                            msg_to_append = raw_msg or str(e)
                        else:
                            cls = classify_ytdlp_error(str(e))
                            err_info = {
                                "type": cls.get("type", "unknown"),
                                "message": str(e),
                                "video_id": getattr(video, "youtube_video_id", None),
                                "details": {
                                    "hint": cls.get("hint"),
                                    "raw": str(e)
                                },
                            }
                            # Prefer raw error string over classifier hint for actionable detail
                            msg_to_append = str(e)
                        errors_list.append(err_info)
                        # Update job with latest error message immediately for visibility
                        if job_id and msg_to_append:
                            try:
                                await JobService.append_error_message(db, job_id, msg_to_append)
                            except Exception as _update_err:
                                logger.warning(f"Failed to append error message: {_update_err}")
                        # Persist FAILED status and error_message for the video
                        try:
                            v_stmt = select(Video).where(Video.id == video.id)
                            v_res = await db.execute(v_stmt)
                            v_obj = v_res.scalar_one_or_none()
                            if v_obj:
                                v_obj.status = VideoProcessingStatus.FAILED
                                v_obj.error_message = msg_to_append or str(e)
                                db.add(v_obj)
                                await db.commit()
                        except Exception as _persist_err:
                            logger.warning(f"Failed to persist FAILED status for video {getattr(video, 'id', None)}: {_persist_err}")
                    except Exception:
                        # Fallback minimal error record
                        errors_list.append({
                            "type": "unknown",
                            "message": str(e),
                            "video_id": getattr(video, "youtube_video_id", None),
                        })
                    return e

        # Process videos concurrently
        tasks = [process_with_semaphore(video) for video in videos]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        successful = sum(1 for r in results if r is not None and not isinstance(r, Exception))
        failed = len(results) - successful

        # Build error summary by type
        summary: dict[str, int] = {}
        for er in errors_list:
            tp = er.get("type", "unknown")
            summary[tp] = summary.get(tp, 0) + 1
        logger.info(f"Transcription and NLP pipeline completed: {successful} successful, {failed} failed")
        
        # Final job update
        # Build result_data including error summary; errors list returned in result for admin
        summary: dict[str, int] = {}
        for er in errors_list:
            tp = er.get("type", "unknown")
            summary[tp] = summary.get(tp, 0) + 1
        result_data = {
            "videos_processed": successful,
            "total_videos": total_videos,
            "failed_videos": failed,
            "processing_time_minutes": (time.time() - start_time) / 60,
            "concurrency_limit": 5,
            "error_summary": summary,
        }
        
        if job_id:
            # Only update result_data and reset items_in_progress; error_messages appended during processing
            job_data = JobUpdateRequest(
                result_data=json.dumps(result_data)
            )
            await JobService.update_job(db, job_id, job_data)
            await JobService.update_tracking_stats(db, job_id, items_in_progress=0)
            
        # Return result with errors for admin route to act upon
        result_data["errors"] = errors_list
        return result_data
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
        if job_id:
            await JobService.update_tracking_stats(db, job_id, items_in_progress=0)
        
        # Return error information instead of raising
        return {
            "error": str(e),
            "message": "Error in transcription pipeline",
            "success": False
        }
    finally:
        await db.close()
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Ensure lock is released
