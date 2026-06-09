from typing import Any

from app.features.graph.models import GraphPatch

UNSUPPORTED_STRICT_SCHEMA_KEYS = {"title", "minItems"}


def graph_patch_response_format() -> dict[str, Any]:
    return {
        "type": "json_schema",
        "name": "graph_patch",
        "description": "A source-backed evidence graph patch extracted from one imported source.",
        "schema": _sanitize_strict_schema(GraphPatch.model_json_schema(by_alias=True)),
        "strict": True,
    }


def _sanitize_strict_schema(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}

        for key, item in value.items():
            if key == "properties" and isinstance(item, dict):
                sanitized[key] = {
                    property_name: _sanitize_strict_schema(property_schema)
                    for property_name, property_schema in item.items()
                }
                continue

            if key in UNSUPPORTED_STRICT_SCHEMA_KEYS:
                continue

            sanitized[key] = _sanitize_strict_schema(item)

        return sanitized

    if isinstance(value, list):
        return [_sanitize_strict_schema(item) for item in value]

    return value
