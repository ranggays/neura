import type { ConfigStatus, EvidenceEdge, EvidenceNode, NewsSource, Selection } from "../types";
import { VisNetworkGraph } from "./vis-network-graph";
import { Workspace2Icon } from "./workspace2-icons";

type SearchGraphPanelProps = {
  query: string;
  searchResults: NewsSource[];
  importedSourceIds: string[];
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  selection?: Selection;
  processingSourceId?: string;
  importResultBySourceId: Record<string, "success" | "failed">;
  configStatus?: ConfigStatus;
  loading: boolean;
  errorMessage?: string;
  searchCollapsed: boolean;
  onQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
  onImportSource: (sourceId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onToggleSearch: () => void;
};

export function SearchGraphPanel({
  query,
  searchResults,
  importedSourceIds,
  nodes,
  edges,
  selection,
  processingSourceId,
  importResultBySourceId,
  configStatus,
  loading,
  errorMessage,
  searchCollapsed,
  onQueryChange,
  onSearchSubmit,
  onImportSource,
  onSelectNode,
  onSelectEdge,
  onToggleSearch,
}: SearchGraphPanelProps) {
  return (
    <section className="relative flex h-full min-w-0 flex-col bg-slate-100 dark:bg-slate-950">
      <VisNetworkGraph nodes={nodes} edges={edges} selection={selection} onSelectNode={onSelectNode} onSelectEdge={onSelectEdge} />
      <FloatingSearch
        query={query}
        searchResults={searchResults}
        importedSourceIds={importedSourceIds}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        processingSourceId={processingSourceId}
        importResultBySourceId={importResultBySourceId}
        configStatus={configStatus}
        loading={loading}
        errorMessage={errorMessage}
        collapsed={searchCollapsed}
        onQueryChange={onQueryChange}
        onSearchSubmit={onSearchSubmit}
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
  importResultBySourceId,
  configStatus,
  loading,
  errorMessage,
  collapsed,
  onQueryChange,
  onSearchSubmit,
  onImportSource,
  onToggleSearch,
}: {
  query: string;
  searchResults: NewsSource[];
  importedSourceIds: string[];
  nodeCount: number;
  edgeCount: number;
  processingSourceId?: string;
  importResultBySourceId: Record<string, "success" | "failed">;
  configStatus?: ConfigStatus;
  loading: boolean;
  errorMessage?: string;
  collapsed: boolean;
  onQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
  onImportSource: (sourceId: string) => void;
  onToggleSearch: () => void;
}) {
  const providerLabel = configStatus ? formatProviderLabel(configStatus) : "Provider status loading";
  const extracting = processingSourceId !== undefined;

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
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{providerLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 md:block">
            {extracting ? "Extracting with AI..." : loading ? "Loading..." : `${nodeCount} nodes / ${edgeCount} edges`}
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

      <form
        className="grid grid-cols-[1fr_auto] gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
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
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-sky-700 dark:hover:bg-sky-600 dark:disabled:bg-slate-800"
        >
          {loading ? "Searching" : "Search"}
        </button>
      </form>

      {errorMessage ? (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {extracting && !errorMessage ? (
        <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
          Extracting evidence graph with {configStatus?.aiProvider ?? "AI"}. This can take a few seconds for real articles.
        </div>
      ) : null}

      <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {loading ? (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading search results...</div>
        ) : null}

        {!loading && searchResults.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
            No matching sources found for this provider. Try a broader query or adjust the active source provider.
          </div>
        ) : null}

        {!loading ? searchResults.map((source) => {
          const imported = importedSourceIds.includes(source.id);
          const processing = processingSourceId === source.id;
          const importResult = importResultBySourceId[source.id];

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
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled={imported || processing || (processingSourceId !== undefined && !processing)}
                  onClick={() => onImportSource(source.id)}
                  className="h-9 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-sky-700 dark:hover:bg-sky-600 dark:disabled:bg-slate-800"
                >
                  {processing ? "Extracting" : imported ? "Imported" : importResult === "failed" ? "Retry" : "Import"}
                </button>
                {importResult ? (
                  <span
                    className={`text-[11px] font-semibold ${
                      importResult === "success"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {importResult === "success" ? "Success" : "Failed"}
                  </span>
                ) : null}
              </div>
            </article>
          );
        }) : null}
      </div>
    </div>
  );
}

function formatProviderLabel(status: ConfigStatus) {
  const sourceParts = [status.sourceProvider.toUpperCase()];

  if (status.sourceLanguage) {
    sourceParts.push(status.sourceLanguage.toUpperCase());
  }

  if (status.sourceCountry) {
    sourceParts.push(status.sourceCountry.toUpperCase());
  }

  return `${sourceParts.join(" / ")} source search -> ${status.aiProvider.toUpperCase()} extraction`;
}
