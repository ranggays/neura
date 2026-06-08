from app.core.errors import SourceNotFoundError
from app.features.graph.models import GraphPatch, NewsSource
from app.features.search.mock_data import GRAPH_PATCHES, SEARCH_SOURCES


def search_sources(query: str = "") -> list[NewsSource]:
    terms = [term for term in query.strip().lower().split() if term]

    if not terms:
        return SEARCH_SOURCES

    return [
        source
        for source in SEARCH_SOURCES
        if any(term in build_search_haystack(source) for term in terms)
    ]


def get_graph_patch_for_source(source_id: str) -> GraphPatch:
    patch = GRAPH_PATCHES.get(source_id)

    if patch is None:
        raise SourceNotFoundError(f"Source not found: {source_id}")

    return patch.model_copy(
        update={"source": patch.source.model_copy(update={"status": "imported"})},
        deep=True,
    )


def build_search_haystack(source: NewsSource) -> str:
    return " ".join([source.title, source.publisher, source.type, source.snippet]).lower()
