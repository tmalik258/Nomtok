import os
from pathlib import Path
import random
import time
import asyncio
import re
from datetime import datetime
from typing import Optional, cast
from http.cookiejar import MozillaCookieJar, Cookie
from contextlib import contextmanager

from playwright_stealth import Stealth
from playwright.async_api import async_playwright, BrowserContext, Page

from app.config import YTDLP_COOKIES_FILE, GOOGLE_EMAIL, GOOGLE_PASSWORD 
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


@contextmanager
def _nullcontext():
    """A no-op context manager for when virtual_display is not needed."""
    yield


@contextmanager
def virtual_display():
    """Create a virtual display for headed browser on headless servers.
    
    Uses pyvirtualdisplay (Xvfb wrapper) on Linux servers without a display.
    On Windows or when DISPLAY is already set, this is a no-op.
    """
    display = None
    try:
        # Only needed on Linux without a display
        if os.name != 'nt' and not os.environ.get('DISPLAY'):
            try:
                from pyvirtualdisplay import Display
                display = Display(visible=False, size=(1920, 1080))
                display.start()
                logger.info(f"Started virtual display: {os.environ.get('DISPLAY')}")
            except ImportError:
                logger.warning("pyvirtualdisplay not installed - headed mode may fail on headless servers")
                logger.warning("Install with: pip install pyvirtualdisplay")
            except Exception as e:
                logger.warning(f"Could not start virtual display: {e}")
        yield
    finally:
        if display:
            display.stop()
            logger.info("Stopped virtual display")

# Paths for persisted state (mount these in Docker volumes for persistence)
BASE_COOKIES_DIR = os.path.dirname(cast(str, YTDLP_COOKIES_FILE))
STORAGE_STATE_FILE = os.path.join(BASE_COOKIES_DIR, 'youtube_storage_state.json')
COOKIES_LAST_REFRESH_FILE = os.path.join(BASE_COOKIES_DIR, 'cookies_last_refresh.txt')

REALISTIC_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/140.0.0.0 Safari/537.36"
)

def is_docker() -> bool:
    """Detect if running in Docker."""
    try:
        with open('/proc/1/cgroup', 'rt') as f:
            return 'docker' in f.read()
    except:
        return False

SCREENSHOTS_DIR = os.path.join("logs", "screenshots")


