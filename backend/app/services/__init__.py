"""Service layer; submodule imports are lazy to keep `import app.services.X` light."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

__all__ = ["transcription_nlp_pipeline", "scrape_youtube", "JobService"]


def __getattr__(name: str) -> Any:
    if name == "transcription_nlp_pipeline":
        from .transcription_nlp import transcription_nlp_pipeline as tnp

        return tnp
    if name == "scrape_youtube":
        from .youtube_scraper import scrape_youtube as sy

        return sy
    if name == "JobService":
        from .jobs import JobService as JS

        return JS
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


if TYPE_CHECKING:
    from .transcription_nlp import transcription_nlp_pipeline
    from .youtube_scraper import scrape_youtube
    from .jobs import JobService
