from app.features.graph.merge import merge_graph_patch
from app.features.graph.models import GraphPatch, GraphState
from app.features.graph.repository import graph_repository


def get_graph_state() -> GraphState:
    return graph_repository.get_state()


def import_graph_patch(patch: GraphPatch) -> GraphState:
    current = graph_repository.get_state()
    sources, nodes, edges = merge_graph_patch(current.sources, current.nodes, current.edges, patch)
    return graph_repository.save_state(sources=sources, nodes=nodes, edges=edges)


def reset_graph_state() -> None:
    graph_repository.reset()
