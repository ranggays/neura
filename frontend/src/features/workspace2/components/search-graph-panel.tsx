import type { EvidenceEdge, EvidenceNode, NewsSource, Selection } from "../types";
import { Workspace2Icon } from "./workspace2-icons";

type SearchGraphPanelProps = {
  query: string;
  searchResults: NewsSource[];
  importedSourceIds: string[];
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  selection?: Selection;
  processingSourceId?: string;
  searchCollapsed: boolean;
  onQueryChange: (query: string) => void;
  onImportSource: (sourceId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onToggleSearch: () => void;
};

const nodeTypeStyles: Record<EvidenceNode["type"], string> = {
  Source: "border-l-slate-500",
  Policy: "border-l-sky-800",
  Institution: "border-l-emerald-700",
  Person: "border-l-violet-700",
  Topic: "border-l-amber-600",
  Event: "border-l-orange-700",
};

export function SearchGraphPanel({
  query,
  searchResults,
  importedSourceIds,
  nodes,
  edges,
  selection,
  processingSourceId,
  searchCollapsed,
  onQueryChange,
  onImportSource,
  onSelectNode,
  onSelectEdge,
  onToggleSearch,
}: SearchGraphPanelProps) {
  return (
    <section className="relative flex h-full min-w-0 flex-col bg-slate-100 dark:bg-slate-950">
      <GraphCanvas nodes={nodes} edges={edges} selection={selection} onSelectNode={onSelectNode} onSelectEdge={onSelectEdge} />
      <FloatingSearch
        query={query}
        searchResults={searchResults}
        importedSourceIds={importedSourceIds}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        processingSourceId={processingSourceId}
        collapsed={searchCollapsed}
        onQueryChange={onQueryChange}
        onImportSource={onImportSource}
        onToggleSearch={onToggleSearch}
      />
    </section>
  );
}

function FloatingSearch({
  query,
  searchResults,
  importedSourceIds,
  nodeCount,
  edgeCount,
  processingSourceId,
  collapsed,
  onQueryChange,
  onImportSource,
  onToggleSearch,
}: {
  query: string;
  searchResults: NewsSource[];
  importedSourceIds: string[];
  nodeCount: number;
  edgeCount: number;
  processingSourceId?: string;
  collapsed: boolean;
  onQueryChange: (query: string) => void;
  onImportSource: (sourceId: string) => void;
  onToggleSearch: () => void;
}) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleSearch}
        className="absolute left-1/2 top-4 z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <Workspace2Icon name="search" className="text-[19px] text-sky-700 dark:text-sky-300" />
        Search/import sources
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {nodeCount}/{edgeCount}
        </span>
      </button>
    );
  }

  return (
    <div className="absolute left-1/2 top-4 z-30 w-[min(760px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/30">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Search and import
          </p>
          <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">Build the graph from selected sources</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 md:block">
            {nodeCount} nodes / {edgeCount} edges
          </span>
          <button
            type="button"
            aria-label="Minimize search and import"
            onClick={onToggleSearch}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <Workspace2Icon name="keyboard_arrow_up" className="text-[18px]" />
          </button>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Search public sources</span>
        <Workspace2Icon name="search" className="absolute left-3 top-1/2 text-[20px] -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          placeholder="Search news, policies, institutions, topics..."
        />
      </label>

      <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {searchResults.map((source) => {
          const imported = importedSourceIds.includes(source.id);
          const processing = processingSourceId === source.id;

          return (
            <article
              key={source.id}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 p-3 last:border-b-0 dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {source.type}
                  </span>
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {source.publisher} / {source.publishedAt}
                  </span>
                </div>
                <h2 className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{source.title}</h2>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{source.snippet}</p>
              </div>
              <button
                type="button"
                disabled={imported || processing}
                onClick={() => onImportSource(source.id)}
                className="h-9 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-sky-700 dark:hover:bg-sky-600 dark:disabled:bg-slate-800"
              >
                {processing ? "Processing" : imported ? "Imported" : "Import"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function GraphCanvas({
  nodes,
  edges,
  selection,
  onSelectNode,
  onSelectEdge,
}: {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  selection?: Selection;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/90 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <Workspace2Icon name="account_tree" className="mx-auto text-[32px] text-sky-700 dark:text-sky-300" />
            <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-slate-100">No graph yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Import a source from the search results. The article becomes a source node, then the extracted entities and relationships appear here.
            </p>
          </div>
        </div>
      ) : null}

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.fromNodeId);
          const to = nodes.find((node) => node.id === edge.toNodeId);

          if (!from || !to) {
            return null;
          }

          const selected = selection?.kind === "edge" && selection.id === edge.id;

          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeWidth={selected ? "0.34" : "0.2"}
                className={selected ? "text-sky-700 dark:text-sky-300" : "text-slate-400 dark:text-slate-600"}
              />
              <foreignObject x={(from.x + to.x) / 2 - 5} y={(from.y + to.y) / 2 - 2.5} width="10" height="5">
                <button
                  type="button"
                  onClick={() => onSelectEdge(edge.id)}
                  className="h-full w-full rounded bg-white/90 text-[2px] font-semibold text-slate-600 hover:text-sky-800 dark:bg-slate-900/90 dark:text-slate-300"
                >
                  {edge.label}
                </button>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {nodes.map((node) => {
        const selected = selection?.kind === "node" && selection.id === node.id;

        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode(node.id)}
            className={`absolute w-[176px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-l-4 bg-white p-2.5 text-left text-slate-950 shadow-sm transition hover:scale-[1.015] hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${nodeTypeStyles[node.type]} ${
              selected ? "ring-4 ring-sky-300/70 dark:ring-sky-500/30" : "border-slate-200"
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{node.type}</p>
            <h3 className="mt-1 truncate text-xs font-semibold">{node.label}</h3>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600 dark:text-slate-400">{node.description}</p>
          </button>
        );
      })}
    </div>
  );
}
