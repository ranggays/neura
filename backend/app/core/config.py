import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

AIProviderName = Literal["mock", "openai", "gemini"]
SourceProviderName = Literal["mock", "rss", "gnews"]

BACKEND_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(BACKEND_ENV_PATH)


@dataclass(frozen=True)
class Settings:
    ai_provider: str
    ai_model: str
    source_provider: str
    rss_feed_urls: tuple[str, ...]
    gnews_api_key: str | None
    gnews_lang: str
    gnews_country: str | None
    gnews_max_results: int
    openai_api_key: str | None
    gemini_api_key: str | None
    openai_timeout_seconds: float
    source_fetch_timeout_seconds: float


@lru_cache
def get_settings() -> Settings:
    return Settings(
        ai_provider=os.getenv("AI_PROVIDER", "mock").strip().lower(),
        ai_model=os.getenv("AI_MODEL", "gemini-2.5-flash").strip(),
        source_provider=os.getenv("SOURCE_PROVIDER", "mock").strip().lower(),
        rss_feed_urls=_parse_csv_env(os.getenv("RSS_FEED_URLS", "")),
        gnews_api_key=os.getenv("GNEWS_API_KEY") or None,
        gnews_lang=os.getenv("GNEWS_LANG", "id").strip().lower(),
        gnews_country=os.getenv("GNEWS_COUNTRY") or None,
        gnews_max_results=int(os.getenv("GNEWS_MAX_RESULTS", "10")),
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        openai_timeout_seconds=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30")),
        source_fetch_timeout_seconds=float(os.getenv("SOURCE_FETCH_TIMEOUT_SECONDS", "15")),
    )


def _parse_csv_env(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())
