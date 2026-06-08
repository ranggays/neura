from app.features.graph.models import EvidenceEdge, EvidenceNode, GraphState, NewsSource


class InMemoryGraphRepository:
    def __init__(self) -> None:
        self.reset()

    def get_state(self) -> GraphState:
        return GraphState(
            sources=list(self._sources.values()),
            nodes=list(self._nodes.values()),
            edges=list(self._edges.values()),
        )

    def save_state(
        self,
        sources: list[NewsSource],
        nodes: list[EvidenceNode],
        edges: list[EvidenceEdge],
    ) -> GraphState:
        self._sources = {source.id: source for source in sources}
        self._nodes = {node.id: node for node in nodes}
        self._edges = {edge.id: edge for edge in edges}
        return self.get_state()

    def reset(self) -> None:
        self._sources: dict[str, NewsSource] = {}
        self._nodes: dict[str, EvidenceNode] = {}
        self._edges: dict[str, EvidenceEdge] = {}


graph_repository = InMemoryGraphRepository()
