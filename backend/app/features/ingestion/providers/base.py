from typing import Protocol

from app.features.graph.models import NewsSource
from app.features.ingestion.models import SourceContent


class SourceProvider(Protocol):
    provider_name: str

    def search_sources(self, query: str = "") -> list[NewsSource]:
        """Search available sources."""

    def get_source_content(self, source_id: str) -> SourceContent:
        """Return content for one source ID."""
