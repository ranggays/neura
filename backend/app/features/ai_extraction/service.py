from app.features.ai_extraction.models import ExtractionRequest, ExtractionResult
from app.features.ai_extraction.normalizer import normalize_extracted_graph_patch
from app.features.ai_extraction.parser import validate_extracted_graph_patch
from app.features.ai_extraction.providers.base import GraphExtractionProvider
from app.features.ai_extraction.providers.factory import create_graph_extraction_provider
from app.core.errors import AIExtractionError
from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent

MAX_EXTRACTION_ATTEMPTS = 3


def extract_graph_patch(
    source_content: SourceContent,
    provider: GraphExtractionProvider | None = None,
) -> GraphPatch:
    extraction_provider = provider or create_graph_extraction_provider()
    request = ExtractionRequest(source_content=source_content)
    raw_patch = _extract_with_retry(extraction_provider, request)
    normalized_patch = normalize_extracted_graph_patch(request.source_content, raw_patch)
    result = ExtractionResult(
        graph_patch=validate_extracted_graph_patch(request.source_content, normalized_patch),
        provider_name=extraction_provider.provider_name,
        prompt_version=extraction_provider.prompt_version,
    )
    return result.graph_patch


def _extract_with_retry(
    extraction_provider: GraphExtractionProvider,
    request: ExtractionRequest,
) -> GraphPatch:
    last_error: AIExtractionError | None = None

    for attempt in range(1, MAX_EXTRACTION_ATTEMPTS + 1):
        try:
            return extraction_provider.extract_graph_patch(request.source_content)
        except AIExtractionError as exc:
            last_error = exc
            if attempt == MAX_EXTRACTION_ATTEMPTS:
                break

    if last_error is not None:
        raise AIExtractionError(
            f"AI extraction failed after {MAX_EXTRACTION_ATTEMPTS} attempts: {last_error}"
        ) from last_error

    raise AIExtractionError("AI extraction failed before a provider request was made.")
