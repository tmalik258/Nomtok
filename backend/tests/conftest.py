"""Minimal env so `app.database` imports without a live Supabase connection."""

import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@127.0.0.1:59999/nonexistent_db",
)
os.environ.setdefault(
    "ASYNC_DATABASE_URL",
    "postgresql+asyncpg://test:test@127.0.0.1:59999/nonexistent_db",
)