def _ensure_cookies_dir():
    try:
        os.makedirs(BASE_COOKIES_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create cookies dir {BASE_COOKIES_DIR}: {e}")


def _clear_old_screenshots():
    """Clear old screenshots before starting a new login attempt."""
    try:
        if os.path.exists(SCREENSHOTS_DIR):
            import shutil
            shutil.rmtree(SCREENSHOTS_DIR)
            logger.info(f"Cleared old screenshots from {SCREENSHOTS_DIR}")
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not clear screenshots: {e}")


async def _take_screenshot(page, step_name: str):
    """Take a screenshot with a descriptive name."""
    try:
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        filename = f"{step_name.replace(' ', '-').lower()}-{int(time.time())}.png"
        path = os.path.join(SCREENSHOTS_DIR, filename)
        await page.screenshot(path=path, full_page=True)
        logger.info(f"Screenshot saved: {path}")
    except Exception as e:
        logger.warning(f"Failed to take screenshot for {step_name}: {e}")

async def _run_refresh(headless: bool, channel: Optional[str] = "chrome") -> bool:
    """Internal helper to run the refresh logic with given headless mode and browser channel."""
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    # Clear old screenshots at the start
    _clear_old_screenshots()

    docker = is_docker()
    if docker:
        logger.info("Docker detected; using container-optimized args")

    # For headed mode on Linux servers, start virtual display (no-op on Windows or if headless)
    with virtual_display() if not headless else _nullcontext():
        try:
            async with Stealth().use_async(async_playwright()) as p:
                args = [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--window-size=1920,1080',
                ]
                
                # Headless-specific args for better stealth
                if headless:
                    args.extend([
                        '--headless=new',  # New headless mode - less detectable
                        '--disable-gpu',
                        '--disable-software-rasterizer',
                    ])
                
                if docker:
                    args.extend(['--disable-gpu', '--single-process'])

                # Use a persistent profile directory for more realistic browser fingerprint
                # This is REQUIRED to bypass Google's bot detection - fresh contexts are detected
                persistent_profile_dir = Path(BASE_COOKIES_DIR) / "chrome_profile"
                os.makedirs(persistent_profile_dir, exist_ok=True)
                
                logger.info(f"Using persistent browser profile: {persistent_profile_dir}")

                context_opts = dict(
                    locale='en-US',
                    timezone_id='Asia/Karachi',
                    viewport={"width": 1366, "height": 768},
                    color_scheme='light',
                )
                
                # Only use custom UA for bundled Chromium (channel=None), not for real Chrome
                if channel is None:
                    context_opts["user_agent"] = REALISTIC_UA

                # Use launch_persistent_context for a realistic browser profile
                # This maintains cookies, localStorage, history between sessions - critical for avoiding bot detection
                context = await p.chromium.launch_persistent_context(
                    user_data_dir=str(persistent_profile_dir),
                    headless=headless,
                    channel="chrome" if channel == "chrome" else None,
                    args=args,
                    **context_opts
                )
            
                logger.info(f"Persistent context launched (browser: {context.browser.version if context.browser else 'unknown'})")

                if not context:
                    logger.error("Failed to create browser context")
                    return False

                await context.add_init_script('''
                // Remove webdriver traces
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                delete navigator.__proto__.webdriver;
                
                // Add chrome object
                window.chrome = {
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                };
                
                // Mock plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [
                        {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer'},
                        {name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'},
                        {name: 'Native Client', filename: 'internal-nacl-plugin'}
                    ]
                });
                
                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({state: Notification.permission}) :
                        originalQuery(parameters)
                );
                
                // Random mouse movements (human-like)
                setInterval(() => {
                    window.dispatchEvent(new MouseEvent('mousemove', {
                        clientX: Math.random() * window.innerWidth,
                        clientY: Math.random() * window.innerHeight
                    }));
                }, Math.random() * 5000 + 2000);
                ''')
                page = await context.new_page()

                # Check if login is needed (also navigates to YouTube to check)
                login_needed = await _is_login_needed(page)
                
                if login_needed:
                    logger.info("Performing Google/YouTube login")
                    login_success = await _login_to_google_with_retry(page, max_retries=1)
                    if not login_success:
                        logger.error("Login failed after retries; aborting")
                        await context.close()
                        return False
                    await _navigate_to_youtube(page)

                    # Save new storage state for future runs
                    _ensure_cookies_dir()
                    await context.storage_state(path=STORAGE_STATE_FILE)
                    logger.info(f"Saved storage state to {STORAGE_STATE_FILE}")
                else:
                    # Already logged in - just ensure we're on YouTube for cookie extraction
                    logger.info("Already logged in via persistent profile - extracting cookies directly")

                # Extract cookies with retry logic
                MAX_ATTEMPTS = 3
                cookies = []
                all_auth_found = False

                for attempt in range(MAX_ATTEMPTS):
                    logger.info(f"Cookie extraction attempt {attempt + 1}/{MAX_ATTEMPTS}")

                    # Extract and validate cookies
                    cookies, all_auth_found = await _validate_and_extract_cookies(context)

                    if all_auth_found:
                        logger.info(f"[OK] All authentication cookies found on attempt {attempt + 1}")
                        break

                    if attempt < MAX_ATTEMPTS - 1:
                        # Not all cookies found, and we have retries left
                        logger.warning(f"Attempt {attempt + 1}: Missing auth cookies, retrying with additional navigation")

                        # Strategy: Visit more authenticated pages to trigger cookie generation
                        retry_urls = [
                            "https://accounts.google.com/ManageAccount",
                            "https://myaccount.google.com/data-and-privacy",
                            "https://www.youtube.com/feed/subscriptions",
                            "https://www.youtube.com/feed/library",
                        ]

                        for url in retry_urls:
                            try:
                                logger.info(f"  Visiting {url} to trigger cookies")
                                await page.goto(url, wait_until="networkidle", timeout=15000)
                                await asyncio.sleep(3)
                            except Exception as e:
                                logger.warning(f"  Failed to visit {url}: {e}")
                                continue

                        # Extra wait for cookies to propagate
                        logger.info("  Waiting 8 seconds for cookies to propagate...")
                        await asyncio.sleep(8)

                # Final validation
                if not all_auth_found:
                    logger.error("CRITICAL: Failed to extract all authentication cookies after all retries!")
                    logger.error("Missing cookies will likely cause yt-dlp download failures.")
                    logger.error("Please verify:")
                    logger.error("  1. GOOGLE_EMAIL and GOOGLE_PASSWORD are correct")
                    logger.error("  2. Google account doesn't require 2FA")
                    logger.error("  3. Account is not restricted or suspended")

                    # Take diagnostic screenshot
                    await _take_screenshot(page, "cookie-extraction-failed")
                    logger.error(f"Current page URL: {page.url}")
                    logger.error(f"Current page title: {await page.title()}")
                else:
                    logger.info("SUCCESS: All required authentication cookies extracted")

                # Export cookies regardless (even incomplete cookies are better than none)
                await _export_cookies_to_netscape(cookies)

                await context.close()
                _update_last_refresh_timestamp()
                logger.info(f"Successfully refreshed cookies at {datetime.now()} (headless={headless}, channel={channel})")
                return True

        except Exception as e:
            logger.error(f"Cookie refresh failed (headless={headless}, channel={channel}): {e}")
            return False

async def refresh_youtube_cookies(headless: bool = True) -> bool:
    """Automate YouTube login via Google and export fresh cookies to Netscape format.
    
    Args:
        headless: Preferred mode (default True). If fails, falls back to headful.
    
    Returns:
        bool: True if successful.
    """
    _ensure_cookies_dir()

    # Primary attempt: Use preferred headless mode with system Chrome
    success = await _run_refresh(headless, channel="chrome")
    
    # Fallback 1: If failed, retry headless with bundled Chromium (less detection sometimes)
    if not success and headless:
        logger.warning("Headless with Chrome failed; retrying with bundled Chromium")
        success = await _run_refresh(headless, channel=None)
    
    # Fallback 2: If still failed, retry headful (warn for Docker/Xvfb)
    if not success and headless:
        docker = is_docker()
        if docker:
            logger.warning("Headless failed in Docker; falling back to headful (run with 'xvfb-run -a python ...' for display)")
        else:
            logger.warning("Headless failed; falling back to headful mode")
        success = await _run_refresh(False, channel="chrome")
        if docker and not success:
            logger.error("Headful failed in Docker—ensure Xvfb installed and use xvfb-run wrapper")
    
    return success

async def _login_to_google_with_retry(page: Page, max_retries: int = 1) -> bool:
    """Perform login with limited retries on rejection loop."""
    retry_count = 0
    while retry_count <= max_retries:
        try:
            await _login_to_google(page)
            return True  # Success
        except RuntimeError as e:
            if "Rejection loop detected" in str(e):
                logger.warning(f"Rejection loop on attempt {retry_count + 1}/{max_retries + 1}; retrying login")
                retry_count += 1
                if retry_count > max_retries:
                    logger.error("Max login retries exceeded due to rejection loop; aborting")
                    return False
                # Reset page to start of login for retry
                await page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin")
                await page.wait_for_load_state("domcontentloaded")
                continue
            else:
                raise  # Re-raise non-loop errors
        except Exception as e:
            logger.error(f"Unexpected login error: {e}")
            return False
    return False

async def _is_login_needed(page) -> bool:
    """Check if login is required by verifying authenticated YouTube elements."""
    await page.goto("https://www.youtube.com")
    await page.wait_for_load_state("networkidle", timeout=15000)
    await _take_screenshot(page, "step1-youtube-check")
    
    # First check for explicit sign-in button (definitive sign we're NOT logged in)
    try:
        signin = page.locator('yt-button-shape:has-text("Sign in"), a[href*="accounts.google.com"]:has-text("Sign in")')
        if await signin.first.is_visible(timeout=3000):
            logger.info("Sign-in button detected - not logged in")
            return True
    except Exception:
        pass
    
    # Check for avatar button (definitive sign we ARE logged in)
    # Note: Do NOT use ytd-rich-grid-renderer - it appears for guests too!
    auth_selectors = [
        'button#avatar-btn',  # Avatar button (logged-in users only)
        'a#avatar-link',  # Avatar link variant
        'yt-icon-button#avatar-btn',  # Alternative avatar
        'img#img.yt-img-shadow[alt*="Avatar"]',  # Avatar image
    ]
    
    for selector in auth_selectors:
        try:
            elem = page.locator(selector).first
            if await elem.is_visible(timeout=2000):
                logger.info(f"Auth confirmed via: {selector}")
                return False  # Logged in
        except Exception:
            continue
    
    logger.warning("Could not determine auth state - assuming login needed")
    return True  # Assume needed if no clear auth signals

async def _click_consent_if_present(page):
    """Dismiss Google/YouTube consent dialogs, including iframe-based ones."""
    try:
        await page.get_by_role("button", name=re.compile("Accept all|I agree|Accept|Agree|Accept cookies", re.I)).click(timeout=2000)
        logger.info("Dismissed consent on main page")
        await asyncio.sleep(1)
    except Exception:
        pass
    for frame in page.frames:
        try:
            if re.search(r"consent|privacy", frame.url):
                await frame.get_by_role("button", name=re.compile("Accept all|I agree|Accept|Agree|Accept cookies", re.I)).click(timeout=2000)
                logger.info("Dismissed consent inside iframe")
                await asyncio.sleep(1)
                break
        except Exception:
            continue

async def _ensure_identifier_input(page) -> None:
    """Ensure identifier input is visible, handling account chooser if present.
    
    Note: This function assumes we're already on the signin page - no redundant navigation.
    """
    logger.info("Ensuring identifier input is ready")
    
    # First check if identifier input is already visible
    identifier_selector = 'input[name="identifier"], input#identifierId'
    try:
        await page.wait_for_selector(identifier_selector, timeout=5000)
        logger.info("Identifier input already visible")
        return
    except Exception:
        pass
    
    # Maybe we're on account chooser - try clicking "Use another account"
    await _click_consent_if_present(page)
    
    for role in ["button", "link"]:
        try:
            use_another_regex = re.compile(
                "Use another account|Add account|Weitere Konto verwenden|Anderes Konto verwenden|Utiliser un autre compte|"
                "Usar otra cuenta|Usar outra conta|Usa un altro account|Использовать другой аккаунт|استخدام حساب آخر",
                re.I
            )
            handle = page.get_by_role(role, name=use_another_regex)
            if await handle.is_visible():
                await handle.click()
                logger.info("Clicked 'Use another account'")
                await page.wait_for_load_state("domcontentloaded")
                await _click_consent_if_present(page)
                break
        except Exception:
            pass
    
    # Final wait for identifier input
    try:
        await page.wait_for_selector(identifier_selector, timeout=10000)
    except Exception:
        logger.warning("Identifier input not found after account chooser handling")

async def _ensure_password_input(page) -> None:
    """Ensure we reach the password entry screen, handling challenge flows and locale variants robustly."""
    # Broad set of selectors that have appeared across Google login variants/locales
    password_selectors = [
        'input[name="Passwd"]',
        'input[type="password"][name="Passwd"]',
        'input[type="password"]',
        'input#password',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[aria-label*="password" i]'
    ]

    # Common actions/prompts that lead to password entry
    enter_password_regex = re.compile(
        "Enter your password|Use password instead|Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور",
        re.I,
    )
    try_another_way_regex = re.compile(
        "Try another way|Use another method|Choose another method|Try a different way",
        re.I,
    )
    choose_how_regex = re.compile(
        "Choose how to sign in|Verify it'?s you|Verify it's you|Confirm it's you",
        re.I,
    )
    continue_regex = re.compile(
        "Continue|Fortfahren|Continuer|Continuar|Continuare|Продолжить|МТАБПАРАВОТА",
        re.I,
    )

    # Attempt multiple cycles to navigate to password screen
    for attempt in range(3):  # Increased from 5 to 8
        logger.info(f"Password field search attempt {attempt + 1}/3")
        
        # 1) Directly look for a visible password input
        try:
            locator = page.locator(", ".join(password_selectors)).first
            await locator.wait_for(state="visible", timeout=6000)
            logger.info("Password field found!")
            return
        except Exception:
            pass

        # 2) If not found, click common challenge actions
        try:
            # Click 'Use password instead' / 'Enter your password' when present
            for role in ["button", "link"]:
                option = page.get_by_role(role, name=enter_password_regex)
                if await option.is_visible():
                    logger.info(f"Clicking '{await option.text_content()}' option")
                    await option.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    break
        except Exception:
            pass

        try:
            # Click 'Try another way' to reveal methods, then pick password
            for role in ["button", "link"]:
                another = page.get_by_role(role, name=try_another_way_regex)
                if await another.is_visible():
                    logger.info("Clicking 'Try another way'")
                    await another.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    # After changing methods, prefer password
                    for role2 in ["button", "link"]:
                        pwdopt = page.get_by_role(role2, name=enter_password_regex)
                        if await pwdopt.is_visible():
                            logger.info("Selecting password option")
                            await pwdopt.click()
                            await page.wait_for_load_state("domcontentloaded")
                            await asyncio.sleep(1)
                            break
                    break
        except Exception:
            pass

        try:
            # If a heading is present, we are on chooser screen
            chooser = page.get_by_text(choose_how_regex)
            if await chooser.is_visible():
                logger.info("On verification chooser screen")
                for role in ["button", "link"]:
                    pwd = page.get_by_role(role, name=enter_password_regex)
                    if await pwd.is_visible():
                        logger.info("Selecting password verification method")
                        await pwd.click()
                        await page.wait_for_load_state("domcontentloaded")
                        await asyncio.sleep(1)
                        break
        except Exception:
            pass

        try:
            # Occasionally Google shows a welcome/continue interstitial
            for role in ["button", "link"]:
                cont = page.get_by_role(role, name=continue_regex)
                if await cont.is_visible():
                    logger.info("Clicking 'Continue' button")
                    await cont.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    break
        except Exception:
            pass

        # 3) Clean up overlays/consent and wait for network to settle
        await page.wait_for_load_state("networkidle", timeout=10000)

        await _click_consent_if_present(page)

        # 4) Small backoff before next probe
        await asyncio.sleep(2)  # Increased from 0.5 to 2

    # Take screenshot before final timeout for debugging
    try:
        current_url = page.url
        current_title = await page.title()
        logger.warning(f"Password field not found after retries. URL: {current_url}, Title: {current_title}...")
        await _take_screenshot(page, "password-not-found")
        
        # Also log page content for debugging
        page_content = await page.content()
        os.makedirs("logs", exist_ok=True)
        content_path = os.path.join("logs", f"password-not-found-{int(time.time())}.html")
        with open(content_path, "w", encoding="utf-8") as f:
            f.write(page_content)
        logger.warning(f"Saved page HTML: {content_path}")
    except Exception as e:
        logger.error(f"Failed to capture diagnostics: {e}")
    
    # Final explicit wait (will raise if still not present)
    await page.wait_for_selector(
        ", ".join(password_selectors),
        timeout=30000,
    )

async def _login_to_google(page):
    """Automate Google login flow with robust selectors and consent handling."""
    logger.info("Logging in to Google")

    await page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin")
    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)
    await _take_screenshot(page, "step2-google-signin")

    await _ensure_identifier_input(page)

    email_value = os.getenv('GOOGLE_EMAIL') or ""
    logger.info("Filling email identifier")
    filled = False
    for sel in ['input[name="identifier"]', 'input#identifierId']:
        try:
            await page.wait_for_selector(sel, timeout=10000)
            await asyncio.sleep(random.uniform(1.0, 2.0))
            await page.focus(sel)
            await asyncio.sleep(random.uniform(0.5, 1.0))
            # Type character by character with random delays (human-like)
            for char in email_value:
                await page.keyboard.type(char, delay=random.randint(50, 150))
                await asyncio.sleep(random.uniform(0.02, 0.08))
            filled = True
            break
        except Exception:
            continue

    if not filled:
        try:
            await page.get_by_placeholder(re.compile("Email|Email or phone|E-mail|Correo", re.I)).fill(email_value)
            filled = True
        except Exception:
            pass

    if not filled:
        try:
            await page.get_by_label(re.compile("Email|Email address|Identifier|E-mail|Correo|Mail|Adresse", re.I)).fill(email_value)
            filled = True
        except Exception:
            pass

    if not filled:
        raise RuntimeError("Could not locate email/identifier field on Google sign-in")

    await asyncio.sleep(random.uniform(0.5, 1.5))
    
    logger.info("Clicking 'Next' after email")
    try:
        await page.keyboard.press("Enter")
        # await page.locator('#identifierNext').click()
    except Exception:
        await page.get_by_role("button", name=re.compile("Next|Weiter|Suivant|Avanti|Siguiente|Далее|التالي", re.I)).click()

    # Wait for navigation to complete after email submission
    logger.info("Waiting for navigation after email submission...")
    await asyncio.sleep(3)  # Give Google time to process
    await page.wait_for_load_state("networkidle", timeout=30000)
    await _click_consent_if_present(page)
    
    # Check if we're already logged in (session restored from persistent profile)
    current_url = page.url
    if "youtube.com" in current_url and "accounts.google.com" not in current_url:
        logger.info(f"Already logged in! Session restored, redirected to: {current_url}")
        return  # Skip password - we're already authenticated
    
    # Take a screenshot to debug what page we're on
    await _take_screenshot(page, "after-email-submit")
    logger.info(f"After email submit - URL: {current_url}")
    
    await _ensure_password_input(page)

    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

    pwd_value = os.getenv('GOOGLE_PASSWORD') or ""
    logger.info("Filling password")
    filled_pwd = False
    for sel in ['input[type="password"][name="Passwd"]', 'input[type="password"]', 'input#password', 'input[name="password"]']:
        try:
            await page.wait_for_selector(sel, timeout=20000)
            await asyncio.sleep(random.uniform(0.5, 1.0))
            await page.focus(sel)
            await asyncio.sleep(random.uniform(0.3, 0.7))
            # Type character by character with random delays (human-like)
            for char in pwd_value:
                await page.keyboard.type(char, delay=random.randint(50, 150))
                await asyncio.sleep(random.uniform(0.02, 0.08))
            filled_pwd = True
            break
        except Exception:
            continue
    if not filled_pwd:
        try:
            await page.get_by_placeholder(re.compile("Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور", re.I)).fill(pwd_value)
            filled_pwd = True
        except Exception:
            pass
    if not filled_pwd:
        try:
            await page.get_by_label(re.compile("Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور", re.I)).fill(pwd_value)
            filled_pwd = True
        except Exception:
            pass
    if not filled_pwd:
        # Diagnostics: log current URL/title and capture a screenshot to aid debugging
        current_title = await page.title()
        logger.error(f"Password field not found at URL: {page.url} - title: {current_title}")
        await _take_screenshot(page, "google-password-field-missing")
        raise RuntimeError("Could not locate password field on Google sign-in")

    logger.info("Clicking 'Next' after password")
    try:
        await page.locator('#passwordNext').click()
    except Exception:
        await page.get_by_role("button", name=re.compile("Next|Weiter|Suivant|Avanti|Siguiente|Далее|التالي", re.I)).click()

    try:
        await page.wait_for_url(re.compile(".*youtube.com.*"), timeout=30000)
    except Exception:
        await page.goto("https://www.youtube.com")
        await page.wait_for_load_state("domcontentloaded")

    await asyncio.sleep(3)

