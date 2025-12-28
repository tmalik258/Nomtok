"""
Extract cookies from Playwright storage state and convert to Netscape format.

This script reads youtube_storage_state.json and extracts cookies to cookies.txt
in Netscape format for use with yt-dlp.

Usage:
    python scripts/extract_cookies_from_storage.py
"""

import json
import os
import sys
from pathlib import Path
from http.cookiejar import MozillaCookieJar, Cookie

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import YTDLP_COOKIES_FILE

# Paths
BASE_COOKIES_DIR = os.path.dirname(YTDLP_COOKIES_FILE)
STORAGE_STATE_FILE = os.path.join(BASE_COOKIES_DIR, 'youtube_storage_state.json')


def extract_cookies_from_storage_state():
    """Extract cookies from storage state JSON and save to Netscape format."""

    if not os.path.exists(STORAGE_STATE_FILE):
        print(f"❌ Storage state file not found: {STORAGE_STATE_FILE}")
        print("\nPlease create it by:")
        print("1. Run: python scripts/manual_youtube_login.py")
        print("2. Or manually save storage state from a logged-in Playwright session")
        return False

    print(f"📂 Loading storage state from: {STORAGE_STATE_FILE}")

    with open(STORAGE_STATE_FILE, 'r') as f:
        storage_state = json.load(f)

    cookies = storage_state.get('cookies', [])
    print(f"📊 Found {len(cookies)} total cookies in storage state")

    # Filter to Google/YouTube domains
    relevant_domains = [
        ".youtube.com", "youtube.com", "www.youtube.com",
        ".google.com", "google.com", "www.google.com",
        "accounts.google.com", "myaccount.google.com",
        "studio.youtube.com", "music.youtube.com"
    ]

    filtered_cookies = [
        c for c in cookies
        if any(domain in c.get('domain', '') for domain in relevant_domains)
    ]

    print(f"🔍 Filtered to {len(filtered_cookies)} Google/YouTube cookies")

    # Check for authentication cookies
    AUTH_COOKIE_NAMES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'LOGIN_INFO']
    found_auth = {}

    for cookie in filtered_cookies:
        name = cookie.get('name')
        if name in AUTH_COOKIE_NAMES:
            found_auth[name] = cookie.get('domain')

    print(f"\n🔐 Authentication cookies: {len(found_auth)}/{len(AUTH_COOKIE_NAMES)}")
    for name in AUTH_COOKIE_NAMES:
        if name in found_auth:
            print(f"  ✓ {name} (domain: {found_auth[name]})")
        else:
            print(f"  ✗ {name} MISSING")

    # Convert to Netscape format
    print(f"\n💾 Saving cookies to: {YTDLP_COOKIES_FILE}")

    os.makedirs(BASE_COOKIES_DIR, exist_ok=True)
    jar = MozillaCookieJar()

    for cookie in filtered_cookies:
        # Handle expires field
        expires_value = None
        if 'expires' in cookie and cookie['expires'] is not None:
            if cookie['expires'] == -1:
                expires_value = None
            else:
                expires_value = int(float(cookie['expires']))

        jar.set_cookie(Cookie(
            version=0,
            name=cookie['name'],
            value=cookie['value'],
            port=None,
            port_specified=False,
            domain=cookie['domain'],
            domain_initial_dot=cookie['domain'].startswith('.'),
            domain_specified=True,
            path=cookie.get('path', '/'),
            path_specified=True,
            secure=cookie.get('secure', False),
            expires=expires_value,
            discard=expires_value is None,
            comment=None,
            comment_url=None,
            rest={},
            rfc2109=False,
        ))

    jar.save(YTDLP_COOKIES_FILE, ignore_discard=True, ignore_expires=True)

    try:
        os.chmod(YTDLP_COOKIES_FILE, 0o600)
    except Exception:
        pass

    print(f"✅ Successfully saved {len(filtered_cookies)} cookies to cookies.txt")

    if len(found_auth) == len(AUTH_COOKIE_NAMES):
        print("\n🎉 SUCCESS: All authentication cookies present!")
        return True
    else:
        print("\n⚠️  WARNING: Some authentication cookies are missing.")
        print("   yt-dlp may still work, but could encounter 'Sign in' errors.")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Cookie Extraction from Storage State")
    print("=" * 60)
    print()

    success = extract_cookies_from_storage_state()

    print()
    print("=" * 60)

    sys.exit(0 if success else 1)
