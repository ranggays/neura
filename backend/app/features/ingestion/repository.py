from app.features.ingestion.models import SourceContent

_SOURCE_CONTENT_BY_ID: dict[str, SourceContent] = {}


def save_source_contents(source_contents: list[SourceContent]) -> None:
    for source_content in source_contents:
        _SOURCE_CONTENT_BY_ID[source_content.source.id] = source_content.model_copy(deep=True)


def get_cached_source_content(source_id: str) -> SourceContent | None:
    source_content = _SOURCE_CONTENT_BY_ID.get(source_id)

    if source_content is None:
        return None

    return source_content.model_copy(deep=True)


def clear_source_content_cache() -> None:
    _SOURCE_CONTENT_BY_ID.clear()
