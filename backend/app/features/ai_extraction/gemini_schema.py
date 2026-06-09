from typing import Any

from app.features.graph.models import GraphPatch

UNSUPPORTED_GEMINI_SCHEMA_KEYS = {"additionalProperties", "minItems", "title"}


def graph_patch_gemini_schema() -> dict[str, Any]:
    schema = GraphPatch.model_json_schema(by_alias=True)
    return _inline_refs(_sanitize_gemini_schema(schema), schema.get("$defs", {}))


def _sanitize_gemini_schema(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}

        for key, item in value.items():
            if key in UNSUPPORTED_GEMINI_SCHEMA_KEYS:
                continue

            if key == "properties" and isinstance(item, dict):
                sanitized[key] = {
                    property_name: _sanitize_gemini_schema(property_schema)
                    for property_name, property_schema in item.items()
                }
                continue

            sanitized[key] = _sanitize_gemini_schema(item)

        return sanitized

    if isinstance(value, list):
        return [_sanitize_gemini_schema(item) for item in value]

    return value


def _inline_refs(value: Any, defs: dict[str, Any]) -> Any:
    if isinstance(value, dict):
        ref = value.get("$ref")
        if isinstance(ref, str):
            ref_name = ref.removeprefix("#/$defs/")
            definition = defs.get(ref_name)
            if definition is not None:
                return _inline_refs(_sanitize_gemini_schema(definition), defs)

        return {
            key: _inline_refs(item, defs)
            for key, item in value.items()
            if key != "$defs"
        }

    if isinstance(value, list):
        return [_inline_refs(item, defs) for item in value]

    return value
