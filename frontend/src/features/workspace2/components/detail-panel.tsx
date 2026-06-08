import type { EvidenceEdge, EvidenceNode, NewsSource, Selection } from "../types";
import { Workspace2Icon } from "./workspace2-icons";

type DetailPanelProps = {
  selection?: Selection;
  sources: NewsSource[];
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  collapsed: boolean;
  onFindRelatedSources: (node: EvidenceNode) => void;
  onCollapse: () => void;
  onExpand: () => void;
};

export function DetailPanel({
  selection,
  sources,
  nodes,
  edges,
  collapsed,
  onFindRelatedSources,
  onCollapse,
  onExpand,
}: DetailPanelProps) {
  const content = getSelectionContent(selection, sources, nodes, edges);

  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center border-l border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          aria-label="Expand detail panel"
          onClick={onExpand}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Workspace2Icon name="first_page" className="text-[19px]" />
        </button>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 [writing-mode:vertical-rl]">
          Detail
        </div>
        <Workspace2Icon name={selection?.kind === "edge" ? "conversion_path" : selection?.kind === "node" ? "adjust" : "info"} className="mt-6 text-[22px] text-slate-400" />
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Detail panel
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-slate-950 dark:text-slate-100">{content.title}</h2>
          </div>
          <button
            type="button"
            aria-label="Collapse detail panel"
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <Workspace2Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {content.kind === "empty" ? <EmptyDetail /> : null}
        {content.kind === "source" ? <SourceDetail source={content.source} /> : null}
        {content.kind === "node" ? (
          <NodeDetail node={content.node} sources={sources} edges={edges} onFindRelatedSources={onFindRelatedSources} />
        ) : null}
        {content.kind === "edge" ? <EdgeDetail edge={content.edge} sources={sources} nodes={nodes} /> : null}
      </div>
    </aside>
  );
}

function EmptyDetail() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
      Select a source, node, or edge. This panel explains only the selected item, not the entire article.
    </div>
  );
}

function SourceDetail({ source }: { source: NewsSource }) {
  return (
    <div className="space-y-4">
      <StatusRow label="Type" value={source.type} />
      <StatusRow label="Publisher" value={source.publisher} />
      <StatusRow label="Published" value={source.publishedAt} />
      <section>
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Source summary</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{source.snippet}</p>
      </section>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-sky-800 dark:bg-sky-700 dark:hover:bg-sky-600"
      >
        <Workspace2Icon name="open_in_new" className="text-[18px]" />
        Open original source
      </a>
    </div>
  );
}

function NodeDetail({
  node,
  sources,
  edges,
  onFindRelatedSources,
}: {
  node: EvidenceNode;
  sources: NewsSource[];
  edges: EvidenceEdge[];
  onFindRelatedSources: (node: EvidenceNode) => void;
}) {
  const supportingSources = sources.filter((source) => node.sourceIds.includes(source.id));
  const connectedEdges = edges.filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id);

  return (
    <div className="space-y-4">
      <StatusRow label="Node type" value={node.type} />
      <StatusRow label="Review" value={node.reviewStatus.replace("_", " ")} />
      <section>
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Relevant meaning</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{node.description}</p>
      </section>
      <button
        type="button"
        onClick={() => onFindRelatedSources(node)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-sky-800 dark:bg-sky-700 dark:hover:bg-sky-600"
      >
        <Workspace2Icon name="travel_explore" className="text-[18px]" />
        Find related sources
      </button>
      <EvidenceList title="Supporting sources" items={supportingSources.map((source) => source.title)} />
      <EvidenceList title="Connected relationships" items={connectedEdges.map((edge) => edge.label)} />
    </div>
  );
}

function EdgeDetail({
  edge,
  sources,
  nodes,
}: {
  edge: EvidenceEdge;
  sources: NewsSource[];
  nodes: EvidenceNode[];
}) {
  const from = nodes.find((node) => node.id === edge.fromNodeId);
  const to = nodes.find((node) => node.id === edge.toNodeId);
  const supportingSources = sources.filter((source) => edge.sourceIds.includes(source.id));

  return (
    <div className="space-y-4">
      <StatusRow label="Relationship" value={edge.label} />
      <StatusRow label="Confidence" value={edge.confidence} />
      <StatusRow label="Review" value={edge.reviewStatus.replace("_", " ")} />
      <section>
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Connection</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {from?.label} {"->"} {to?.label}
        </p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Why connected?</h3>
        <div className="mt-2 space-y-2">
          {edge.evidence.map((snippet) => (
            <article key={`${snippet.sourceId}-${snippet.location}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{snippet.text}</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{snippet.location}</p>
            </article>
          ))}
        </div>
      </section>
      <EvidenceList title="Source evidence" items={supportingSources.map((source) => source.title)} />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{value}</span>
    </div>
  );
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No items yet.
          </p>
        )}
      </div>
    </section>
  );
}

function getSelectionContent(selection: Selection | undefined, sources: NewsSource[], nodes: EvidenceNode[], edges: EvidenceEdge[]) {
  if (!selection) {
    return {
      kind: "empty" as const,
      title: "Nothing selected",
    };
  }

  if (selection.kind === "source") {
    const source = sources.find((item) => item.id === selection.id);
    return source ? { kind: "source" as const, title: "Source detail", source } : { kind: "empty" as const, title: "Nothing selected" };
  }

  if (selection.kind === "node") {
    const node = nodes.find((item) => item.id === selection.id);
    return node ? { kind: "node" as const, title: "Node detail", node } : { kind: "empty" as const, title: "Nothing selected" };
  }

  const edge = edges.find((item) => item.id === selection.id);
  return edge ? { kind: "edge" as const, title: "Edge detail", edge } : { kind: "empty" as const, title: "Nothing selected" };
}
