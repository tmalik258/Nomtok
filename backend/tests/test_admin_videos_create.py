import uuid
import pytest
from datetime import datetime

from app.database import AsyncSessionLocal
from app.models.influencer import Influencer
from app.models.video import Video
from app.routes.admin.videos import create_video
from app.api_schema.videos import VideoCreateFromUrl
from sqlalchemy import select, delete
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_create_video_with_existing_influencer(monkeypatch):
    """Create video from URL when influencer exists; associates correctly."""
    test_video_id = "unit_test_vid_existing"
    test_channel_id = "UC_UNIT_TEST_EXISTING"
    test_channel_title = "Unit Test Channel Existing"

    # Mock YouTube metadata
    def mock_get_video_metadata(video_id: str):
        assert video_id == test_video_id
        return {
            "youtube_video_id": video_id,
            "title": "Unit Test Video",
            "description": "Test description",
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "published_at": "2024-01-01T00:00:00Z",
            "channel_id": test_channel_id,
            "channel_title": test_channel_title,
        }

    from app.services import youtube_scraper
    monkeypatch.setattr(youtube_scraper, "get_video_metadata", mock_get_video_metadata)

    async with AsyncSessionLocal() as db:
        # Ensure influencer exists
        influencer = Influencer(
            id=uuid.uuid4(),
            name=test_channel_title,
            youtube_channel_id=test_channel_id,
            youtube_channel_url=f"https://www.youtube.com/channel/{test_channel_id}",
        )
        db.add(influencer)
        await db.commit()
        await db.refresh(influencer)

        # Create video
        video_data = VideoCreateFromUrl(youtube_url=f"https://youtu.be/{test_video_id}")
        resp = await create_video(video_data=video_data, db=db, current_admin=None)

        assert resp.youtube_video_id == test_video_id
        assert resp.influencer is not None
        assert str(resp.influencer.id) == str(influencer.id)

        # Cleanup
        await db.execute(delete(Video).where(Video.youtube_video_id == test_video_id))
        await db.execute(delete(Influencer).where(Influencer.id == influencer.id))
        await db.commit()


@pytest.mark.asyncio
async def test_create_video_creates_new_influencer(monkeypatch):
    """Create video from URL with no existing influencer; creates new influencer."""
    test_video_id = "unit_test_vid_new"
    test_channel_id = "UC_UNIT_TEST_NEW"
    test_channel_title = "Unit Test Channel New"

    def mock_get_video_metadata(video_id: str):
        assert video_id == test_video_id
        return {
            "youtube_video_id": video_id,
            "title": "Unit Test Video",
            "description": "Test description",
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "published_at": "2024-01-01T00:00:00Z",
            "channel_id": test_channel_id,
            "channel_title": test_channel_title,
        }

    from app.services import youtube_scraper
    monkeypatch.setattr(youtube_scraper, "get_video_metadata", mock_get_video_metadata)

    async with AsyncSessionLocal() as db:
        # Ensure influencer does not exist
        result = await db.execute(select(Influencer).where(Influencer.youtube_channel_id == test_channel_id))
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(delete(Influencer).where(Influencer.id == existing.id))
            await db.commit()

        # Create video (should auto-create influencer)
        video_data = VideoCreateFromUrl(youtube_url=f"https://youtu.be/{test_video_id}")
        resp = await create_video(video_data=video_data, db=db, current_admin=None)

        assert resp.youtube_video_id == test_video_id
        assert resp.influencer is not None
        assert resp.influencer.youtube_channel_id == test_channel_id

        # Cleanup
        await db.execute(delete(Video).where(Video.youtube_video_id == test_video_id))
        await db.execute(delete(Influencer).where(Influencer.youtube_channel_id == test_channel_id))
        await db.commit()


@pytest.mark.asyncio
async def test_create_video_invalid_metadata(monkeypatch):
    """Error case: metadata missing channel_id should return 400."""
    test_video_id = "unit_test_vid_bad"

    def mock_get_video_metadata(video_id: str):
        assert video_id == test_video_id
        return {
            "youtube_video_id": video_id,
            "title": "Unit Test Video",
            "description": "Test description",
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "published_at": "2024-01-01T00:00:00Z",
            # Missing channel_id
        }

    from app.services import youtube_scraper
    monkeypatch.setattr(youtube_scraper, "get_video_metadata", mock_get_video_metadata)

    async with AsyncSessionLocal() as db:
        video_data = VideoCreateFromUrl(youtube_url=f"https://youtu.be/{test_video_id}")
        with pytest.raises(HTTPException) as exc:
            await create_video(video_data=video_data, db=db, current_admin=None)
        assert exc.value.status_code == 400
        assert "channel" in exc.value.detail.lower()