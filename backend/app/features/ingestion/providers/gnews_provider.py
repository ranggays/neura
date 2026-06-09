import re
from typing import Any, Callable

import httpx

from app.core.errors import SourceFetchError, SourceNotFoundError
from app.features.graph.models import NewsSource
from app.features.ingestion.models import SourceContent

FetchArticles = Callable[[str], dict[str, Any]]

GNEWS_SEARCH_URL = "https://gnews.io/api/v4/search"


class GNewsSourceProvider:
    provider_name = "gnews"

    def __init__(
        self,
        api_key: str,
        lang: str = "id",
        country: str | None = "id",
        max_results: int = 10,
        timeout_seconds: float = 15,
        fetch_articles: FetchArticles | None = None,
    ) -> None:
        self.api_key = api_key
        self.lang = lang
        self.country = country
        self.max_results = max_results
        self.timeout_seconds = timeout_seconds
        self._fetch_articles = fetch_articles or self._fetch_articles_from_api
        self._source_content_by_id: dict[str, SourceContent] = {}

    def search_sources(self, query: str = "") -> list[NewsSource]:
        resolved_query = query.strip() or "technology"

        try:
            payload = self._fetch_articles(resolved_query)
        except httpx.HTTPError as exc:
            raise SourceFetchError(f"GNews request failed: {exc}") from exc

        source_contents = [_article_to_source_content(article) for article in payload.get("articles", [])]
        self._source_content_by_id = {
            source_content.source.id: source_content.model_copy(deep=True)
            for source_content in source_contents
        }
        return [source_content.source for source_content in source_contents]

    def get_source_content(self, source_id: str) -> SourceContent:
        source_content = self._source_content_by_id.get(source_id)

        if source_content is None:
            raise SourceNotFoundError(
                f"Source not found in latest GNews search result: {source_id}. Search before importing."
            )

        return source_content.model_copy(deep=True)

    def _fetch_articles_from_api(self, query: str) -> dict[str, Any]:
        params: dict[str, str | int] = {
            "q": query,
            "apikey": self.api_key,
            "lang": self.lang,
            "max": self.max_results,
        }

        if self.country:
            params["country"] = self.country

        response = httpx.get(GNEWS_SEARCH_URL, params=params, timeout=self.timeout_seconds)
        response.raise_for_status()
        return response.json()


def _article_to_source_content(article: dict[str, Any]) -> SourceContent:
    title = str(article.get("title") or "Untitled source")
    url = str(article.get("url") or f"https://example.test/gnews/{_slugify(title)}")
    description = _clean_text(str(article.get("description") or ""))
    content = _clean_text(str(article.get("content") or ""))
    source = article.get("source") if isinstance(article.get("source"), dict) else {}
    publisher = str(source.get("name") or "GNews")
    body = content or description or title

    return SourceContent(
        source=NewsSource(
            id=_slugify(url or title),
            title=title,
            publisher=publisher,
            published_at=str(article.get("publishedAt") or ""),
            url=url,
            type="news",
            snippet=description or body[:220] or title,
            status="available",
        ),
        body=body,
    )


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _slugify(value: str) -> str:
    normalized = re.sub(r"^https?://", "", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")[:96] or "source"
