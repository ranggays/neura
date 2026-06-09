from app.core.errors import AIExtractionError
from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent
from app.features.search.mock_data import GRAPH_PATCHES


class MockGraphExtractionProvider:
    provider_name = "mock-ai-extraction"
    prompt_version = "mock-v1"

    def extract_graph_patch(self, source_content: SourceContent) -> GraphPatch:
        patch = GRAPH_PATCHES.get(source_content.source.id)

        if patch is None:
            raise AIExtractionError(f"No mock extraction fixture for source: {source_content.source.id}")

        return patch.model_copy(
            update={"source": patch.source.model_copy(update={"status": "imported"})},
            deep=True,
        )
