import re
import xml.etree.ElementTree as ET
from html import unescape
from typing import Callable

import httpx

from app.core.errors import SourceFetchError, SourceNotFoundError
from app.features.graph.models import NewsSource
from app.features.ingestion.models import SourceContent

FetchFeed = Callable[[str], str]


class RSSSourceProvider:
    provider_name = "rss"

    def __init__(
        self,
        feed_urls: tuple[str, ...],
        timeout_seconds: float = 15,
        fetch_feed: FetchFeed | None = None,
    ) -> None:
        self.feed_urls = feed_urls
        self.timeout_seconds = timeout_seconds
        self._fetch_feed = fetch_feed or self._fetch_feed_from_url

    def search_sources(self, query: str = "") -> list[NewsSource]:
        source_contents = self._load_source_contents()
        terms = [term for term in query.strip().lower().split() if term]

        if not terms:
            return [source_content.source for source_content in source_contents]

        return [
            source_content.source
            for source_content in source_contents
            if any(term in _build_source_haystack(source_content) for term in terms)
        ]

    def get_source_content(self, source_id: str) -> SourceContent:
        for source_content in self._load_source_contents():
            if source_content.source.id == source_id:
                return source_content.model_copy(deep=True)

        raise SourceNotFoundError(f"Source not found: {source_id}")

    def _load_source_contents(self) -> list[SourceContent]:
        source_contents: list[SourceContent] = []

        for feed_url in self.feed_urls:
            try:
                feed_xml = self._fetch_feed(feed_url)
                source_contents.extend(parse_feed_source_contents(feed_xml, feed_url))
            except ET.ParseError as exc:
                raise SourceFetchError(f"RSS feed is not valid XML: {feed_url}") from exc
            except httpx.HTTPError as exc:
                raise SourceFetchError(f"RSS feed request failed for {feed_url}: {exc}") from exc

        return source_contents

    def _fetch_feed_from_url(self, feed_url: str) -> str:
        response = httpx.get(feed_url, timeout=self.timeout_seconds, follow_redirects=True)
        response.raise_for_status()
        return response.text


def parse_feed_source_contents(feed_xml: str, feed_url: str) -> list[SourceContent]:
    root = ET.fromstring(feed_xml)

    if _local_name(root.tag) == "rss":
        channel = root.find("channel")
        if channel is None:
            return []
        publisher = _child_text(channel, "title") or _publisher_from_url(feed_url)
        return [_rss_item_to_source_content(item, publisher) for item in channel.findall("item")]

    if _local_name(root.tag) == "feed":
        publisher = _child_text(root, "title") or _publisher_from_url(feed_url)
        return [_atom_entry_to_source_content(entry, publisher) for entry in _children(root, "entry")]

    return []


def _rss_item_to_source_content(item: ET.Element, publisher: str) -> SourceContent:
    title = _child_text(item, "title") or "Untitled source"
    link = _child_text(item, "link") or f"https://example.test/rss/{_slugify(title)}"
    summary = _clean_text(_child_text(item, "description") or "")
    body = _clean_text(_child_text(item, "encoded") or summary or title)
    source_id = _slugify(link or title)

    return SourceContent(
        source=NewsSource(
            id=source_id,
            title=title,
            publisher=publisher,
            published_at=_child_text(item, "pubDate") or "",
            url=link,
            type="news",
            snippet=summary or body[:220] or title,
            status="available",
        ),
        body=body,
    )


def _atom_entry_to_source_content(entry: ET.Element, publisher: str) -> SourceContent:
    title = _child_text(entry, "title") or "Untitled source"
    link = _atom_link(entry) or f"https://example.test/atom/{_slugify(title)}"
    summary = _clean_text(_child_text(entry, "summary") or "")
    body = _clean_text(_child_text(entry, "content") or summary or title)
    source_id = _slugify(_child_text(entry, "id") or link or title)

    return SourceContent(
        source=NewsSource(
            id=source_id,
            title=title,
            publisher=publisher,
            published_at=_child_text(entry, "updated") or _child_text(entry, "published") or "",
            url=link,
            type="news",
            snippet=summary or body[:220] or title,
            status="available",
        ),
        body=body,
    )


def _atom_link(entry: ET.Element) -> str:
    for child in entry:
        if _local_name(child.tag) == "link":
            href = child.attrib.get("href")
            if href:
                return href

    return ""


def _child_text(parent: ET.Element, child_name: str) -> str:
    for child in parent:
        if _local_name(child.tag) == child_name:
            return _clean_text("".join(child.itertext()))

    return ""


def _children(parent: ET.Element, child_name: str) -> list[ET.Element]:
    return [child for child in parent if _local_name(child.tag) == child_name]


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _clean_text(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", unescape(value))
    return re.sub(r"\s+", " ", without_tags).strip()


def _slugify(value: str) -> str:
    normalized = re.sub(r"^https?://", "", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")[:96] or "source"


def _publisher_from_url(feed_url: str) -> str:
    return re.sub(r"^https?://", "", feed_url).split("/", 1)[0] or "RSS feed"


def _build_source_haystack(source_content: SourceContent) -> str:
    source = source_content.source
    return " ".join([source.title, source.publisher, source.type, source.snippet, source_content.body]).lower()
