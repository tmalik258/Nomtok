"""
Automated YouTube login in headless mode (invisible browser).

This script tests headless mode with the existing Chrome profile.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.youtube_cookies import refresh_youtube_cookies


async def auto_login_headless():
    """Run cookie refresh in headless mode."""

    print("=" * 70)
    print("Automated YouTube Login (Headless Mode)")
    print("=" * 70)
    print("\nThis will:")
    print("1. Run Chrome in headless mode (invisible)")
    print("2. Use existing Chrome profile for session persistence")
    print("3. Refresh YouTube authentication cookies")
    print("4. Save storage state and cookies.txt")
    print("=" * 70)
    print()

    print("Starting headless login...\n")

    # Run the refresh in headless mode (headless=True)
    success = await refresh_youtube_cookies(headless=True)

    if success:
        print("\n" + "=" * 70)
        print("SUCCESS! Headless login completed and cookies saved.")
        print("=" * 70)
        print()
    else:
        print("\n" + "=" * 70)
        print("FAILED! Headless login did not complete successfully.")
        print("=" * 70)
        print("\nCheck logs/screenshots in backend/logs/ for details.")
        print()

    return success


if __name__ == "__main__":
    try:
        success = asyncio.run(auto_login_headless())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

