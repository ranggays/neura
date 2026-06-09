from pydantic import BaseModel

from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent


class ExtractionRequest(BaseModel):
    source_content: SourceContent


class ExtractionResult(BaseModel):
    graph_patch: GraphPatch
    provider_name: str
    prompt_version: str