async def _navigate_to_youtube(page):
    """Navigate to Google services in sequence to trigger all auth cookies.

    This function strategically visits Google services in a specific order to trigger
    all authentication cookies (SID, HSID, SSID, APISID, SAPISID, LOGIN_INFO).
    """
    # Wait for any in-progress navigation to settle (e.g., post-login redirect)
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except Exception:
        pass  # Timeout is OK, just ensuring stability
    
    # Step 3: YouTube main - only navigate if not already on YouTube
    current_url = page.url
    if "youtube.com" in current_url and "accounts.google.com" not in current_url:
        logger.info("Step 3: Already on YouTube - skipping redundant navigation")
        await asyncio.sleep(2)  # Brief wait for page stability
    else:
        logger.info("Step 3: Visiting YouTube main page")
        await page.goto("https://www.youtube.com", wait_until="networkidle")
        await asyncio.sleep(4)
    await _take_screenshot(page, "step3-youtube-main")

    # Step 4: YouTube subscriptions (triggers LOGIN_INFO - requires auth)
    logger.info("Step 4: Visiting YouTube subscriptions (requires auth)")
    await page.goto("https://www.youtube.com/feed/subscriptions", wait_until="networkidle")
    await asyncio.sleep(4)
    await _take_screenshot(page, "step4-youtube-subscriptions")

    # Step 5: YouTube Studio (additional auth coverage)
    logger.info("Step 5: Visiting YouTube Studio")
    await page.goto("https://studio.youtube.com", wait_until="networkidle")
    await asyncio.sleep(4)
    await _take_screenshot(page, "step5-youtube-studio")

    # Step 6: Google main (cross-domain sync)
    logger.info("Step 6: Visiting Google main page")
    try:
        await page.goto("https://www.google.com", wait_until="networkidle", timeout=30000)
    except Exception as google_err:
        logger.warning(f"Google.com networkidle timeout, falling back to domcontentloaded: {google_err}")
        try:
            await page.goto("https://www.google.com", wait_until="domcontentloaded", timeout=15000)
        except Exception as fallback_err:
            logger.warning(f"Google.com domcontentloaded also failed: {fallback_err}")
    await asyncio.sleep(4)
    await _take_screenshot(page, "step6-google-main")

    # Step 7: Final YouTube visit with extended wait
    logger.info("Step 7: Final navigation to YouTube with extended wait")
    await page.goto("https://www.youtube.com", wait_until="networkidle")
    await asyncio.sleep(6)  # Extended wait for cookie propagation
    await _take_screenshot(page, "step7-youtube-final")

    logger.info("Navigation sequence completed - total wait time: ~34 seconds")

