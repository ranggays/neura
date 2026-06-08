import type {
  EvidenceConfidence,
  EvidenceSourceType,
  PolicyGraphEdge,
  PolicyGraphNode,
  PolicyNodeType,
  ThemeMode,
  TimelineEvent,
  WorkspaceDocument,
} from "../types";
import { WorkspaceIcon } from "./workspace-icons";

type CanvasPanelProps = {
  graphNodes: PolicyGraphNode[];
  graphEdges: PolicyGraphEdge[];
  timeline: TimelineEvent[];
  activeSourceTypes: EvidenceSourceType[];
  selectedNodeId?: string;
  selectedDocument?: WorkspaceDocument;
  theme: ThemeMode;
  onToggleSourceType: (sourceType: EvidenceSourceType) => void;
  onSelectNode: (nodeId: string) => void;
};

const sourceTypes: EvidenceSourceType[] = ["regulation", "draft", "dataset", "audit", "court", "procurement"];

const sourceTypeLabels: Record<EvidenceSourceType, string> = {
  regulation: "Regulation",
  draft: "RUU",
  dataset: "Dataset",
  audit: "Audit",
  court: "Court",
  procurement: "Procurement",
};

const nodeTypeStyles: Record<PolicyNodeType, string> = {
  PolicyDocument: "border-l-sky-800",
  DraftBill: "border-l-sky-700",
  Institution:
    "border-l-emerald-700",
  Topic: "border-l-amber-600",
  Dataset: "border-l-sky-700",
  AuditFinding: "border-l-orange-700",
  CourtDecision: "border-l-violet-700",
  ProcurementPackage: "border-l-slate-600",
};

const confidenceStyles: Record<EvidenceConfidence, string> = {
  official: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  derived: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  manual_review: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export function CanvasPanel({
  graphNodes,
  graphEdges,
  timeline,
  activeSourceTypes,
  selectedNodeId,
  selectedDocument,
  theme,
  onToggleSourceType,
  onSelectNode,
}: CanvasPanelProps) {
  const visibleNodes = graphNodes.filter((node) => activeSourceTypes.includes(node.sourceType));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graphEdges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to));
  const selectedNode = visibleNodes.find((node) => node.id === selectedNodeId) ?? visibleNodes[0];
  const selectedEdges = selectedNode
    ? visibleEdges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id)
    : [];

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      <GraphHeader
        nodeCount={visibleNodes.length}
        edgeCount={visibleEdges.length}
        selectedDocument={selectedDocument}
        theme={theme}
      />
      <SourceTypeToolbar activeSourceTypes={activeSourceTypes} onToggleSourceType={onToggleSourceType} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <GraphSurface nodes={visibleNodes} edges={visibleEdges} selectedNode={selectedNode} onSelectNode={onSelectNode} />
        <EvidenceInspector selectedNode={selectedNode} selectedEdges={selectedEdges} />
      </div>

      <TimelineStrip timeline={timeline} activeSourceTypes={activeSourceTypes} />
    </section>
  );
}

function GraphHeader({
  nodeCount,
  edgeCount,
  selectedDocument,
  theme,
}: {
  nodeCount: number;
  edgeCount: number;
  selectedDocument?: WorkspaceDocument;
  theme: ThemeMode;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">Indonesia digital rights policy graph</h2>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {selectedDocument ? `Evidence focus: ${selectedDocument.title}` : "Trace policies, institutions, topics, and evidence signals"}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 lg:flex">
        <WorkspaceIcon name="account_tree" className="text-[18px] text-sky-700 dark:text-sky-300" />
        {nodeCount} nodes
        <span className="text-slate-300 dark:text-slate-700">/</span>
        {edgeCount} edges
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] dark:bg-slate-800">{theme}</span>
      </div>
    </div>
  );
}

function SourceTypeToolbar({
  activeSourceTypes,
  onToggleSourceType,
}: {
  activeSourceTypes: EvidenceSourceType[];
  onToggleSourceType: (sourceType: EvidenceSourceType) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Evidence
      </span>
      {sourceTypes.map((sourceType) => {
        const active = activeSourceTypes.includes(sourceType);
        return (
          <button
            key={sourceType}
            type="button"
            onClick={() => onToggleSourceType(sourceType)}
            className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition ${
              active
                ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
            }`}
          >
            {sourceTypeLabels[sourceType]}
          </button>
        );
      })}
    </div>
  );
}

function GraphSurface({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
}: {
  nodes: PolicyGraphNode[];
  edges: PolicyGraphEdge[];
  selectedNode?: PolicyGraphNode;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-4 top-4 rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
        Evidence map grows only from sourced relationships
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);

          if (!from || !to) {
            return null;
          }

          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeWidth="0.18"
                className="text-slate-400/80 dark:text-slate-600"
              />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-500 text-[1.8px] font-semibold dark:fill-slate-400"
              >
                {edge.label}
              </text>
            </g>
          );
        })}
      </svg>

      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelectNode(node.id)}
          className={`absolute w-[172px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-l-4 border-slate-200 bg-white p-2.5 text-left text-slate-950 shadow-sm transition hover:scale-[1.015] hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-700 ${
            nodeTypeStyles[node.type]
          } ${selectedNode?.id === node.id ? "ring-4 ring-sky-300/70 dark:ring-sky-500/30" : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{node.type}</p>
          <h3 className="mt-1 truncate text-xs font-semibold leading-5">{node.label}</h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600 dark:text-slate-400">{node.description}</p>
        </button>
      ))}
    </div>
  );
}

function EvidenceInspector({
  selectedNode,
  selectedEdges,
}: {
  selectedNode?: PolicyGraphNode;
  selectedEdges: PolicyGraphEdge[];
}) {
  return (
    <aside className="hidden h-full w-[292px] shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 xl:flex">
      {selectedNode ? (
        <>
          <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
              Evidence inspector
            </p>
            <h3 className="mt-1 text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">{selectedNode.label}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{selectedNode.description}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Why connected?
            </p>
            <div className="space-y-2">
              {selectedEdges.length > 0 ? (
                selectedEdges.map((edge) => <EvidenceCard key={edge.id} edge={edge} />)
              ) : (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  Select a connected node to inspect source-backed relationships.
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}

function EvidenceCard({ edge }: { edge: PolicyGraphEdge }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">{edge.label}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${confidenceStyles[edge.confidence]}`}>
          {edge.confidence.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{edge.explanation}</p>
      <p className="mt-2 truncate text-[11px] font-semibold text-sky-700 dark:text-sky-300">
        {edge.sourceName} / {edge.retrievedDate}
      </p>
    </article>
  );
}

function TimelineStrip({
  timeline,
  activeSourceTypes,
}: {
  timeline: TimelineEvent[];
  activeSourceTypes: EvidenceSourceType[];
}) {
  const visibleEvents = timeline.filter((event) => activeSourceTypes.includes(event.sourceType));

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Policy lifecycle
          </p>
          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">Draft to implementation evidence</h3>
        </div>
        <WorkspaceIcon name="timeline" className="text-[19px] text-sky-700 dark:text-sky-300" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleEvents.map((event) => (
          <article
            key={event.id}
            className="w-[176px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">{event.date}</p>
            <h4 className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-slate-100">{event.title}</h4>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{event.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
