"use client";

import { useMemo, useState } from "react";
import { graphPatches, searchSources } from "../data/workspace2-data";
import { mergeGraphPatch, mergeSources, searchAvailableSources } from "../lib/workspace2-graph";
import type { EvidenceEdge, EvidenceNode, NewsSource, Selection } from "../types";
import { DetailPanel } from "./detail-panel";
import { ImportedSourcesPanel } from "./imported-sources-panel";
import { SearchGraphPanel } from "./search-graph-panel";
import { Workspace2Icon } from "./workspace2-icons";

export function Workspace2Page() {
  const [query, setQuery] = useState("digital identity");
  const [importedSources, setImportedSources] = useState<NewsSource[]>([]);
  const [nodes, setNodes] = useState<EvidenceNode[]>([]);
  const [edges, setEdges] = useState<EvidenceEdge[]>([]);
  const [selection, setSelection] = useState<Selection | undefined>();
  const [processingSourceId, setProcessingSourceId] = useState<string | undefined>();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);

  const searchResults = useMemo(() => searchAvailableSources(searchSources, query), [query]);
  const importedSourceIds = importedSources.map((source) => source.id);

  function importSource(sourceId: string) {
    const patch = graphPatches[sourceId];

    if (!patch || importedSourceIds.includes(sourceId) || processingSourceId) {
      return;
    }

    setProcessingSourceId(sourceId);

    window.setTimeout(() => {
      setImportedSources((current) => mergeSources(current, patch.source));
      setNodes((currentNodes) => mergeGraphPatch(currentNodes, edges, patch).nodes);
      setEdges((currentEdges) => mergeGraphPatch(nodes, currentEdges, patch).edges);
      setSelection({ kind: "source", id: sourceId });
      setProcessingSourceId(undefined);
    }, 700);
  }

  function selectSource(sourceId: string) {
    setSelection({ kind: "source", id: sourceId });
  }

  function selectNode(nodeId: string) {
    setSelection({ kind: "node", id: nodeId });
  }

  function selectEdge(edgeId: string) {
    setSelection({ kind: "edge", id: edgeId });
  }

  function findRelatedSources(node: EvidenceNode) {
    setQuery(node.label);
    setSearchCollapsed(false);
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <WorkspaceHeader sourceCount={importedSources.length} nodeCount={nodes.length} edgeCount={edges.length} />

      <main
        className="grid h-[calc(100vh-4rem)] overflow-hidden"
        style={{
          gridTemplateColumns: `${leftCollapsed ? "56px" : "280px"} minmax(0, 1fr) ${rightCollapsed ? "56px" : "320px"}`,
        }}
      >
        <ImportedSourcesPanel
          sources={importedSources}
          selectedSourceId={selection?.kind === "source" ? selection.id : undefined}
          collapsed={leftCollapsed}
          onSelectSource={selectSource}
          onCollapse={() => setLeftCollapsed(true)}
          onExpand={() => setLeftCollapsed(false)}
        />
        <SearchGraphPanel
          query={query}
          searchResults={searchResults}
          importedSourceIds={importedSourceIds}
          nodes={nodes}
          edges={edges}
          selection={selection}
          processingSourceId={processingSourceId}
          searchCollapsed={searchCollapsed}
          onQueryChange={setQuery}
          onImportSource={importSource}
          onSelectNode={selectNode}
          onSelectEdge={selectEdge}
          onToggleSearch={() => setSearchCollapsed((current) => !current)}
        />
        <DetailPanel
          selection={selection}
          sources={importedSources}
          nodes={nodes}
          edges={edges}
          collapsed={rightCollapsed}
          onFindRelatedSources={findRelatedSources}
          onCollapse={() => setRightCollapsed(true)}
          onExpand={() => setRightCollapsed(false)}
        />
      </main>
    </div>
  );
}

function WorkspaceHeader({
  sourceCount,
  nodeCount,
  edgeCount,
}: {
  sourceCount: number;
  nodeCount: number;
  edgeCount: number;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm dark:bg-sky-700">
          <Workspace2Icon name="hub" className="text-[22px]" />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">Evidence Graph</h1>
            <span className="hidden rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300 sm:inline-flex">
              Workspace
            </span>
          </div>
          <div className="mt-1 hidden min-w-0 items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 sm:flex">
            <span className="truncate">Indonesia digital rights</span>
            <Workspace2Icon name="chevron_right" className="text-[15px]" />
            <span className="truncate">source-backed extraction</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 md:flex">
          <MetricPill label="sources" value={sourceCount} />
          <MetricPill label="nodes" value={nodeCount} />
          <MetricPill label="edges" value={edgeCount} />
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 lg:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Evidence-safe mode
        </div>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:bg-slate-800"
        >
          <Workspace2Icon name="account_circle" className="text-[19px]" />
          <span className="hidden sm:inline">Rangga</span>
        </button>
      </div>
    </header>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-slate-200 px-3 py-1.5 last:border-r-0 dark:border-slate-800">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-mono text-sm font-semibold text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  );
}
