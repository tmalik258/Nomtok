"""Unit tests for Places API response caching."""

import pytest
from unittest.mock import AsyncMock

from app.services import places_api_new as pan


@pytest.mark.asyncio
async def test_get_reviews_calls_google_only_on_cache_miss(monkeypatch):
    raw = {"reviews": [], "rating": 4.2, "userRatingCount": 10}
    attempts = {"n": 0}
    calls = {"http": 0}

    async def fake_try_get(place_id, kind, variant):
        attempts["n"] += 1
        if attempts["n"] >= 2:
            return dict(raw)
        return None

    monkeypatch.setattr(pan, "places_cache_try_get_json", AsyncMock(side_effect=fake_try_get))
    monkeypatch.setattr(pan, "places_cache_put_json", AsyncMock())

    class FakeResponse:
        status_code = 200

        def json(self):
            return dict(raw)

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            calls["http"] += 1
            return FakeResponse()

    monkeypatch.setattr(pan.httpx, "AsyncClient", FakeClient)

    r1 = await pan.get_reviews("places/ChIJunitTest")
    r2 = await pan.get_reviews("places/ChIJunitTest")

    assert calls["http"] == 1
    assert r1["status"] == "OK"
    assert r2["status"] == "OK"
    assert r1["rating"] == pytest.approx(4.2)


@pytest.mark.asyncio
async def test_get_place_details_requires_fields():
    with pytest.raises(ValueError):
        await pan.get_place_details("places/x", fields=None)

    with pytest.raises(ValueError):
        await pan.get_place_details("places/x", fields=[])
