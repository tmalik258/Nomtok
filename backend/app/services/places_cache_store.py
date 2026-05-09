"""Persistent cache for Places API (New) responses (Supabase/Postgres)."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import AsyncSessionLocal
from app.models.places_cache import PlacesCache
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

CACHE_KIND_REVIEWS = "reviews"
CACHE_KIND_PLACE_DETAILS = "place_details"
CACHE_KIND_TEXT_SEARCH = "text_search"

TTL_DAYS = {
    CACHE_KIND_REVIEWS: 30,
    CACHE_KIND_PLACE_DETAILS: 30,
    CACHE_KIND_TEXT_SEARCH: 30,
}


def variant_from_sorted_fields(fields: list[str]) -> str:
    normalized = ",".join(sorted(fields))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:32]


def variant_from_text_query(query: str) -> str:
    normalized = " ".join(query.strip().lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:32]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _is_stale(fetched_at: datetime, ttl_days: int) -> bool:
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    return fetched_at + timedelta(days=ttl_days) <= _utcnow()


async def places_cache_try_get_json(
    place_id: str, cache_kind: str, variant: str
) -> Optional[Dict[str, Any]]:
    ttl_days = TTL_DAYS.get(cache_kind, 30)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PlacesCache).where(
                PlacesCache.place_id == place_id,
                PlacesCache.cache_kind == cache_kind,
                PlacesCache.variant == variant,
            )
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        if _is_stale(row.fetched_at, ttl_days):
            logger.debug(
                "places_cache stale %s place_id=%s variant=%s",
                cache_kind,
                place_id[:24] if place_id else "",
                variant[:16] if variant else "",
            )
            return None
        return dict(row.data) if isinstance(row.data, dict) else row.data


async def places_cache_put_json(
    place_id: str, cache_kind: str, variant: str, data: Dict[str, Any]
) -> None:
    ts = _utcnow()
    async with AsyncSessionLocal() as session:
        insert_stmt = pg_insert(PlacesCache).values(
            place_id=place_id,
            cache_kind=cache_kind,
            variant=variant or "",
            data=data,
            fetched_at=ts,
        )
        upsert = insert_stmt.on_conflict_do_update(
            index_elements=[
                PlacesCache.place_id,
                PlacesCache.cache_kind,
                PlacesCache.variant,
            ],
            set_= {
                "data": insert_stmt.excluded.data,
                "fetched_at": insert_stmt.excluded.fetched_at,
            },
        )
        await session.execute(upsert)
        await session.commit()
