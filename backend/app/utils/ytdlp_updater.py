import asyncio
import subprocess
import sys
from typing import Tuple, Optional
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

# Track if update was attempted in current session to prevent infinite loops
_update_attempted = False


async def update_ytdlp() -> Tuple[bool, Optional[str]]:
    """
    Update yt-dlp to the latest version using pip.

    Returns:
        Tuple[bool, Optional[str]]: (success, message)
        - success: True if update succeeded, False otherwise
        - message: Success or error message
    """
    global _update_attempted

    # Prevent multiple update attempts in the same session
    if _update_attempted:
        logger.warning("yt-dlp update already attempted in this session; skipping to prevent infinite loops")
        return False, "Update already attempted in this session"

    _update_attempted = True

    try:
        logger.info("Starting yt-dlp update...")

        # Get current version before update
        try:
            import yt_dlp
            current_version = getattr(yt_dlp, "__version__", "unknown")
            logger.info(f"Current yt-dlp version: {current_version}")
        except Exception as e:
            logger.warning(f"Could not get current yt-dlp version: {e}")
            current_version = "unknown"

        # Use same interpreter as the app (pip may be missing from PATH in some environments)
        process = await asyncio.create_subprocess_exec(
            sys.executable,
            "-m",
            "pip",
            "install",
            "--no-cache-dir",
            "--upgrade",
            "--pre",
            "yt-dlp[default]",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        if process.returncode == 0:
            # Get new version after update
            try:
                # Reload module to get new version
                import importlib
                import sys
                if "yt_dlp" in sys.modules:
                    importlib.reload(sys.modules["yt_dlp"])
                import yt_dlp
                new_version = getattr(yt_dlp, "__version__", "unknown")
                logger.info(f"yt-dlp updated successfully from {current_version} to {new_version}")
                message = f"Updated from {current_version} to {new_version}"
            except Exception as e:
                logger.warning(f"Could not get new yt-dlp version: {e}")
                message = f"Update completed (previous version: {current_version})"

            return True, message
        else:
            error_msg = stderr.decode("utf-8", errors="replace") if stderr else "Unknown error"
            logger.error(f"yt-dlp update failed with return code {process.returncode}: {error_msg}")
            return False, f"Update failed: {error_msg}"

    except Exception as e:
        logger.error(f"Exception during yt-dlp update: {e}", exc_info=True)
        return False, f"Exception during update: {str(e)}"


def reset_update_flag():
    """
    Reset the update attempt flag. Useful for testing or when you want to allow
    another update attempt in the same session.
    """
    global _update_attempted
    _update_attempted = False

