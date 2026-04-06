"""Tests for yt-dlp error classification (production download pipeline reporting)."""

import pytest

from app.utils.ytdlp_error_classifier import classify_ytdlp_error


@pytest.mark.parametrize(
    "message_fragment",
    [
        "ERROR: [youtube] x: Requested format is not available. Use --list-formats",
        "requested format is not available",
        "Format is not available",
        "use --list-formats for a list of available formats",
    ],
)
def test_classify_format_unavailable(message_fragment: str) -> None:
    result = classify_ytdlp_error(message_fragment)
    assert result["type"] == "format_unavailable"
    assert "list-formats" in result["hint"].lower() or "format" in result["hint"].lower()


def test_classify_no_media_formats() -> None:
    msg = "Only images are available for download."
    result = classify_ytdlp_error(msg)
    assert result["type"] == "no_media_formats"

