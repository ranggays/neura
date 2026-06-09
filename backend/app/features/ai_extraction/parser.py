from app.core.errors import AIResponseValidationError
from app.features.graph.models import GraphPatch
from app.features.ingestion.models import SourceContent


def validate_extracted_graph_patch(source_content: SourceContent, patch: GraphPatch) -> GraphPatch:
    if patch.source.id != source_content.source.id:
        raise AIResponseValidationError("Extracted graph patch source does not match imported source.")

    if patch.source.status != "imported":
        raise AIResponseValidationError("Extracted graph patch source must be imported.")

    source_node_count = sum(1 for node in patch.nodes if node.type == "Source")
    if source_node_count != 1:
        raise AIResponseValidationError("Extracted graph patch must include exactly one source node.")

    node_ids = {node.id for node in patch.nodes}
    for node in patch.nodes:
        if source_content.source.id not in node.source_ids:
            raise AIResponseValidationError(f"Extracted node is not linked to the imported source: {node.id}")

        if node.type == "Source" and node.id != f"src-{source_content.source.id}":
            raise AIResponseValidationError("Extracted source node ID does not match the normalized source ID.")

    for edge in patch.edges:
        if not edge.evidence:
            raise AIResponseValidationError(f"Extracted edge has no evidence: {edge.id}")

        if source_content.source.id not in edge.source_ids:
            raise AIResponseValidationError(f"Extracted edge is not linked to the imported source: {edge.id}")

        if edge.from_node_id not in node_ids or edge.to_node_id not in node_ids:
            raise AIResponseValidationError(f"Extracted edge references a missing node: {edge.id}")

        for evidence in edge.evidence:
            if evidence.source_id != source_content.source.id:
                raise AIResponseValidationError(
                    f"Extracted edge evidence is not from the imported source: {edge.id}"
                )

    return patch
