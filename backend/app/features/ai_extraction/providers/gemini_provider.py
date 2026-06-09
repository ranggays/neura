import json
from json import JSONDecodeError
from typing import Any

from pydantic import ValidationError

from app.core.errors import AIExtractionError, AIResponseValidationError
from app.features.ai_extraction.gemini_schema import graph_patch_gemini_schema
from app.features.ai_extraction.prompt import PROMPT_VERSION, SYSTEM_PROMPT, build_extraction_input
from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent


class GeminiGraphExtractionProvider:
    provider_name = "gemini"
    prompt_version = PROMPT_VERSION

    def __init__(
        self,
        model: str,
        api_key: str,
        client: Any | None = None,
    ) -> None:
        self.model = model
        self._client = client or self._create_client(api_key=api_key)

    def extract_graph_patch(self, source_content: SourceContent) -> GraphPatch:
        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=build_extraction_input(source_content),
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "response_json_schema": graph_patch_gemini_schema(),
                },
            )
        except Exception as exc:
            raise AIExtractionError(f"Gemini extraction request failed: {_format_provider_error(exc)}") from exc

        output_text = getattr(response, "text", None)
        if not output_text:
            raise AIExtractionError("Gemini extraction response did not include text.")

        try:
            payload = json.loads(output_text)
        except JSONDecodeError as exc:
            raise AIResponseValidationError("Gemini extraction response was not valid JSON.") from exc

        try:
            return GraphPatch.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseValidationError("Gemini extraction response did not match GraphPatch.") from exc

    def _create_client(self, api_key: str) -> Any:
        try:
            from google import genai
        except ImportError as exc:
            raise AIExtractionError("Google GenAI SDK is not installed. Run pip install -e '.[dev]' in backend/.") from exc

        return genai.Client(api_key=api_key)


def _format_provider_error(exc: Exception) -> str:
    status_code = getattr(exc, "status_code", None)
    response = getattr(exc, "response", None)
    response_text = getattr(response, "text", None)
    details = response_text or str(exc)
    prefix = exc.__class__.__name__

    if status_code is not None:
        prefix = f"{prefix} {status_code}"

    return f"{prefix}: {details}"
