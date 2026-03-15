def classify_ytdlp_error(text: str) -> dict:
    """Classify common yt-dlp/YouTube errors for better reporting."""
    lower = text.lower()
    if "sign in to confirm" in lower or "not a bot" in lower:
        return {
            "type": "auth_captcha",
            "hint": "Use cookies-from-browser and ensure session is logged in.",
        }
    if "cookies are no longer valid" in lower or "cookies" in lower and "invalid" in lower:
        return {
            "type": "cookies_invalid",
            "hint": "Refresh browser cookies or re-export via cookies-from-browser.",
        }
    if "not available in your country" in lower or "unavailable" in lower and "country" in lower:
        return {
            "type": "geo_restricted",
            "hint": "Set proxy to target country or use geo-bypass options.",
        }
    if "http error 429" in lower or "too many requests" in lower:
        return {
            "type": "rate_limited",
            "hint": "Reduce concurrency, add delays, or use proxy rotation.",
        }
    if "utf-8" in lower and "codec" in lower and "decode" in lower:
        return {
            "type": "decode_error",
            "hint": "Subprocess output contained non-UTF-8 bytes; check FFmpeg/yt-dlp output or locale.",
        }
    if (
        "requested format is not available" in lower
        or "format is not available" in lower
        or "use --list-formats" in lower
    ):
        return {
            "type": "format_unavailable",
            "hint": "Try a different format or use --list-formats to see available formats.",
        }
    if (
        "only images are available for download" in lower
        or (
            "formats have been skipped as they are missing a url" in lower
            and "sabr streaming" in lower
        )
    ):
        return {
            "type": "no_media_formats",
            "hint": "Only image/thumbnail formats are available; no audio/video streams to download.",
        }
    if (
        "sockshttpsconnection" in lower
        or ("connection to www.youtube.com timed out" in lower)
        or ("timed out" in lower and "connect timeout" in lower)
        or "transporterror" in lower
    ):
        return {
            "type": "proxy_timeout",
            "hint": "Proxy/SOCKS connection timed out. Set YTDLP_DISABLE_TOR_FOR_DOWNLOADS=true or retry without proxy.",
        }
    return {"type": "unknown", "hint": "See raw error message for details."}