from fastapi import APIRouter

from app.core.config import get_settings
from app.features.graph.models import ApiModel

router = APIRouter()


class ConfigStatus(ApiModel):
    ai_provider: str
    ai_model: str
    source_provider: str
    source_language: str | None
    source_country: str | None
    gnews_configured: bool
    gemini_configured: bool
    openai_configured: bool
    rss_feed_count: int


@router.get("/status", response_model=ConfigStatus, response_model_by_alias=True)
async def get_config_status_endpoint() -> ConfigStatus:
    settings = get_settings()
    return ConfigStatus(
        ai_provider=settings.ai_provider,
        ai_model=settings.ai_model,
        source_provider=settings.source_provider,
        source_language=settings.gnews_lang if settings.source_provider == "gnews" else None,
        source_country=settings.gnews_country if settings.source_provider == "gnews" else None,
        gnews_configured=settings.gnews_api_key is not None,
        gemini_configured=settings.gemini_api_key is not None,
        openai_configured=settings.openai_api_key is not None,
        rss_feed_count=len(settings.rss_feed_urls),
    )
