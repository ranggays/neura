import pytest

from app.core.config import Settings
from app.core.errors import SourceFetchError, SourceNotFoundError
from app.features.ingestion.providers import factory
from app.features.ingestion.providers.factory import create_source_provider
from app.features.ingestion.providers.gnews_provider import GNewsSourceProvider
from app.features.ingestion.providers.mock_provider import MockSourceProvider
from app.features.ingestion.providers.rss_provider import RSSSourceProvider, parse_feed_source_contents
from app.features.ingestion.repository import get_cached_source_content
from app.features.ingestion.service import get_source_content
from app.features.search.service import search_sources

RSS_FEED = """<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Policy Feed</title>
    <item>
      <title>Digital ID review expands public consultation</title>
      <link>https://news.test/policy/digital-id-consultation</link>
      <pubDate>Mon, 08 Jun 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[Komdigi opens another consultation phase for digital identity safeguards.]]></description>
    </item>
    <item>
      <title>Transport agency releases route update</title>
      <link>https://news.test/transport/route-update</link>
      <pubDate>Mon, 08 Jun 2026 11:00:00 GMT</pubDate>
      <description>Transport operations update.</description>
    </item>
  </channel>
</rss>
"""

ATOM_FEED = """<?xml version="1.0" encoding="UTF-8" ?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Official Updates</title>
  <entry>
    <id>tag:official.test,2026:pdp-guidance</id>
    <title>PDP guidance published</title>
    <updated>2026-06-08T09:00:00Z</updated>
    <link href="https://official.test/pdp-guidance" />
    <summary>Controller obligations and safeguards are described.</summary>
  </entry>
</feed>
"""

GNEWS_RESPONSE = {
    "totalArticles": 1,
    "articles": [
        {
            "title": "Komdigi reviews digital identity safeguards",
            "description": "Officials and civil society discuss digital identity safeguards.",
            "content": "Komdigi is reviewing digital identity safeguards with public agencies and privacy advocates.",
            "url": "https://news.test/komdigi-digital-identity",
            "publishedAt": "2026-06-08T09:00:00Z",
            "source": {"name": "Policy News"},
        }
    ],
}


class FakeRSSProvider:
    provider_name = "rss"

    def __init__(self) -> None:
        self.provider = RSSSourceProvider(feed_urls=("https://feed.test/rss.xml",), fetch_feed=lambda _: RSS_FEED)

    def search_sources(self, query: str = ""):
        return self.provider.search_sources(query)

    def get_source_content(self, source_id: str):
        return self.provider.get_source_content(source_id)


def test_provider_factory_defaults_to_mock_source_provider() -> None:
    provider = create_source_provider(
        Settings(
            ai_provider="mock",
            ai_model="gemini-2.5-flash",
            source_provider="mock",
            rss_feed_urls=(),
            gnews_api_key=None,
            gnews_lang="id",
            gnews_country="id",
            gnews_max_results=10,
            openai_api_key=None,
            gemini_api_key=None,
            openai_timeout_seconds=30,
            source_fetch_timeout_seconds=15,
        )
    )

    assert isinstance(provider, MockSourceProvider)


def test_provider_factory_requires_rss_feed_urls() -> None:
    with pytest.raises(SourceNotFoundError):
        create_source_provider(
            Settings(
                ai_provider="mock",
                ai_model="gemini-2.5-flash",
                source_provider="rss",
                rss_feed_urls=(),
                gnews_api_key=None,
                gnews_lang="id",
                gnews_country="id",
                gnews_max_results=10,
                openai_api_key=None,
                gemini_api_key=None,
                openai_timeout_seconds=30,
                source_fetch_timeout_seconds=15,
            )
        )


def test_provider_factory_creates_rss_provider() -> None:
    provider = create_source_provider(
        Settings(
            ai_provider="mock",
            ai_model="gemini-2.5-flash",
            source_provider="rss",
            rss_feed_urls=("https://feed.test/rss.xml",),
            gnews_api_key=None,
            gnews_lang="id",
            gnews_country="id",
            gnews_max_results=10,
            openai_api_key=None,
            gemini_api_key=None,
            openai_timeout_seconds=30,
            source_fetch_timeout_seconds=15,
        )
    )

    assert isinstance(provider, RSSSourceProvider)


def test_provider_factory_requires_gnews_api_key() -> None:
    with pytest.raises(SourceNotFoundError):
        create_source_provider(
            Settings(
                ai_provider="mock",
                ai_model="gemini-2.5-flash",
                source_provider="gnews",
                rss_feed_urls=(),
                gnews_api_key=None,
                gnews_lang="id",
                gnews_country="id",
                gnews_max_results=10,
                openai_api_key=None,
                gemini_api_key=None,
                openai_timeout_seconds=30,
                source_fetch_timeout_seconds=15,
            )
        )


