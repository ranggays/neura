from app.features.graph.models import NewsSource
from app.features.ingestion.providers.base import SourceProvider
from app.features.ingestion.providers.factory import create_source_provider
from app.features.ingestion.repository import save_source_contents


def search_sources(query: str = "", provider: SourceProvider | None = None) -> list[NewsSource]:
    source_provider = provider or create_source_provider()
    sources = source_provider.search_sources(query)

    source_contents = [source_provider.get_source_content(source.id) for source in sources]
    save_source_contents(source_contents)

    return sources
