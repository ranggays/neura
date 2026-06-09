from typing import Protocol

from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent


class GraphExtractionProvider(Protocol):
    provider_name: str
    prompt_version: str

    def extract_graph_patch(self, source_content: SourceContent) -> GraphPatch:
        """Extract a source-backed graph patch from source content."""
