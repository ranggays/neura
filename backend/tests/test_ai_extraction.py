import pytest

from app.core.errors import AIResponseValidationError
from app.features.ai_extraction.normalizer import normalize_extracted_graph_patch
from app.features.ai_extraction.parser import validate_extracted_graph_patch
from app.features.ai_extraction.service import extract_graph_patch
from app.features.ai_extraction.prompt import SYSTEM_PROMPT
from app.features.graph.models import EvidenceEdge, EvidenceNode, EvidenceSnippet, GraphPatch, NewsSource
from app.features.ingestion.service import get_source_content
from app.features.search.mock_data import GRAPH_PATCHES


class FlakyExtractionProvider:
    provider_name = "flaky-test"
    prompt_version = "test"

    def __init__(self, failures_before_success: int) -> None:
        self.failures_before_success = failures_before_success
        self.calls = 0

    def extract_graph_patch(self, source_content):
        from app.core.errors import AIExtractionError

        self.calls += 1
        if self.calls <= self.failures_before_success:
            raise AIExtractionError("temporary overload")

        patch = GRAPH_PATCHES[source_content.source.id]
        return patch.model_copy(
            update={"source": patch.source.model_copy(update={"status": "imported"})},
            deep=True,
        )


def test_extract_graph_patch_returns_valid_source_backed_graph() -> None:
    source_content = get_source_content("digital-id-review")
    patch = extract_graph_patch(source_content)

    assert patch.source.id == "digital-id-review"
    assert patch.source.status == "imported"
    assert patch.nodes[0].id == "src-digital-id-review"
    assert patch.nodes[0].review_status == "approved"
    assert len(patch.nodes) == 5
    assert len(patch.edges) == 4
    assert all(edge.evidence for edge in patch.edges)


def test_extract_graph_patch_retries_temporary_ai_failures() -> None:
    source_content = get_source_content("digital-id-review")
    provider = FlakyExtractionProvider(failures_before_success=2)

    patch = extract_graph_patch(source_content, provider=provider)

    assert provider.calls == 3
    assert patch.source.id == "digital-id-review"
    assert patch.nodes[0].id == "src-digital-id-review"


def test_extraction_prompt_requires_indonesian_graph_output() -> None:
    assert "Bahasa Indonesia" in SYSTEM_PROMPT
    assert "do not translate evidence" in SYSTEM_PROMPT


def test_normalize_extracted_graph_patch_fixes_gemini_source_node_convention() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch(
        source=source_content.source,
        nodes=[
            EvidenceNode(
                id="digital-id-review",
                label="digital-id-review",
                type="Source",
                description="The digital identity draft rule has moved into inter-ministry review.",
                source_ids=["src-digital-id-review"],
                review_status="auto",
                x=100,
                y=100,
            ),
            EvidenceNode(
                id="digital-identity-draft-rule",
                label="Digital Identity Draft Rule",
                type="Policy",
                description="A draft rule related to digital identity.",
                source_ids=["src-digital-id-review", "digital-id-review"],
                review_status="review_needed",
                x=100,
                y=100,
            ),
            EvidenceNode(
                id="digital-identity-draft-rule",
                label="Digital Identity Draft Rule",
                type="Policy",
                description="Duplicate node that should be dropped.",
                source_ids=["digital-id-review"],
                review_status="review_needed",
                x=200,
                y=200,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="source-mentions-draft-rule",
                from_node_id="digital-id-review",
                to_node_id="digital-identity-draft-rule",
                label="mentions",
                source_ids=[],
                evidence=[
                    EvidenceSnippet(
                        source_id="gemini-invented-source-id",
                        text="The digital identity draft rule has moved into inter-ministry review.",
                        location="body",
                    )
                ],
                confidence="high",
                review_status="review_needed",
            ),
            EvidenceEdge(
                id="source-mentions-draft-rule",
                from_node_id="digital-id-review",
                to_node_id="digital-identity-draft-rule",
                label="mentions duplicate",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="The digital identity draft rule has moved into inter-ministry review.",
                        location="body",
                    )
                ],
                confidence="high",
                review_status="review_needed",
            ),
        ],
    )

    normalized = normalize_extracted_graph_patch(source_content, patch)

    assert normalized.source.status == "imported"
    assert [node.id for node in normalized.nodes] == ["src-digital-id-review", "digital-identity-draft-rule"]
    assert normalized.nodes[0].review_status == "approved"
    assert normalized.nodes[0].source_ids == ["digital-id-review"]
    assert normalized.nodes[1].source_ids == ["digital-id-review"]
    assert normalized.nodes[0].x == 0
    assert normalized.nodes[0].y == 0
    assert normalized.edges[0].from_node_id == "src-digital-id-review"
    assert normalized.edges[0].source_ids == ["digital-id-review"]
    assert normalized.edges[0].evidence[0].source_id == "digital-id-review"
    assert len(normalized.edges) == 1
    assert validate_extracted_graph_patch(source_content, normalized) == normalized