def test_provider_factory_creates_gnews_provider() -> None:
    provider = create_source_provider(
        Settings(
            ai_provider="mock",
            ai_model="gemini-2.5-flash",
            source_provider="gnews",
            rss_feed_urls=(),
            gnews_api_key="test-key",
            gnews_lang="id",
            gnews_country="id",
            gnews_max_results=10,
            openai_api_key=None,
            gemini_api_key=None,
            openai_timeout_seconds=30,
            source_fetch_timeout_seconds=15,
        )
    )

    assert isinstance(provider, GNewsSourceProvider)


def test_parse_rss_feed_source_contents() -> None:
    source_contents = parse_feed_source_contents(RSS_FEED, "https://feed.test/rss.xml")

    assert len(source_contents) == 2
    assert source_contents[0].source.id == "news-test-policy-digital-id-consultation"
    assert source_contents[0].source.publisher == "Policy Feed"
    assert source_contents[0].source.title == "Digital ID review expands public consultation"
    assert "Komdigi opens another consultation phase" in source_contents[0].body


def test_parse_atom_feed_source_contents() -> None:
    source_contents = parse_feed_source_contents(ATOM_FEED, "https://official.test/feed.xml")

    assert len(source_contents) == 1
    assert source_contents[0].source.id == "tag-official-test-2026-pdp-guidance"
    assert source_contents[0].source.publisher == "Official Updates"
    assert source_contents[0].source.url == "https://official.test/pdp-guidance"


def test_rss_provider_filters_sources_by_query() -> None:
    provider = RSSSourceProvider(feed_urls=("https://feed.test/rss.xml",), fetch_feed=lambda _: RSS_FEED)

    results = provider.search_sources("komdigi safeguards")

    assert [source.id for source in results] == ["news-test-policy-digital-id-consultation"]


def test_rss_provider_wraps_invalid_xml() -> None:
    provider = RSSSourceProvider(
        feed_urls=("https://feed.test/broken.xml",),
        fetch_feed=lambda _: "<rss><channel>",
    )

    with pytest.raises(SourceFetchError, match="not valid XML"):
        provider.search_sources("digital")


def test_rss_provider_wraps_http_fetch_failures() -> None:
    import httpx

    request = httpx.Request("GET", "https://feed.test/missing.xml")
    response = httpx.Response(404, request=request)
    provider = RSSSourceProvider(
        feed_urls=("https://feed.test/missing.xml",),
        fetch_feed=lambda _: (_ for _ in ()).throw(httpx.HTTPStatusError("not found", request=request, response=response)),
    )

    with pytest.raises(SourceFetchError, match="RSS feed request failed"):
        provider.search_sources("digital")


def test_gnews_provider_maps_search_results_to_source_content() -> None:
    provider = GNewsSourceProvider(api_key="test-key", fetch_articles=lambda _: GNEWS_RESPONSE)

    results = provider.search_sources("komdigi")
    source_content = provider.get_source_content(results[0].id)

    assert len(results) == 1
    assert results[0].id == "news-test-komdigi-digital-identity"
    assert results[0].publisher == "Policy News"
    assert results[0].published_at == "2026-06-08T09:00:00Z"
    assert "digital identity safeguards" in source_content.body


def test_gnews_provider_requires_search_before_content_lookup() -> None:
    provider = GNewsSourceProvider(api_key="test-key", fetch_articles=lambda _: GNEWS_RESPONSE)

    with pytest.raises(SourceNotFoundError):
        provider.get_source_content("news-test-komdigi-digital-identity")


def test_search_sources_caches_rss_source_content(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOURCE_PROVIDER", "rss")
    monkeypatch.setenv("RSS_FEED_URLS", "https://feed.test/rss.xml")
    monkeypatch.setattr(factory, "RSSSourceProvider", lambda **_: FakeRSSProvider())

    results = search_sources("digital")

    assert [source.id for source in results] == ["news-test-policy-digital-id-consultation"]
    cached_content = get_cached_source_content("news-test-policy-digital-id-consultation")
    assert cached_content is not None
    assert "Komdigi opens another consultation phase" in cached_content.body


def test_get_source_content_uses_cached_search_result(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOURCE_PROVIDER", "rss")
    monkeypatch.setenv("RSS_FEED_URLS", "https://feed.test/rss.xml")
    monkeypatch.setattr(factory, "RSSSourceProvider", lambda **_: FakeRSSProvider())

    source_id = search_sources("digital")[0].id
    source_content = get_source_content(source_id)

    assert source_content.source.id == "news-test-policy-digital-id-consultation"
    assert "digital identity safeguards" in source_content.body


def test_search_sources_caches_gnews_source_content(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOURCE_PROVIDER", "gnews")
    monkeypatch.setenv("GNEWS_API_KEY", "test-key")
    monkeypatch.setattr(factory, "GNewsSourceProvider", lambda **_: GNewsSourceProvider(api_key="test-key", fetch_articles=lambda _: GNEWS_RESPONSE))

    results = search_sources("komdigi")

    assert [source.id for source in results] == ["news-test-komdigi-digital-identity"]
    cached_content = get_cached_source_content("news-test-komdigi-digital-identity")
    assert cached_content is not None
    assert "privacy advocates" in cached_content.body
