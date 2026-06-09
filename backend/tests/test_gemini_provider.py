from types import SimpleNamespace

import pytest

from app.core.config import Settings
from app.core.errors import AIExtractionError, AIResponseValidationError
from app.features.ai_extraction.gemini_schema import graph_patch_gemini_schema
from app.features.ai_extraction.providers.factory import create_graph_extraction_provider
from app.features.ai_extraction.providers.gemini_provider import GeminiGraphExtractionProvider
from app.features.ai_extraction.providers import factory
from app.features.ingestion.service import get_source_content
from app.features.search.mock_data import GRAPH_PATCHES


class FakeGeminiModels:
    def __init__(self, output_text: str, error: Exception | None = None) -> None:
        self.request = None
        self.output_text = output_text
        self.error = error

    def generate_content(self, **kwargs: object) -> SimpleNamespace:
        self.request = kwargs
        if self.error is not None:
            raise self.error
        return SimpleNamespace(text=self.output_text)


class FakeGeminiClient:
    def __init__(self, output_text: str, error: Exception | None = None) -> None:
        self.models = FakeGeminiModels(output_text, error=error)


class FakeGeminiProvider:
    def __init__(self, model: str, api_key: str) -> None:
        self.model = model
        self.api_key = api_key


def test_provider_factory_creates_gemini_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(factory, "GeminiGraphExtractionProvider", FakeGeminiProvider)

    provider = factory.create_graph_extraction_provider(
            Settings(
                ai_provider="gemini",
                ai_model="gemini-2.5-flash",
                source_provider="mock",
                rss_feed_urls=(),
                gnews_api_key=None,
                gnews_lang="id",
                gnews_country="id",
                gnews_max_results=10,
                openai_api_key=None,
                gemini_api_key="test-key",
                openai_timeout_seconds=30,
                source_fetch_timeout_seconds=15,
            )
        )

    assert isinstance(provider, FakeGeminiProvider)
    assert provider.model == "gemini-2.5-flash"


def test_provider_factory_requires_gemini_api_key() -> None:
    with pytest.raises(AIExtractionError):
        create_graph_extraction_provider(
            Settings(
                ai_provider="gemini",
                ai_model="gemini-2.5-flash",
                source_provider="mock",
                rss_feed_urls=(),
                gnews_api_key=None,
                gnews_lang="id",
                gnews_country="id",
                gnews_max_results=10,
                openai_api_key=None,
                gemini_api_key=None,
                openai_timeout_seconds=30,
                source_fetch_timeout_seconds=15,
            )
        )


def test_gemini_provider_parses_structured_graph_patch() -> None:
    source_content = get_source_content("digital-id-review")
    expected_patch = GRAPH_PATCHES["digital-id-review"].model_copy(
        update={"source": GRAPH_PATCHES["digital-id-review"].source.model_copy(update={"status": "imported"})},
        deep=True,
    )
    client = FakeGeminiClient(expected_patch.model_dump_json(by_alias=True))
    provider = GeminiGraphExtractionProvider(model="gemini-2.5-flash", api_key="test-key", client=client)

    patch = provider.extract_graph_patch(source_content)

    assert patch.source.id == "digital-id-review"
    assert patch.source.status == "imported"
    assert len(patch.nodes) == 5
    assert client.models.request is not None
    assert client.models.request["model"] == "gemini-2.5-flash"
    assert client.models.request["config"]["response_mime_type"] == "application/json"
    assert "response_json_schema" in client.models.request["config"]


def test_gemini_provider_rejects_invalid_json() -> None:
    source_content = get_source_content("digital-id-review")
    provider = GeminiGraphExtractionProvider(
        model="gemini-2.5-flash",
        api_key="test-key",
        client=FakeGeminiClient("not-json"),
    )

    with pytest.raises(AIResponseValidationError):
        provider.extract_graph_patch(source_content)


def test_gemini_provider_rejects_invalid_graph_shape() -> None:
    source_content = get_source_content("digital-id-review")
    provider = GeminiGraphExtractionProvider(
        model="gemini-2.5-flash",
        api_key="test-key",
        client=FakeGeminiClient('{"source": {"id": "digital-id-review"}}'),
    )

    with pytest.raises(AIResponseValidationError):
        provider.extract_graph_patch(source_content)


def test_gemini_provider_includes_request_failure_detail() -> None:
    source_content = get_source_content("digital-id-review")
    provider = GeminiGraphExtractionProvider(
        model="gemini-2.5-flash",
        api_key="test-key",
        client=FakeGeminiClient("", error=RuntimeError("quota exhausted")),
    )

    with pytest.raises(AIExtractionError, match="quota exhausted"):
        provider.extract_graph_patch(source_content)


def test_gemini_schema_inlines_refs_and_removes_unsupported_keys() -> None:
    schema = graph_patch_gemini_schema()

    assert "$defs" not in schema
    assert not _schema_contains_key(schema, "$ref")
    assert not _schema_contains_key(schema, "additionalProperties")
    assert not _schema_contains_metadata_key(schema, "title")
    assert schema["properties"]["source"]["properties"]["title"]["type"] == "string"


def _schema_contains_key(value: object, key: str) -> bool:
    if isinstance(value, dict):
        return key in value or any(_schema_contains_key(item, key) for item in value.values())

    if isinstance(value, list):
        return any(_schema_contains_key(item, key) for item in value)

    return False


def _schema_contains_metadata_key(value: object, key: str) -> bool:
    if isinstance(value, dict):
        return any(
            nested_key == key
            or (nested_key != "properties" and _schema_contains_metadata_key(nested_value, key))
            for nested_key, nested_value in value.items()
        )

    if isinstance(value, list):
        return any(_schema_contains_metadata_key(item, key) for item in value)

    return False
