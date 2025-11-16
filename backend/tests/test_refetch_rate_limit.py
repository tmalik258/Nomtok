import pytest
from fastapi import HTTPException

from app.routes.restaurants import refetch_restaurant_photo


class StubScalars:
    def __init__(self, obj):
        self._obj = obj
    def first(self):
        return self._obj


class StubResult:
    def __init__(self, obj):
        self._obj = obj
    def scalars(self):
        return StubScalars(self._obj)


class StubDB:
    def __init__(self, restaurant):
        self.restaurant = restaurant
    async def execute(self, _):
        return StubResult(self.restaurant)
    async def commit(self):
        return None
    async def refresh(self, _):
        return None


class FakeCache:
    def __init__(self):
        self.store = {}
    def get(self, key: str):
        return self.store.get(key)
    def set(self, key: str, value: dict, ttl_seconds: int = 300):
        self.store[key] = value
    def invalidate_prefix(self, prefix: str):
        to_del = [k for k in list(self.store.keys()) if k.startswith(prefix)]
        for k in to_del:
            self.store.pop(k, None)
        return len(to_del)


@pytest.mark.asyncio
async def test_refetch_rejected_when_lock_present(monkeypatch):
    class FakeCacheService:
        def __init__(self, ns: str):
            self.fake = FakeCache()
        def get(self, key: str):
            # Simulate lock present
            return {"ts": 0} if ":lock:" in key else None
        def set(self, key: str, value: dict, ttl_seconds: int = 300):
            return None
        def invalidate_prefix(self, prefix: str):
            return 0

    monkeypatch.setattr("app.routes.restaurants.CacheService", FakeCacheService)

    restaurant = type("R", (), {"google_place_id": "pid123", "photo_url": "http://u"})()
    db = StubDB(restaurant)

    with pytest.raises(HTTPException) as exc:
        await refetch_restaurant_photo("slug", db)
    assert exc.value.status_code == 429


@pytest.mark.asyncio
async def test_refetch_throttled_returns_current_url(monkeypatch):
    called = {"refetch": False}

    async def fake_refetch(place_id: str):
        called["refetch"] = True
        return "http://new"

    class FakeCacheService:
        def __init__(self, ns: str):
            self.fake = FakeCache()
        def get(self, key: str):
            # Simulate recent last refetch
            return {"ts": 9999999999} if ":last:" in key else None
        def set(self, key: str, value: dict, ttl_seconds: int = 300):
            return None
        def invalidate_prefix(self, prefix: str):
            return 0

    monkeypatch.setattr("app.routes.restaurants.CacheService", FakeCacheService)
    monkeypatch.setattr("app.routes.restaurants.refetch_photo_by_place_id", fake_refetch)

    restaurant = type("R", (), {"google_place_id": "pid123", "photo_url": "http://u"})()
    db = StubDB(restaurant)

    result = await refetch_restaurant_photo("slug", db)
    assert result["photo_url"] == "http://u"
    assert called["refetch"] is False


@pytest.mark.asyncio
async def test_refetch_executes_when_not_throttled(monkeypatch):
    async def fake_refetch(place_id: str):
        return "http://new"

    class FakeCacheService:
        def __init__(self, ns: str):
            self.fake = FakeCache()
        def get(self, key: str):
            return None
        def set(self, key: str, value: dict, ttl_seconds: int = 300):
            return None
        def invalidate_prefix(self, prefix: str):
            return 0

    monkeypatch.setattr("app.routes.restaurants.CacheService", FakeCacheService)
    monkeypatch.setattr("app.routes.restaurants.refetch_photo_by_place_id", fake_refetch)

    restaurant = type("R", (), {"google_place_id": "pid123", "photo_url": "http://u"})()
    db = StubDB(restaurant)

    result = await refetch_restaurant_photo("slug", db)
    assert result["photo_url"] == "http://new"