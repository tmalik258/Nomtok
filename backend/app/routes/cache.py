from fastapi import APIRouter, Query

from app.services.cache import CacheService

router = APIRouter()


@router.get("/metrics")
async def cache_metrics(namespace: str | None = Query(None, description="Optional cache namespace to query")):
    """Return cache hit/miss metrics and basic state."""
    if namespace:
        cache = CacheService(namespace)
        return cache.metrics()
    # Aggregate common namespaces
    namespaces = ["tags", "cuisines"]
    data = {}
    for ns in namespaces:
        data[ns] = CacheService(ns).metrics()
    return data