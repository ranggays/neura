import httpx
import pytest

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
async def test_import_unknown_source_returns_404() -> None:
    async with create_test_client() as client:
        response = await client.post("/api/sources/missing-source/import")

        assert response.status_code == 404


def create_test_client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")
