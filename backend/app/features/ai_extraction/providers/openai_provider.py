import json
from json import JSONDecodeError
from typing import Any

from pydantic import ValidationError

from app.core.errors import AIExtractionError, AIResponseValidationError
from app.features.ai_extraction.prompt import PROMPT_VERSION, SYSTEM_PROMPT, build_extraction_input
from app.features.ai_extraction.response_format import graph_patch_response_format
from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent


class OpenAIGraphExtractionProvider:
    provider_name = "openai"
    prompt_version = PROMPT_VERSION

    def __init__(
        self,
        model: str,
        api_key: str,
        timeout_seconds: float = 30,
        client: Any | None = None,
    ) -> None:
        self.model = model
        self._client = client or self._create_client(api_key=api_key, timeout_seconds=timeout_seconds)

    def extract_graph_patch(self, source_content: SourceContent) -> GraphPatch:
        try:
            response = self._client.responses.create(
                model=self.model,
                input=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_extraction_input(source_content)},
                ],
                text={"format": graph_patch_response_format()},
            )
        except Exception as exc:
            raise AIExtractionError(f"OpenAI extraction request failed: {_format_provider_error(exc)}") from exc

        output_text = getattr(response, "output_text", None)
        if not output_text:
            raise AIExtractionError("OpenAI extraction response did not include output_text.")

        try:
            payload = json.loads(output_text)
        except JSONDecodeError as exc:
            raise AIResponseValidationError("OpenAI extraction response was not valid JSON.") from exc

        try:
            return GraphPatch.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseValidationError("OpenAI extraction response did not match GraphPatch.") from exc

    def _create_client(self, api_key: str, timeout_seconds: float) -> Any:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise AIExtractionError("OpenAI SDK is not installed. Run pip install -e '.[dev]' in backend/.") from exc

        return OpenAI(api_key=api_key, timeout=timeout_seconds)


def _format_provider_error(exc: Exception) -> str:
    status_code = getattr(exc, "status_code", None)
    error_body = getattr(exc, "body", None)
    response = getattr(exc, "response", None)
    response_text = getattr(response, "text", None)

    details = response_text or error_body or str(exc)
    prefix = exc.__class__.__name__

    if status_code is not None:
        prefix = f"{prefix} {status_code}"

    return f"{prefix}: {details}"
