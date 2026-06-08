import type { Edge, Node, Options } from "vis-network/standalone";
import type { EvidenceEdge, EvidenceNode, NodeType, Selection } from "../types";

const graphWidth = 1000;
const graphHeight = 700;

const nodeTypeOptions: Record<NodeType, Pick<Node, "shape" | "color" | "font" | "borderWidth" | "margin" | "widthConstraint">> = {
  Source: {
    shape: "box",
    borderWidth: 1,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    widthConstraint: { maximum: 190 },
    color: {
      background: "#f8fafc",
      border: "#64748b",
      highlight: { background: "#f1f5f9", border: "#334155" },
      hover: { background: "#f1f5f9", border: "#334155" },
    },
    font: { color: "#334155", size: 13, face: "Inter, Arial, sans-serif", multi: true },
  },
  Policy: {
    shape: "ellipse",
    borderWidth: 2,
    widthConstraint: { maximum: 190 },
    color: {
      background: "#e0f2fe",
      border: "#0369a1",
      highlight: { background: "#bae6fd", border: "#075985" },
      hover: { background: "#bae6fd", border: "#075985" },
    },
    font: { color: "#0f172a", size: 14, face: "Inter, Arial, sans-serif", multi: true },
  },
  Institution: {
    shape: "box",
    borderWidth: 2,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    widthConstraint: { maximum: 180 },
    color: {
      background: "#dcfce7",
      border: "#047857",
      highlight: { background: "#bbf7d0", border: "#065f46" },
      hover: { background: "#bbf7d0", border: "#065f46" },
    },
    font: { color: "#064e3b", size: 13, face: "Inter, Arial, sans-serif", multi: true },
  },
  Person: {
    shape: "dot",
    borderWidth: 2,
    color: {
      background: "#ede9fe",
      border: "#6d28d9",
      highlight: { background: "#ddd6fe", border: "#5b21b6" },
      hover: { background: "#ddd6fe", border: "#5b21b6" },
    },
    font: { color: "#312e81", size: 13, face: "Inter, Arial, sans-serif" },
  },
  Topic: {
    shape: "diamond",
    borderWidth: 2,
    color: {
      background: "#fef3c7",
      border: "#d97706",
      highlight: { background: "#fde68a", border: "#b45309" },
      hover: { background: "#fde68a", border: "#b45309" },
    },
    font: { color: "#78350f", size: 13, face: "Inter, Arial, sans-serif" },
  },
  Event: {
    shape: "triangle",
    borderWidth: 2,
    color: {
      background: "#ffedd5",
      border: "#c2410c",
      highlight: { background: "#fed7aa", border: "#9a3412" },
      hover: { background: "#fed7aa", border: "#9a3412" },
    },
    font: { color: "#7c2d12", size: 13, face: "Inter, Arial, sans-serif" },
  },
};

const baseVisOptions: Options = {
  autoResize: true,
  nodes: {
    shapeProperties: {
      borderRadius: 8,
    },
    shadow: {
      enabled: true,
      color: "rgba(15, 23, 42, 0.12)",
      size: 8,
      x: 0,
      y: 3,
    },
  },
  edges: {
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.72,
      },
    },
    color: {
      color: "#94a3b8",
      highlight: "#0369a1",
      hover: "#0284c7",
    },
    font: {
      color: "#475569",
      size: 10,
      face: "Inter, Arial, sans-serif",
      background: "rgba(255, 255, 255, 0.86)",
      strokeWidth: 0,
    },
    smooth: {
      enabled: true,
      type: "continuous",
      roundness: 0.28,
    },
    selectionWidth: 2,
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    hover: true,
    navigationButtons: false,
    keyboard: false,
    tooltipDelay: 120,
  },
  physics: {
    enabled: false,
    stabilization: false,
  },
};

export function buildVisGraphData(nodes: EvidenceNode[], edges: EvidenceEdge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));

  return {
    nodes: nodes.map(mapEvidenceNodeToVisNode),
    edges: edges.filter((edge) => nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId)).map(mapEvidenceEdgeToVisEdge),
  };
}

export function getVisNetworkOptions(): Options {
  return baseVisOptions;
}

export function getSelectedVisItem(selection: Selection | undefined) {
  if (selection?.kind === "node") {
    return { nodes: [selection.id], edges: [] };
  }

  if (selection?.kind === "edge") {
    return { nodes: [], edges: [selection.id] };
  }

  return { nodes: [], edges: [] };
}

function mapEvidenceNodeToVisNode(node: EvidenceNode): Node {
  return {
    id: node.id,
    label: node.label,
    group: node.type,
    title: node.description,
    value: Math.max(node.sourceIds.length, 1),
    x: toCanvasCoordinate(node.x, graphWidth),
    y: toCanvasCoordinate(node.y, graphHeight),
    ...nodeTypeOptions[node.type],
  };
}

function mapEvidenceEdgeToVisEdge(edge: EvidenceEdge): Edge {
  const reviewNeedsAttention = edge.reviewStatus === "review_needed";

  return {
    id: edge.id,
    from: edge.fromNodeId,
    to: edge.toNodeId,
    label: edge.label,
    title: buildEvidenceTitle(edge),
    arrows: "to",
    dashes: reviewNeedsAttention,
    width: getEdgeWidth(edge),
    color: {
      color: reviewNeedsAttention ? "#f59e0b" : "#94a3b8",
      highlight: "#0369a1",
      hover: "#0284c7",
    },
  };
}

function buildEvidenceTitle(edge: EvidenceEdge) {
  const evidenceText = edge.evidence.map((snippet) => `${snippet.location}: ${snippet.text}`).join("\n");

  return evidenceText.length > 0 ? evidenceText : `${edge.label} / ${edge.confidence} confidence`;
}

function getEdgeWidth(edge: EvidenceEdge) {
  if (edge.confidence === "high") {
    return 3;
  }

  if (edge.confidence === "medium") {
    return 2;
  }

  return 1;
}

function toCanvasCoordinate(percent: number, size: number) {
  return (percent / 100 - 0.5) * size;
}