def test_normalize_extracted_graph_patch_canonicalizes_duplicate_entity_labels() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch(
        source=source_content.source,
        nodes=[
            EvidenceNode(
                id="digital-id-review",
                label="digital-id-review",
                type="Source",
                description="Imported source node.",
                source_ids=["digital-id-review"],
                review_status="auto",
                x=0,
                y=0,
            ),
            EvidenceNode(
                id="bank-indonesia-bi",
                label="Bank Indonesia (BI)",
                type="Institution",
                description="Bank sentral Indonesia.",
                source_ids=["digital-id-review"],
                review_status="review_needed",
                x=20,
                y=20,
            ),
            EvidenceNode(
                id="bank-indonesia",
                label="Bank Indonesia",
                type="Institution",
                description="Bank sentral Indonesia.",
                source_ids=["digital-id-review"],
                review_status="review_needed",
                x=40,
                y=40,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="edge-bi",
                from_node_id="bank-indonesia-bi",
                to_node_id="bank-indonesia",
                label="sama dengan",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="Bank Indonesia (BI) disebut dalam artikel.",
                        location="body",
                    )
                ],
                confidence="high",
                review_status="review_needed",
            )
        ],
    )

    normalized = normalize_extracted_graph_patch(source_content, patch)

    bank_nodes = [node for node in normalized.nodes if node.id == "bank-indonesia"]
    assert len(bank_nodes) == 1
    assert bank_nodes[0].label == "Bank Indonesia"
    assert normalized.edges[0].from_node_id == "bank-indonesia"
    assert normalized.edges[0].to_node_id == "bank-indonesia"


def test_validate_extracted_graph_patch_rejects_wrong_source() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch.model_construct(
        source=NewsSource(
            id="wrong-source",
            title="Wrong source",
            publisher="Example",
            published_at="2026-01-01",
            url="https://example.test/wrong",
            type="news",
            snippet="Wrong source.",
            status="imported",
        ),
        nodes=[
            EvidenceNode(
                id="src-wrong-source",
                label="Wrong source",
                type="Source",
                description="Wrong source node.",
                source_ids=["wrong-source"],
                review_status="approved",
                x=50,
                y=50,
            )
        ],
        edges=[],
    )

    with pytest.raises(AIResponseValidationError):
        validate_extracted_graph_patch(source_content, patch)


def test_validate_extracted_graph_patch_rejects_edge_without_imported_source() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch.model_construct(
        source=source_content.source.model_copy(update={"status": "imported"}),
        nodes=[
            EvidenceNode(
                id="src-digital-id-review",
                label="Digital ID review article",
                type="Source",
                description="Imported source node.",
                source_ids=["digital-id-review"],
                review_status="approved",
                x=16,
                y=44,
            ),
            EvidenceNode(
                id="policy-node",
                label="Policy node",
                type="Policy",
                description="Policy node.",
                source_ids=["digital-id-review"],
                review_status="auto",
                x=50,
                y=50,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="bad-edge",
                from_node_id="src-digital-id-review",
                to_node_id="policy-node",
                label="MENTIONS",
                source_ids=["other-source"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="The source mentions the policy.",
                        location="paragraph 1",
                    )
                ],
                confidence="medium",
                review_status="review_needed",
            )
        ],
    )

    with pytest.raises(AIResponseValidationError):
        validate_extracted_graph_patch(source_content, patch)


def test_validate_extracted_graph_patch_rejects_node_without_imported_source() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch(
        source=source_content.source.model_copy(update={"status": "imported"}),
        nodes=[
            EvidenceNode(
                id="src-digital-id-review",
                label="Digital ID review article",
                type="Source",
                description="Imported source node.",
                source_ids=["digital-id-review"],
                review_status="approved",
                x=0,
                y=0,
            ),
            EvidenceNode(
                id="policy-node",
                label="Policy node",
                type="Policy",
                description="Policy node.",
                source_ids=["other-source"],
                review_status="review_needed",
                x=50,
                y=50,
            ),
        ],
        edges=[],
    )

    with pytest.raises(AIResponseValidationError):
        validate_extracted_graph_patch(source_content, patch)


def test_validate_extracted_graph_patch_rejects_evidence_from_other_source() -> None:
    source_content = get_source_content("digital-id-review")
    patch = GraphPatch(
        source=source_content.source.model_copy(update={"status": "imported"}),
        nodes=[
            EvidenceNode(
                id="src-digital-id-review",
                label="Digital ID review article",
                type="Source",
                description="Imported source node.",
                source_ids=["digital-id-review"],
                review_status="approved",
                x=0,
                y=0,
            ),
            EvidenceNode(
                id="policy-node",
                label="Policy node",
                type="Policy",
                description="Policy node.",
                source_ids=["digital-id-review"],
                review_status="review_needed",
                x=50,
                y=50,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="bad-evidence-source",
                from_node_id="src-digital-id-review",
                to_node_id="policy-node",
                label="mentions",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="other-source",
                        text="The source mentions the policy.",
                        location="body",
                    )
                ],
                confidence="medium",
                review_status="review_needed",
            )
        ],
    )

    with pytest.raises(AIResponseValidationError):
        validate_extracted_graph_patch(source_content, patch)
