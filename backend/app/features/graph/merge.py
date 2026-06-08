from app.core.errors import GraphMergeError
from app.features.graph.models import EvidenceEdge, EvidenceNode, GraphPatch, NewsSource


def merge_graph_patch(
    current_sources: list[NewsSource],
    current_nodes: list[EvidenceNode],
    current_edges: list[EvidenceEdge],
    patch: GraphPatch,
) -> tuple[list[NewsSource], list[EvidenceNode], list[EvidenceEdge]]:
    merged_nodes = merge_nodes(current_nodes, patch.nodes)
    merged_edges = merge_edges(current_edges, patch.edges, merged_nodes)
    merged_sources = merge_sources(current_sources, patch.source)

    return merged_sources, merged_nodes, merged_edges


def merge_sources(current_sources: list[NewsSource], incoming_source: NewsSource) -> list[NewsSource]:
    by_id = {source.id: source for source in current_sources}
    by_id[incoming_source.id] = incoming_source
    return list(by_id.values())


def merge_nodes(current_nodes: list[EvidenceNode], incoming_nodes: list[EvidenceNode]) -> list[EvidenceNode]:
    by_id = {node.id: node for node in current_nodes}

    for node in incoming_nodes:
        existing = by_id.get(node.id)

        if existing is None:
            by_id[node.id] = node
            continue

        by_id[node.id] = existing.model_copy(
            update={
                "source_ids": merge_unique(existing.source_ids, node.source_ids),
                "review_status": merge_review_status(existing.review_status, node.review_status),
            }
        )

    return list(by_id.values())


def merge_edges(
    current_edges: list[EvidenceEdge],
    incoming_edges: list[EvidenceEdge],
    merged_nodes: list[EvidenceNode],
) -> list[EvidenceEdge]:
    node_ids = {node.id for node in merged_nodes}
    by_id = {edge.id: edge for edge in current_edges}

    for edge in incoming_edges:
        if edge.from_node_id not in node_ids or edge.to_node_id not in node_ids:
            raise GraphMergeError(f"Edge references missing node: {edge.id}")

        if edge.id not in by_id:
            by_id[edge.id] = edge

    return list(by_id.values())


def merge_unique(existing: list[str], incoming: list[str]) -> list[str]:
    return list(dict.fromkeys([*existing, *incoming]))


def merge_review_status(existing: str, incoming: str) -> str:
    if existing == "review_needed" or incoming == "review_needed":
        return "review_needed"

    return existing
