import os
from pathlib import Path
import random
import time
import asyncio
import re
from datetime import datetime
from typing import Optional, cast
from http.cookiejar import MozillaCookieJar, Cookie

from playwright_stealth import Stealth
from playwright.async_api import async_playwright, BrowserContext, Page

from app.config import YTDLP_COOKIES_FILE, GOOGLE_EMAIL, GOOGLE_PASSWORD 
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

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

def _ensure_cookies_dir():
    try:
        os.makedirs(BASE_COOKIES_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create cookies dir {BASE_COOKIES_DIR}: {e}")

async def _run_refresh(headless: bool, channel: Optional[str] = "chrome") -> bool:
    """Internal helper to run the refresh logic with given headless mode and browser channel."""
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    docker = is_docker()
    if docker:
        logger.info("Docker detected; using container-optimized args")

    try:
        async with Stealth().use_async(async_playwright()) as p:
            args = [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-first-run',
                '--no-default-browser-check',
                '--window-size=1920,1080',  # Larger, more common resolution
            ]
            if headless and not docker:
                args.append('--virtual-time-budget=5000')
            
            if docker:
                args.extend(['--disable-gpu', '--single-process'])

            profile_path = Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data"

            browser = await p.chromium.launch(
                headless=headless,
                channel="chrome",
                args=args,
            )

            context: Optional[BrowserContext] = None

            context_opts = dict(
                locale='en-PK',  # or 'ur-PK' if you want Urdu as the browser language
                timezone_id='Asia/Karachi',  # Pakistan timezone
                user_agent=REALISTIC_UA,
                viewport={"width": 1366, "height": 768}
            )

            # Try loading persisted state first (skips login if valid)
            if os.path.exists(STORAGE_STATE_FILE):
                logger.info("Loading persisted YouTube storage state")
                context = await browser.new_context(storage_state=STORAGE_STATE_FILE, **context_opts)
            else:
                context = await browser.new_context(**context_opts)

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

            # If no state or expired, perform login
            login_performed = False
            if not os.path.exists(STORAGE_STATE_FILE) or await _is_login_needed(page):
                logger.info("Performing Google/YouTube login")
                login_success = await _login_to_google_with_retry(page, max_retries=1)  # Limit to 1 for loop avoidance
                if not login_success:
                    logger.error("Login failed after retries; aborting")
                    await browser.close()
                    return False
                await _navigate_to_youtube(page)
                login_performed = True

                # Save new storage state for future runs
                _ensure_cookies_dir()
                await context.storage_state(path=STORAGE_STATE_FILE)
                logger.info(f"Saved storage state to {STORAGE_STATE_FILE}")

            # Always navigate to YouTube and verify login before extracting cookies
            # This ensures all cookies are fresh and we're in a logged-in state
            logger.info("Navigating to YouTube services for cookie extraction")

            # Use enhanced navigation sequence if we just logged in, otherwise do quick refresh
            if login_performed:
                logger.info("Fresh login detected - using enhanced navigation sequence")
                await _navigate_to_youtube(page)
            else:
                # Quick refresh for existing sessions
                logger.info("Using existing session - doing quick refresh")
                await page.goto("https://www.youtube.com", wait_until="networkidle")
                await asyncio.sleep(3)
                await page.goto("https://myaccount.google.com", wait_until="networkidle")
                await asyncio.sleep(3)
                await page.goto("https://www.youtube.com", wait_until="networkidle")
                await asyncio.sleep(5)

            # Check if we're logged in by looking for logged-in indicators
            # _is_login_needed returns True if login is needed (not logged in), False if logged in
            login_needed = await _is_login_needed(page)
            if login_needed:
                logger.warning("Not logged in after refresh attempt; cookies may be incomplete")
            else:
                logger.info("Login verified; proceeding with cookie extraction")

            # Extract cookies with retry logic
            MAX_ATTEMPTS = 3
            cookies = []
            all_auth_found = False

            for attempt in range(MAX_ATTEMPTS):
                logger.info(f"Cookie extraction attempt {attempt + 1}/{MAX_ATTEMPTS}")

                # Extract and validate cookies
                cookies, all_auth_found = await _validate_and_extract_cookies(context)

                if all_auth_found:
                    logger.info(f"✓ All authentication cookies found on attempt {attempt + 1}")
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
                try:
                    os.makedirs("logs", exist_ok=True)
                    screenshot_path = os.path.join("logs", f"cookie-extraction-failed-{int(time.time())}.png")
                    await page.screenshot(path=screenshot_path, full_page=True)
                    logger.error(f"Saved diagnostic screenshot: {screenshot_path}")

                    # Also save the current URL for debugging
                    logger.error(f"Current page URL: {page.url}")
                    logger.error(f"Current page title: {await page.title()}")
                except Exception as e:
                    logger.error(f"Failed to capture diagnostics: {e}")
            else:
                logger.info("SUCCESS: All required authentication cookies extracted")

            # Export cookies regardless (even incomplete cookies are better than none)
            await _export_cookies_to_netscape(cookies)

            await browser.close()
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
                await page.goto("https://accounts.google.com/v2/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin")
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
    await page.wait_for_load_state("networkidle", timeout=10000)
    
    # Multi-check: Avatar + dashboard indicators (more robust than single selector)
    auth_selectors = [
        'a#avatar-link, button#avatar-btn',  # Avatar
        'yt-icon-button#avatar-btn',  # Alternative avatar
        'div#endpoint[title*="Subscriptions"]',  # Dashboard presence
        'ytd-rich-grid-renderer',  # Home feed (logged-in only)
    ]
    
    for selector in auth_selectors:
        try:
            await page.wait_for_selector(selector, timeout=3000)
            logger.info(f"Auth confirmed via: {selector}")
            return False  # Logged in
        except Exception:
            continue
    
    # Fallback: Explicit sign-in prompt
    try:
        signin = page.locator('tp-yt-iron-button:has-text("Sign in")')
        if await signin.is_visible(timeout=2000):
            logger.warning("Sign-in prompt detected")
            return True
    except Exception:
        pass
    
    return True  # Assume needed if no auth signals

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
    selector_any = 'input[name="identifier"], input#identifierId, text=/Choose an account/i, text=/Use another account|Add account/i'
    try:
        await page.wait_for_selector(selector_any, timeout=15000)
    except Exception:
        await page.wait_for_load_state("networkidle")
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

    def endpoints():
        return [
            "https://accounts.google.com/v2/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin",
        ]

    for url in endpoints():
        try:
            await page.goto(url)
            await page.wait_for_load_state("domcontentloaded")
            await _click_consent_if_present(page)
            await page.wait_for_selector('input[name="identifier"], input#identifierId', timeout=10000)
            return
        except Exception:
            continue

    await page.goto("https://accounts.google.com/v2/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin")
    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

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
    for attempt in range(8):  # Increased from 5 to 8
        logger.info(f"Password field search attempt {attempt + 1}/8")
        
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
        os.makedirs("logs", exist_ok=True)
        screenshot_path = os.path.join("logs", f"password-not-found-{int(time.time())}.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        logger.warning(f"Saved diagnostic screenshot: {screenshot_path}")
        
        # Also log page content for debugging
        page_content = await page.content()
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
    await page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F&dsh=S-2147279974%3A1759988436171692&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AfYwgwXSrxGEIClHmM1YYF3IUQnqFv6KRohiAa4gNIchCV-z6eJ4CZypirCLzgqFfDqKVaqnveYRig&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin")
    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

    await _ensure_identifier_input(page)

    email_value = os.getenv('GOOGLE_EMAIL')
    logger.info("Filling email identifier")
    filled = False
    for sel in ['input[name="identifier"]', 'input#identifierId']:
        try:
            await page.wait_for_selector(sel, timeout=10000)
            await asyncio.sleep(random.uniform(0.5, 1.5))
            await page.focus(sel)
            await asyncio.sleep(random.uniform(0.5, 1.5))
            await page.fill(sel, email_value)
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
    
    # Take a screenshot to debug what page we're on
    try:
        os.makedirs("logs", exist_ok=True)
        screenshot_path = os.path.join("logs", f"after-email-submit-{int(time.time())}.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        logger.info(f"After email submit - URL: {page.url}, saved screenshot: {screenshot_path}")
    except Exception:
        pass
    
    await _ensure_password_input(page)

    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

    pwd_value = os.getenv('GOOGLE_PASSWORD')
    logger.info("Filling password")
    filled_pwd = False
    for sel in ['input[type="password"][name="Passwd"]', 'input[type="password"]', 'input#password', 'input[name="password"]']:
        try:
            await page.wait_for_selector(sel, timeout=20000)
            await page.focus(sel)
            await page.fill(sel, pwd_value)
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
        try:
            current_title = await page.title()
            logger.error(f"Password field not found at URL: {page.url} - title: {current_title}")
            os.makedirs("logs", exist_ok=True)
            screenshot_path = os.path.join("logs", f"google-password-field-missing-{int(time.time())}.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            logger.error(f"Saved diagnostic screenshot: {screenshot_path}")
        except Exception:
            pass
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
    # Step 1: Google Account Management (triggers SID, HSID, SSID)
    logger.info("Step 1: Visiting accounts.google.com to trigger auth cookies")
    await page.goto("https://accounts.google.com/ManageAccount", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 2: MyAccount (triggers APISID, SAPISID)
    logger.info("Step 2: Visiting myaccount.google.com for API auth cookies")
    await page.goto("https://myaccount.google.com", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 3: YouTube main
    logger.info("Step 3: Visiting YouTube main page")
    await page.goto("https://www.youtube.com", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 4: YouTube subscriptions (triggers LOGIN_INFO - requires auth)
    logger.info("Step 4: Visiting YouTube subscriptions (requires auth)")
    await page.goto("https://www.youtube.com/feed/subscriptions", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 5: YouTube Studio (additional auth coverage)
    logger.info("Step 5: Visiting YouTube Studio")
    await page.goto("https://studio.youtube.com", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 6: Google main (cross-domain sync)
    logger.info("Step 6: Visiting Google main page")
    await page.goto("https://www.google.com", wait_until="networkidle")
    await asyncio.sleep(4)

    # Step 7: Final YouTube visit with extended wait
    logger.info("Step 7: Final navigation to YouTube with extended wait")
    await page.goto("https://www.youtube.com", wait_until="networkidle")
    await asyncio.sleep(6)  # Extended wait for cookie propagation

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
            logger.info(f"  ✓ {name} (domain: {found_auth[name]})")
        else:
            logger.warning(f"  ✗ {name} MISSING")

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