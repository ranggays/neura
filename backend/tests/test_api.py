import httpx
import pytest

from app.features.search import service as search_service
from app.main import app


@pytest.mark.anyio
async def test_health_endpoint_returns_ok() -> None:
    async with create_test_client() as client:
        response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_search_endpoint_filters_mock_sources() -> None:
    async with create_test_client() as client:
        response = await client.get("/api/sources/search", params={"q": "komdigi"})

        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["id"] == "digital-id-review"
        assert results[0]["publishedAt"] == "2026-05-22"


@pytest.mark.anyio
async def test_config_status_endpoint_returns_non_secret_provider_state() -> None:
    async with create_test_client() as client:
        response = await client.get("/api/config/status")

        assert response.status_code == 200
        payload = response.json()
        assert payload["aiProvider"] == "mock"
        assert payload["sourceProvider"] == "mock"
        assert payload["gnewsConfigured"] is False
        assert "gnewsApiKey" not in payload


@pytest.mark.anyio
async def test_search_endpoint_returns_422_for_misconfigured_source_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SOURCE_PROVIDER", "rss")

    async with create_test_client() as client:
        response = await client.get("/api/sources/search", params={"q": "digital"})

        assert response.status_code == 422
        assert response.json()["detail"] == "RSS_FEED_URLS is required when SOURCE_PROVIDER=rss."


@pytest.mark.anyio
async def test_search_endpoint_returns_502_for_source_fetch_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FailingSourceProvider:
        provider_name = "rss"

        def search_sources(self, query: str = ""):
            from app.core.errors import SourceFetchError

            raise SourceFetchError("RSS feed request failed for https://example.test/feed.xml")

        def get_source_content(self, source_id: str):
            raise AssertionError("Should not fetch source content")

    monkeypatch.setattr(search_service, "create_source_provider", lambda: FailingSourceProvider())

    async with create_test_client() as client:
        response = await client.get("/api/sources/search", params={"q": "digital"})

        assert response.status_code == 502
        assert "RSS feed request failed" in response.json()["detail"]


@pytest.mark.anyio
async def test_import_endpoint_returns_graph_patch() -> None:
    async with create_test_client() as client:
        response = await client.post("/api/sources/digital-id-review/import")

        assert response.status_code == 200
        payload = response.json()
        assert payload["source"]["id"] == "digital-id-review"
        assert payload["source"]["status"] == "imported"
        assert len(payload["nodes"]) == 5
        assert len(payload["edges"]) == 4
        assert payload["edges"][0]["fromNodeId"] == "src-digital-id-review"


@pytest.mark.anyio
async def test_import_updates_graph_state() -> None:
    async with create_test_client() as client:
        import_response = await client.post("/api/sources/digital-id-review/import")
        graph_response = await client.get("/api/graph")

        assert import_response.status_code == 200
        assert graph_response.status_code == 200

        graph = graph_response.json()
        assert [source["id"] for source in graph["sources"]] == ["digital-id-review"]
        assert len(graph["nodes"]) == 5
        assert len(graph["edges"]) == 4


@pytest.mark.anyio
async def test_graph_reset_endpoint_clears_graph_state() -> None:
    async with create_test_client() as client:
        import_response = await client.post("/api/sources/digital-id-review/import")
        reset_response = await client.post("/api/graph/reset")

        assert import_response.status_code == 200
        assert reset_response.status_code == 200
        assert reset_response.json() == {"sources": [], "nodes": [], "edges": []}


@pytest.mark.anyio
async def test_import_unknown_source_returns_404() -> None:
    async with create_test_client() as client:
        response = await client.post("/api/sources/missing-source/import")

        assert response.status_code == 404


def create_test_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")
