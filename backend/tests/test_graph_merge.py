import pytest

from app.core.errors import GraphMergeError
from app.features.ai_extraction.service import extract_graph_patch
from app.features.graph.merge import merge_graph_patch
from app.features.graph.models import EvidenceEdge, EvidenceNode, EvidenceSnippet, GraphPatch, NewsSource
from app.features.ingestion.service import get_source_content


def test_merge_graph_patch_does_not_duplicate_existing_nodes() -> None:
    patch = extract_graph_patch(get_source_content("digital-id-review"))
    sources, nodes, edges = merge_graph_patch([], [], [], patch)
    sources, nodes, edges = merge_graph_patch(sources, nodes, edges, patch)

    assert len(sources) == 1
    assert len(nodes) == 5
    assert len(edges) == 4


def test_merge_graph_patch_rejects_edges_with_missing_nodes() -> None:
    source = NewsSource(
        id="bad-source",
        title="Bad source",
        publisher="Example",
        published_at="2026-01-01",
        url="https://example.test/bad",
        type="news",
        snippet="A malformed source.",
        status="imported",
    )
    node = EvidenceNode(
        id="existing-node",
        label="Existing node",
        type="Topic",
        description="A valid node.",
        source_ids=["bad-source"],
        review_status="auto",
        x=50,
        y=50,
    )
    edge = EvidenceEdge(
        id="bad-edge",
        from_node_id="existing-node",
        to_node_id="missing-node",
        label="MENTIONS",
        source_ids=["bad-source"],
        evidence=[
            EvidenceSnippet(
                source_id="bad-source",
                text="The source mentions something.",
                location="paragraph 1",
            )
        ],
        confidence="low",
        review_status="review_needed",
    )
    patch = GraphPatch.model_construct(source=source, nodes=[node], edges=[edge])

    with pytest.raises(GraphMergeError):
        merge_graph_patch([], [], [], patch)
