from app.core.config import Settings, get_settings
from app.core.errors import SourceNotFoundError
from app.features.ingestion.providers.base import SourceProvider
from app.features.ingestion.providers.gnews_provider import GNewsSourceProvider
from app.features.ingestion.providers.mock_provider import MockSourceProvider
from app.features.ingestion.providers.rss_provider import RSSSourceProvider


def create_source_provider(settings: Settings | None = None) -> SourceProvider:
    resolved_settings = settings or get_settings()

    if resolved_settings.source_provider == "mock":
        return MockSourceProvider()

    if resolved_settings.source_provider == "rss":
        if not resolved_settings.rss_feed_urls:
            raise SourceNotFoundError("RSS_FEED_URLS is required when SOURCE_PROVIDER=rss.")

        return RSSSourceProvider(
            feed_urls=resolved_settings.rss_feed_urls,
            timeout_seconds=resolved_settings.source_fetch_timeout_seconds,
        )

    if resolved_settings.source_provider == "gnews":
        if resolved_settings.gnews_api_key is None:
            raise SourceNotFoundError("GNEWS_API_KEY is required when SOURCE_PROVIDER=gnews.")

        return GNewsSourceProvider(
            api_key=resolved_settings.gnews_api_key,
            lang=resolved_settings.gnews_lang,
            country=resolved_settings.gnews_country,
            max_results=resolved_settings.gnews_max_results,
            timeout_seconds=resolved_settings.source_fetch_timeout_seconds,
        )

    raise SourceNotFoundError(f"Unsupported source provider: {resolved_settings.source_provider}")
