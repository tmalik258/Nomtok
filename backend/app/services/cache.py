from __future__ import annotations

import json
import hashlib
from typing import Any, Optional

from cachetools import TTLCache
from redis import Redis

from app.config import REDIS_URL


class CacheService:
    """Simple cache service with Redis primary and in-memory TTL fallback.

    Stores JSON-serializable payloads and exposes basic metrics.
    """

    def __init__(self, namespace: str = "api") -> None:
        self.namespace = namespace
        self._metrics = {"hits": 0, "misses": 0}
        self._redis: Optional[Redis] = None
        try:
            self._redis = Redis.from_url(REDIS_URL, socket_timeout=1, socket_connect_timeout=1, decode_responses=True)
            # Probe connection
            self._redis.ping()
        except Exception:
            self._redis = None

        # Fallback in-memory cache, sized to 1k entries with per-entry TTL applied on insert
        self._memory_cache = TTLCache(maxsize=1024, ttl=300)

    def _full_key(self, key: str) -> str:
        return f"cache:{self.namespace}:{key}"

    def get(self, key: str) -> Optional[dict]:
        full_key = self._full_key(key)
        try:
            if self._redis:
                raw = self._redis.get(full_key)
                if raw is not None:
                    self._metrics["hits"] += 1
                    return json.loads(raw)
            else:
                val = self._memory_cache.get(full_key)
                if val is not None:
                    self._metrics["hits"] += 1
                    return val
        except Exception:
            # On any error, treat as miss
            pass
        self._metrics["misses"] += 1
        return None

    def set(self, key: str, value: dict, ttl_seconds: int = 300) -> None:
        full_key = self._full_key(key)
        try:
            if self._redis:
                self._redis.set(full_key, json.dumps(value), ex=ttl_seconds)
            else:
                # TTLCache managed per-cache; overwrite value and rely on cache ttl
                self._memory_cache[full_key] = value
        except Exception:
            # Best-effort; ignore
            pass

    def invalidate_prefix(self, prefix: str) -> int:
        full_prefix = self._full_key(prefix)
        removed = 0
        try:
            if self._redis:
                # Use scan to avoid blocking
                cursor = 0
                while True:
                    cursor, keys = self._redis.scan(cursor=cursor, match=f"{full_prefix}*")
                    if keys:
                        removed += self._redis.delete(*keys)
                    if cursor == 0:
                        break
            else:
                for k in list(self._memory_cache.keys()):
                    if isinstance(k, str) and k.startswith(full_prefix):
                        try:
                            del self._memory_cache[k]
                            removed += 1
                        except KeyError:
                            pass
        except Exception:
            pass
        return removed

    def metrics(self) -> dict:
        mem_size = len(self._memory_cache)
        return {
            "namespace": self.namespace,
            "hits": self._metrics["hits"],
            "misses": self._metrics["misses"],
            "memory_cache_size": mem_size,
            "redis_enabled": bool(self._redis),
        }


def generate_etag(payload: Any) -> str:
    """Generate a weak ETag from a JSON-serializable payload."""
    try:
        # Ensure stable JSON with sorted keys
        json_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    except TypeError:
        # Fallback to string representation
        json_str = str(payload)
    digest = hashlib.sha256(json_str.encode("utf-8")).hexdigest()
    # Use weak ETag format
    return f"W/\"{digest}\""


async def cache_json_response(
    request,
    cache: CacheService,
    key: str,
    ttl_seconds: int,
    compute_func,
    cache_control: Optional[str] = None,
):
    """
    High-level helper for caching JSON responses with ETag and Cache-Control.

    - Checks cache for stored payload+etag
    - Validates If-None-Match and returns 304 if matched
    - Computes payload on miss, stores with TTL, and returns JSONResponse with headers
    """
    from fastapi.encoders import jsonable_encoder
    from fastapi.responses import JSONResponse

    # Try cache first
    cached = cache.get(key)
    if cached is not None:
        etag = cached.get("etag")
        if etag and request.headers.get("if-none-match") == etag:
            headers = {"ETag": etag}
            if cache_control:
                headers["Cache-Control"] = cache_control
            return JSONResponse(status_code=304, content=None, headers=headers)
        headers = {"ETag": etag} if etag else {}
        if cache_control:
            headers["Cache-Control"] = cache_control
        return JSONResponse(content=cached.get("data"), headers=headers)

    # Miss: compute
    result = await compute_func()
    payload = jsonable_encoder(result)
    etag = generate_etag(payload)
    cache.set(key, {"data": payload, "etag": etag}, ttl_seconds)

    headers = {"ETag": etag}
    # Default Cache-Control if not provided
    headers["Cache-Control"] = cache_control or f"public, max-age={ttl_seconds}"

    return JSONResponse(content=payload, headers=headers)