async def _validate_and_extract_cookies(context: BrowserContext) -> tuple[list[dict], bool]:
    """Extract cookies and validate authentication cookies are present.

    Returns:
        tuple: (cookies_list, all_auth_cookies_found)
    """
    AUTH_COOKIE_NAMES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'LOGIN_INFO']

    all_cookies = await context.cookies()

    # Filter to Google/YouTube domains
    relevant_domains = [
        ".youtube.com", "youtube.com", "www.youtube.com",
        ".google.com", "google.com", "www.google.com",
        "accounts.google.com", "myaccount.google.com",
        "studio.youtube.com"
    ]

    cookies = [
        c for c in all_cookies
        if any(domain in c.get('domain', '') for domain in relevant_domains)
    ]

    # Check for auth cookies
    found_auth = {}
    for cookie in cookies:
        name = cookie.get('name')
        if name in AUTH_COOKIE_NAMES:
            found_auth[name] = cookie.get('domain')

    # Log results
    logger.info(f"Total cookies: {len(cookies)}, Auth cookies: {len(found_auth)}/{len(AUTH_COOKIE_NAMES)}")
    for name in AUTH_COOKIE_NAMES:
        if name in found_auth:
            logger.info(f"  [OK] {name} (domain: {found_auth[name]})")
        else:
            logger.warning(f"  [MISSING] {name}")

    all_found = len(found_auth) == len(AUTH_COOKIE_NAMES)
    return cookies, all_found

async def _export_cookies_to_netscape(cookies: list[dict]):
    _ensure_cookies_dir()
    jar = MozillaCookieJar()
    for cookie in cookies:
        # Handle expires field properly to avoid invalid format warnings
        expires_value = None
        if 'expires' in cookie and cookie['expires'] is not None:
            if cookie['expires'] == -1:
                # Session cookie - no expiration
                expires_value = None
            else:
                # Convert to integer timestamp
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
            discard=expires_value is None,  # Mark as discard if no expiration
            comment=None,
            comment_url=None,
            rest={},
            rfc2109=False,
        ))
    jar.save(YTDLP_COOKIES_FILE, ignore_discard=True, ignore_expires=True)
    try:
        os.chmod(cast(str, YTDLP_COOKIES_FILE), 0o600)
    except Exception:
        # os.chmod may not be supported on Windows in the same way; ignore
        pass

def _update_last_refresh_timestamp():
    _ensure_cookies_dir()
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'w') as f:
        f.write(str(time.time()))

def get_cookies_age_hours() -> float:
    if not os.path.exists(cast(str, COOKIES_LAST_REFRESH_FILE)):
        return float('inf')
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'r') as f:
        timestamp = float(f.read().strip())
    return (time.time() - timestamp) / 3600