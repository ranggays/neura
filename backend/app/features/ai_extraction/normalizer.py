import re

from app.core.errors import AIResponseValidationError
from app.features.graph.models import EvidenceEdge, EvidenceNode, EvidenceSnippet, GraphPatch
from app.features.ingestion.models import SourceContent


def normalize_extracted_graph_patch(source_content: SourceContent, patch: GraphPatch) -> GraphPatch:
    source_id = source_content.source.id
    source_nodes = [node for node in patch.nodes if node.type == "Source"]

    if len(source_nodes) != 1:
        raise AIResponseValidationError("Extracted graph patch must include exactly one source node.")

    original_source_node_id = source_nodes[0].id
    normalized_source_node_id = f"src-{source_id}"
    node_id_map = _build_node_id_map(patch.nodes, source_id, original_source_node_id, normalized_source_node_id)

    normalized_nodes = _dedupe_nodes(
        [
            _normalize_node(
                node=node,
                source_id=source_id,
                normalized_source_node_id=normalized_source_node_id,
                node_id_map=node_id_map,
            )
            for node in patch.nodes
        ]
    )
    normalized_edges = _dedupe_edges(
        [
            _normalize_edge(
                edge=edge,
                source_id=source_id,
                node_id_map=node_id_map,
            )
            for edge in patch.edges
        ]
    )

    return GraphPatch(
        source=source_content.source.model_copy(update={"status": "imported"}),
        nodes=normalized_nodes,
        edges=normalized_edges,
    )


def _normalize_node(
    node: EvidenceNode,
    source_id: str,
    normalized_source_node_id: str,
    node_id_map: dict[str, str],
) -> EvidenceNode:
    if node.type == "Source":
        return node.model_copy(
            update={
                "id": normalized_source_node_id,
                "source_ids": _with_source_id(node.source_ids, source_id),
                "review_status": "approved",
                "x": 0,
                "y": 0,
            }
        )

    canonical_label = _canonical_label(node.label)
    return node.model_copy(
        update={
            "id": node_id_map.get(node.id, node.id),
            "label": canonical_label,
            "source_ids": _with_source_id(node.source_ids, source_id),
        }
    )


def _normalize_edge(
    edge: EvidenceEdge,
    source_id: str,
    node_id_map: dict[str, str],
) -> EvidenceEdge:
    return edge.model_copy(
        update={
            "from_node_id": node_id_map.get(edge.from_node_id, edge.from_node_id),
            "to_node_id": node_id_map.get(edge.to_node_id, edge.to_node_id),
            "source_ids": _with_source_id(edge.source_ids, source_id),
            "evidence": [_normalize_evidence(evidence, source_id) for evidence in edge.evidence],
        },
        deep=True,
    )


def _dedupe_nodes(nodes: list[EvidenceNode]) -> list[EvidenceNode]:
    deduped: dict[str, EvidenceNode] = {}

    for node in nodes:
        deduped.setdefault(node.id, node)

    return list(deduped.values())


def _dedupe_edges(edges: list[EvidenceEdge]) -> list[EvidenceEdge]:
    deduped: dict[str, EvidenceEdge] = {}

    for edge in edges:
        deduped.setdefault(edge.id, edge)

    return list(deduped.values())


def _with_source_id(source_ids: list[str], source_id: str) -> list[str]:
    source_node_id = f"src-{source_id}"
    normalized_source_ids = [
        current_source_id
        for current_source_id in source_ids
        if current_source_id not in {source_id, source_node_id}
    ]
    return [source_id, *normalized_source_ids]


def _normalize_evidence(evidence: EvidenceSnippet, source_id: str) -> EvidenceSnippet:
    return evidence.model_copy(update={"source_id": source_id})


def _build_node_id_map(
    nodes: list[EvidenceNode],
    source_id: str,
    original_source_node_id: str,
    normalized_source_node_id: str,
) -> dict[str, str]:
    node_id_map = {original_source_node_id: normalized_source_node_id}

    for node in nodes:
        if node.type == "Source":
            continue

        node_id_map[node.id] = _canonical_node_id(node.label, source_id)

    return node_id_map


def _canonical_label(label: str) -> str:
    without_parenthetical = re.sub(r"\s*\([^)]{1,24}\)\s*", " ", label)
    return re.sub(r"\s+", " ", without_parenthetical).strip() or label


def _canonical_node_id(label: str, source_id: str) -> str:
    canonical_label = _canonical_label(label)
    normalized = canonical_label.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    normalized = normalized.strip("-")
    return normalized or f"node-{source_id}"
