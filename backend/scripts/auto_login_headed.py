"""
Automated YouTube login in headed mode (visible browser).

This script automates the login process with credentials but runs in headed mode
to avoid Google's bot detection.
"""

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.youtube_cookies import refresh_youtube_cookies

async def auto_login_headed():
    """Run cookie refresh in headed mode for better success rate."""

    print("=" * 70)
    print("Automated YouTube Login (Headed Mode)")
    print("=" * 70)
    print("\nThis will:")
    print("1. Open a visible Chrome browser")
    print("2. Automatically log into YouTube with your credentials")
    print("3. Visit Google pages to collect authentication cookies")
    print("4. Save storage state and cookies.txt")
    print()
    print("⚠️  The browser window will open - don't close it manually!")
    print("=" * 70)
    print()

    # Wait a moment
    await asyncio.sleep(2)

    print("🚀 Starting automated login...\n")

    # Run the refresh in headed mode (headless=False)
    success = await refresh_youtube_cookies(headless=False)

    if success:
        print("\n" + "=" * 70)
        print("✅ SUCCESS! Login completed and cookies saved.")
        print("=" * 70)
        print("\nNow run on server:")
        print("  scp cookies/cookies.txt nomtok:Nomtok/backend/cookies/")
        print("  scp cookies/youtube_storage_state.json nomtok:Nomtok/backend/cookies/")
        print()
    else:
        print("\n" + "=" * 70)
        print("❌ FAILED! Login did not complete successfully.")
        print("=" * 70)
        print("\nCheck logs/screenshots in backend/logs/ for details.")
        print()

    return success


if __name__ == "__main__":
    try:
        success = asyncio.run(auto_login_headed())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
