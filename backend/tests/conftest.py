import pytest

from app.core.config import get_settings
from app.features.graph.service import reset_graph_state
from app.features.ingestion.repository import clear_source_content_cache


@pytest.fixture(autouse=True)
def reset_state(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "mock")
    monkeypatch.setenv("SOURCE_PROVIDER", "mock")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GNEWS_API_KEY", raising=False)
    monkeypatch.delenv("RSS_FEED_URLS", raising=False)
    get_settings.cache_clear()
    reset_graph_state()
    clear_source_content_cache()
    yield
    clear_source_content_cache()
    get_settings.cache_clear()


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
