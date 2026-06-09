from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

NodeType = Literal["Source", "Policy", "Institution", "Person", "Topic", "Event"]
Confidence = Literal["low", "medium", "high"]
ReviewStatus = Literal["auto", "review_needed", "approved", "rejected"]
SourceStatus = Literal["available", "processing", "imported"]
SourceType = Literal["news", "official", "document"]


def to_camel(value: str) -> str:
    words = value.split("_")
    return words[0] + "".join(word.capitalize() for word in words[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class NewsSource(ApiModel):
    id: str
    title: str
    publisher: str
    published_at: str
    url: str
    type: SourceType
    snippet: str
    status: SourceStatus


class EvidenceSnippet(ApiModel):
    source_id: str
    text: str
    location: str


class EvidenceNode(ApiModel):
    id: str
    label: str
    type: NodeType
    description: str
    source_ids: list[str]
    review_status: ReviewStatus
    x: float
    y: float


class EvidenceEdge(ApiModel):
    id: str
    from_node_id: str
    to_node_id: str
    label: str
    source_ids: list[str]
    evidence: list[EvidenceSnippet]
    confidence: Confidence
    review_status: ReviewStatus

    @model_validator(mode="after")
    def require_evidence(self) -> "EvidenceEdge":
        if not self.evidence:
            raise ValueError("Evidence edges must include at least one evidence snippet.")
        return self


class GraphPatch(ApiModel):
    source: NewsSource
    nodes: list[EvidenceNode] = Field(min_length=1)
    edges: list[EvidenceEdge]

    @model_validator(mode="after")
    def require_edge_nodes(self) -> "GraphPatch":
        node_ids = {node.id for node in self.nodes}
        invalid_edges = [
            edge.id
            for edge in self.edges
            if edge.from_node_id not in node_ids or edge.to_node_id not in node_ids
        ]

        if invalid_edges:
            raise ValueError(f"Graph patch contains edges with missing nodes: {', '.join(invalid_edges)}")

        return self


class GraphState(ApiModel):
    sources: list[NewsSource]
    nodes: list[EvidenceNode]
    edges: list[EvidenceEdge]
