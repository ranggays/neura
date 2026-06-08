export type SourceStatus = "available" | "processing" | "imported";

export type SourceType = "news" | "official" | "document";

export type NodeType = "Source" | "Policy" | "Institution" | "Person" | "Topic" | "Event";

export type ReviewStatus = "auto" | "review_needed" | "approved" | "rejected";

export type Confidence = "low" | "medium" | "high";

export type NewsSource = {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  url: string;
  type: SourceType;
  snippet: string;
  status: SourceStatus;
};

export type EvidenceSnippet = {
  sourceId: string;
  text: string;
  location: string;
};

export type EvidenceNode = {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  sourceIds: string[];
  reviewStatus: ReviewStatus;
  x: number;
  y: number;
};

export type EvidenceEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  sourceIds: string[];
  evidence: EvidenceSnippet[];
  confidence: Confidence;
  reviewStatus: ReviewStatus;
};

export type GraphPatch = {
  source: NewsSource;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
};

export type GraphState = {
  sources: NewsSource[];
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
};

export type Selection =
  | {
      kind: "node";
      id: string;
    }
  | {
      kind: "edge";
      id: string;
    }
  | {
      kind: "source";
      id: string;
    };
