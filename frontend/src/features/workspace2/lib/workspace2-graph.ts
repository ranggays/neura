import type { EvidenceEdge, EvidenceNode, GraphPatch, NewsSource } from "../types";

export function searchAvailableSources(sources: NewsSource[], query: string) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return sources;
  }

  return sources.filter((source) => {
    const haystack = [source.title, source.publisher, source.type, source.snippet].join(" ").toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

export function mergeGraphPatch(
  currentNodes: EvidenceNode[],
  currentEdges: EvidenceEdge[],
  patch: GraphPatch,
) {
  return {
    nodes: mergeNodes(currentNodes, patch.nodes),
    edges: mergeById(currentEdges, patch.edges),
  };
}

export function mergeSources(currentSources: NewsSource[], source: NewsSource) {
  if (currentSources.some((item) => item.id === source.id)) {
    return currentSources;
  }

  return [{ ...source, status: "imported" as const }, ...currentSources];
}

function mergeNodes(currentNodes: EvidenceNode[], incomingNodes: EvidenceNode[]) {
  const byId = new Map(currentNodes.map((node) => [node.id, node]));

  incomingNodes.forEach((node) => {
    const existing = byId.get(node.id);

    if (!existing) {
      byId.set(node.id, node);
      return;
    }

    byId.set(node.id, {
      ...existing,
      sourceIds: Array.from(new Set([...existing.sourceIds, ...node.sourceIds])),
      reviewStatus: existing.reviewStatus === "review_needed" ? existing.reviewStatus : node.reviewStatus,
    });
  });

  return Array.from(byId.values());
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const byId = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });

  return Array.from(byId.values());
}
