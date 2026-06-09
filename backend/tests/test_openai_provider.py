from types import SimpleNamespace

import pytest

from app.core.config import Settings
from app.core.errors import AIExtractionError, AIResponseValidationError
from app.features.ai_extraction.providers.factory import create_graph_extraction_provider
from app.features.ai_extraction.providers.mock_provider import MockGraphExtractionProvider
from app.features.ai_extraction.providers.openai_provider import OpenAIGraphExtractionProvider
from app.features.ai_extraction.response_format import graph_patch_response_format
from app.features.ingestion.service import get_source_content
from app.features.search.mock_data import GRAPH_PATCHES


class FakeResponses:
    def __init__(self, output_text: str, error: Exception | None = None) -> None:
        self.request = None
        self.output_text = output_text
        self.error = error

    def create(self, **kwargs: object) -> SimpleNamespace:
        self.request = kwargs
        if self.error is not None:
            raise self.error
        return SimpleNamespace(output_text=self.output_text)


class FakeOpenAIClient:
    def __init__(self, output_text: str) -> None:
        self.responses = FakeResponses(output_text)


class FakeFailingOpenAIClient:
    def __init__(self, error: Exception) -> None:
        self.responses = FakeResponses("", error=error)


def test_provider_factory_defaults_to_mock() -> None:
    provider = create_graph_extraction_provider(
            Settings(
                ai_provider="mock",
                ai_model="gpt-5.2",
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

    assert isinstance(provider, MockGraphExtractionProvider)


def test_provider_factory_requires_openai_api_key() -> None:
    with pytest.raises(AIExtractionError):
        create_graph_extraction_provider(
            Settings(
                ai_provider="openai",
                ai_model="gpt-5.2",
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


def test_openai_provider_parses_structured_graph_patch() -> None:
    source_content = get_source_content("digital-id-review")
    expected_patch = GRAPH_PATCHES["digital-id-review"].model_copy(
        update={"source": GRAPH_PATCHES["digital-id-review"].source.model_copy(update={"status": "imported"})},
        deep=True,
    )
    client = FakeOpenAIClient(expected_patch.model_dump_json(by_alias=True))
    provider = OpenAIGraphExtractionProvider(model="gpt-5.2", api_key="test-key", client=client)

    patch = provider.extract_graph_patch(source_content)

    assert patch.source.id == "digital-id-review"
    assert patch.source.status == "imported"
    assert len(patch.nodes) == 5
    assert client.responses.request is not None
    assert client.responses.request["model"] == "gpt-5.2"
    assert client.responses.request["text"]["format"]["type"] == "json_schema"


def test_openai_provider_rejects_invalid_json() -> None:
    source_content = get_source_content("digital-id-review")
    provider = OpenAIGraphExtractionProvider(
        model="gpt-5.2",
        api_key="test-key",
        client=FakeOpenAIClient("not-json"),
    )

    with pytest.raises(AIResponseValidationError):
        provider.extract_graph_patch(source_content)


def test_openai_provider_rejects_invalid_graph_shape() -> None:
    source_content = get_source_content("digital-id-review")
    provider = OpenAIGraphExtractionProvider(
        model="gpt-5.2",
        api_key="test-key",
        client=FakeOpenAIClient('{"source": {"id": "digital-id-review"}}'),
    )

    with pytest.raises(AIResponseValidationError):
        provider.extract_graph_patch(source_content)


def test_openai_provider_includes_request_failure_detail() -> None:
    source_content = get_source_content("digital-id-review")
    provider = OpenAIGraphExtractionProvider(
        model="gpt-5.2",
        api_key="test-key",
        client=FakeFailingOpenAIClient(RuntimeError("schema rejected")),
    )

    with pytest.raises(AIExtractionError, match="schema rejected"):
        provider.extract_graph_patch(source_content)


def test_graph_patch_response_format_removes_unsupported_strict_schema_keywords() -> None:
    response_format = graph_patch_response_format()
    schema = response_format["schema"]
    source_properties = schema["$defs"]["NewsSource"]["properties"]

    assert response_format["type"] == "json_schema"
    assert response_format["strict"] is True
    assert "title" in source_properties
    assert "title" in schema["$defs"]["NewsSource"]["required"]
    assert not _schema_contains_schema_metadata_key(response_format["schema"], "minItems")
    assert not _schema_contains_schema_metadata_key(response_format["schema"], "title")


def _schema_contains_schema_metadata_key(value: object, key: str) -> bool:
    if isinstance(value, dict):
        return any(
            nested_key == key
            or (
                nested_key != "properties"
                and _schema_contains_schema_metadata_key(nested_value, key)
            )
            for nested_key, nested_value in value.items()
        )

    if isinstance(value, list):
        return any(_schema_contains_schema_metadata_key(item, key) for item in value)

    return False
