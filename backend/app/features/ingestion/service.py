from app.features.ingestion.models import SourceContent
from app.features.ingestion.providers.base import SourceProvider
from app.features.ingestion.providers.factory import create_source_provider
from app.features.ingestion.repository import get_cached_source_content, save_source_contents


def get_source_content(source_id: str, provider: SourceProvider | None = None) -> SourceContent:
    cached_source_content = get_cached_source_content(source_id)

    if cached_source_content is not None:
        return cached_source_content

    source_provider = provider or create_source_provider()
    source_content = source_provider.get_source_content(source_id)
    save_source_contents([source_content])
    return source_content
