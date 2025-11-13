import os
from dotenv import load_dotenv

load_dotenv()

# configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", None)
ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL", None)

# Redis lock keys
SCRAPE_YOUTUBE_LOCK = "lock:scrape_youtube"
TRANSCRIPTION_NLP_LOCK = "lock:transcription_nlp"
REFRESH_YOUTUBE_COOKIES_LOCK = "lock:refresh_youtube_cookies"

# supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

# admin
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# google
GOOGLE_EMAIL = os.getenv("GOOGLE_EMAIL")
GOOGLE_PASSWORD = os.getenv("GOOGLE_PASSWORD")

# API KEYS
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# Headful mode configuration
HEADFUL_MODE = os.getenv("HEADFUL_MODE", "true").lower() == "true"
HEADFUL_DISPLAY = os.getenv("HEADFUL_DISPLAY", ":99")  # For Xvfb in Docker

# Enhanced browser security configuration
PRODUCTION_BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-automation',
    '--disable-extensions',
    '--no-first-run',
    '--no-service-autorun',
    '--password-store=basic',
    '--disable-background-networking',
    '--disable-component-extensions-with-background-pages',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-features=PrivacySandboxSettings4',
    '--disable-features=PrivacySandboxAdsAPIsM1Override',
    '--disable-features=PrivacySandboxProactiveTopicsBlocking',
    '--disable-features=FedCm',
    '--disable-features=FedCmIdPRegistration',
    '--disable-features=FedCmIdPSigninStatus',
    '--disable-features=FedCmAuthz',
    '--disable-features=FedCmActive',
    '--disable-features=FedCmWithoutThirdPartyCookies',
    '--disable-features=FedCmWithoutWellKnownEnforcement',
    '--disable-features=FedCmMultipleIdentityProviders',
    '--disable-features=FedCmSelectiveDisclosure',
    '--disable-features=FedCmUserInfo',
    '--disable-features=FedCmAutoSelectedFlag',
]

# Enhanced HTTP headers for security
SECURITY_HEADERS = {
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Chromium";v="140", "Not;A=Brand";v="99", "Google Chrome";v="140"',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version': '"140.0.0.0"',
    'sec-ch-ua-full-version-list': '"Chromium";v="140.0.0.0", "Not;A=Brand";v="99.0.0.0", "Google Chrome";v="140.0.0.0"',
    'upgrade-insecure-requests': '1',
    'dnt': '1',
}

# Influencer channels
INFLUENCER_CHANNELS = [
    {"url": "https://www.youtube.com/@alexandertheguest", "name": "Alexander The Guest", "region": None},
    {"url": "https://www.youtube.com/@thefoodranger", "name": "The Food Ranger", "region": "Canada"},
    {"url": "https://www.youtube.com/@OneBitePizzaReviews", "name": "One Bite Pizza Reviews", "region": "USA"},
    {"url": "https://www.youtube.com/@ligier", "name": "Ligier", "region": None},
    {"url": "https://www.youtube.com/@MarkWiens", "name": "Mark Wiens", "region": "Thailand"},
    {"url": "https://www.youtube.com/@AnthonyBourdainPartsUnknown", "name": "Anthony Bourdain Parts Unknown", "region": "USA"},
    {"url": "https://www.youtube.com/@eatingwithtod", "name": "Eating with Tod", "region": None},
    {"url": "https://www.youtube.com/@HarrisonWebb97", "name": "Harrison Webb", "region": None},
    {"url": "https://www.youtube.com/@BestEverFoodReviewShow", "name": "Best Ever Food Review Show", "region": "Vietnam"},
    {"url": "https://www.youtube.com/@strictlydumpling", "name": "Strictly Dumpling", "region": "USA"},
    {"url": "https://www.youtube.com/@andersandkaitlin", "name": "Anders and Kaitlin", "region": "Nordic"},
    {"url": "https://www.youtube.com/@S3Lifestyle", "name": "S3 Lifestyle", "region": None},
    {"url": "https://www.youtube.com/@Journeys007", "name": "Journeys007", "region": None},
]

# Entities Extractor
CHUNK_SIZE = 4000 # Chunk size for transcription
TOKEN_SIZE = 4500

# Base directory for audio downloads
AUDIO_BASE_DIR = "audios"

# yt-dlp cookie/auth config (optional)
YTDLP_COOKIES_FILE = os.getenv("YTDLP_COOKIES_FILE")  # path to cookies.txt
YTDLP_COOKIES_FROM_BROWSER = os.getenv("YTDLP_COOKIES_FROM_BROWSER", "chrome")  # e.g., "chrome", "edge"
YTDLP_BROWSER_PROFILE = os.getenv("YTDLP_BROWSER_PROFILE", "Default")  # optional profile name/id
# Add proxy and geo-bypass options for yt-dlp
YTDLP_PROXY = os.getenv("YTDLP_PROXY")  # optional proxy (e.g., http://user:pass@host:port)
YTDLP_GEO_BYPASS = os.getenv("YTDLP_GEO_BYPASS", "true").lower() == "true"
YTDLP_GEO_COUNTRY = os.getenv("YTDLP_GEO_COUNTRY")  # e.g., "PK" or "AE"

# PO Token provider configuration
POT_PROVIDER_METHOD = os.getenv("POT_PROVIDER_METHOD", "http")  # "http" or "script"
POT_PROVIDER_BASE_URL = os.getenv("POT_PROVIDER_BASE_URL", "http://bgutil-provider:4416")
POT_SCRIPT_PATH = os.getenv("POT_SCRIPT_PATH")  # path to bgutil script build/generate_once.js
POT_DISABLE_INNERTUBE = os.getenv("POT_DISABLE_INNERTUBE", "false").lower() == "true"
YTDLP_PLAYER_CLIENT = os.getenv("YTDLP_PLAYER_CLIENT", "default,mweb")

TOR_PROXY = "socks5://tor:9150"

# Base URL for Places API
PLACES_BASE_URL = "https://places.googleapis.com/v1"