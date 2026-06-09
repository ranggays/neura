from app.core.errors import SourceNotFoundError
from app.features.graph.models import NewsSource
from app.features.ingestion.mock_data import SOURCE_CONTENT_BY_ID
from app.features.ingestion.models import SourceContent
from app.features.search.mock_data import SEARCH_SOURCES


class MockSourceProvider:
    provider_name = "mock"

    def search_sources(self, query: str = "") -> list[NewsSource]:
        terms = [term for term in query.strip().lower().split() if term]

        if not terms:
            return [source.model_copy(deep=True) for source in SEARCH_SOURCES]

        return [
            source.model_copy(deep=True)
            for source in SEARCH_SOURCES
            if any(term in _build_search_haystack(source) for term in terms)
        ]

    def get_source_content(self, source_id: str) -> SourceContent:
        source_content = SOURCE_CONTENT_BY_ID.get(source_id)

        if source_content is None:
            raise SourceNotFoundError(f"Source not found: {source_id}")

        return source_content.model_copy(deep=True)


def _build_search_haystack(source: NewsSource) -> str:
    return " ".join([source.title, source.publisher, source.type, source.snippet]).lower()
