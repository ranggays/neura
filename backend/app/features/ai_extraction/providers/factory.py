from app.core.config import Settings, get_settings
from app.core.errors import AIExtractionError
from app.features.ai_extraction.providers.base import GraphExtractionProvider
from app.features.ai_extraction.providers.gemini_provider import GeminiGraphExtractionProvider
from app.features.ai_extraction.providers.mock_provider import MockGraphExtractionProvider
from app.features.ai_extraction.providers.openai_provider import OpenAIGraphExtractionProvider


def create_graph_extraction_provider(settings: Settings | None = None) -> GraphExtractionProvider:
    resolved_settings = settings or get_settings()

    if resolved_settings.ai_provider == "mock":
        return MockGraphExtractionProvider()

    if resolved_settings.ai_provider == "openai":
        if resolved_settings.openai_api_key is None:
            raise AIExtractionError("OPENAI_API_KEY is required when AI_PROVIDER=openai.")

        return OpenAIGraphExtractionProvider(
            model=resolved_settings.ai_model,
            api_key=resolved_settings.openai_api_key,
            timeout_seconds=resolved_settings.openai_timeout_seconds,
        )

    if resolved_settings.ai_provider == "gemini":
        if resolved_settings.gemini_api_key is None:
            raise AIExtractionError("GEMINI_API_KEY is required when AI_PROVIDER=gemini.")

        return GeminiGraphExtractionProvider(
            model=resolved_settings.ai_model,
            api_key=resolved_settings.gemini_api_key,
        )

    raise AIExtractionError(f"Unsupported AI provider: {resolved_settings.ai_provider}")
