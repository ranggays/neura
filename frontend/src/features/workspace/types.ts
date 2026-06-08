export type ThemeMode = "light" | "dark";

export type AssistantMode = "doc" | "web" | "sentiment";

export type SourceStatus = "Active" | "Processing";

export type EvidenceConfidence = "official" | "derived" | "manual_review";

export type EvidenceSourceType = "regulation" | "draft" | "dataset" | "audit" | "court" | "procurement";

export type PolicyNodeType =
  | "PolicyDocument"
  | "DraftBill"
  | "Institution"
  | "Topic"
  | "Dataset"
  | "AuditFinding"
  | "CourtDecision"
  | "ProcurementPackage";

export type WorkspaceDocument = {
  id: string;
  title: string;
  summary: string;
  size: string;
  date: string;
  status: SourceStatus;
  type: string;
  viewerUrl: string;
};

export type CanvasNode = {
  id: string;
  title: string;
  body: string;
  tone: "blue" | "yellow" | "purple";
  x: number;
  y: number;
};

export type PolicyGraphNode = {
  id: string;
  label: string;
  type: PolicyNodeType;
  description: string;
  sourceType: EvidenceSourceType;
  x: number;
  y: number;
};

export type PolicyGraphEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  sourceName: string;
  sourceUrl: string;
  retrievedDate: string;
  confidence: EvidenceConfidence;
  explanation: string;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  sourceType: EvidenceSourceType;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  body: string;
  canSendToCanvas?: boolean;
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  date: string;
};

export type WorkspaceData = {
  id: string;
  name: string;
  user: {
    name: string;
    email: string;
  };
  documents: WorkspaceDocument[];
  canvasNodes: CanvasNode[];
  graphNodes: PolicyGraphNode[];
  graphEdges: PolicyGraphEdge[];
  timeline: TimelineEvent[];
  messages: ChatMessage[];
  history: ChatHistoryItem[];
};
