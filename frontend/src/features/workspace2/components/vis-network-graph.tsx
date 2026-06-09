import { useEffect, useMemo, useRef, useState } from "react";
import type { Network as VisNetwork } from "vis-network/standalone";
import type { EvidenceEdge, EvidenceNode, Selection } from "../types";
import { buildVisGraphData, getSelectedVisItem, getVisNetworkOptions } from "../lib/workspace2-vis";
import type { PersistedNodePosition } from "../lib/workspace2-vis";
import { Workspace2Icon } from "./workspace2-icons";

type VisNetworkModule = typeof import("vis-network/standalone");

type NetworkClickParams = {
  nodes?: Array<string | number>;
  edges?: Array<string | number>;
};

type DragEndParams = {
  nodes?: Array<string | number>;
};

type VisNetworkGraphProps = {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  selection?: Selection;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
};

export function VisNetworkGraph({ nodes, edges, selection, onSelectNode, onSelectEdge }: VisNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<VisNetwork | null>(null);
  const selectNodeRef = useRef(onSelectNode);
  const selectEdgeRef = useRef(onSelectEdge);
  const [visModule, setVisModule] = useState<VisNetworkModule | null>(null);
  const [persistedPositions, setPersistedPositions] = useState<Record<string, PersistedNodePosition>>(readPersistedNodePositions);
  const graphData = useMemo(() => buildVisGraphData(nodes, edges, persistedPositions), [edges, nodes, persistedPositions]);
  const options = useMemo(() => getVisNetworkOptions(), []);

  useEffect(() => {
    selectNodeRef.current = onSelectNode;
    selectEdgeRef.current = onSelectEdge;
  }, [onSelectEdge, onSelectNode]);

  useEffect(() => {
    let active = true;

    import("vis-network/standalone").then((module) => {
      if (active) {
        setVisModule(module);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visModule || !containerRef.current || networkRef.current || nodes.length === 0) {
      return;
    }

    const network = new visModule.Network(containerRef.current, graphData, options);
    networkRef.current = network;

    const handleClick = (params?: NetworkClickParams) => {
      const nodeId = params?.nodes?.[0];
      const edgeId = params?.edges?.[0];

      if (typeof nodeId === "string") {
        selectNodeRef.current(nodeId);
        return;
      }

      if (typeof edgeId === "string") {
        selectEdgeRef.current(edgeId);
      }
    };

    const handleDragEnd = (params?: DragEndParams) => {
      if (!params?.nodes?.length) {
        return;
      }

      const networkPositions = network.getPositions(params.nodes);
      const nextPositions = Object.fromEntries(
        Object.entries(networkPositions).map(([nodeId, position]) => [
          nodeId,
          {
            x: position.x,
            y: position.y,
          },
        ]),
      );

      setPersistedPositions((current) => {
        const merged = {
          ...current,
          ...nextPositions,
        };
        writePersistedNodePositions(merged);
        return merged;
      });
    };

    network.on("click", handleClick);
    network.on("dragEnd", handleDragEnd);

    return () => {
      network.off("click", handleClick);
      network.off("dragEnd", handleDragEnd);
      network.destroy();
      networkRef.current = null;
    };
  }, [graphData, nodes.length, options, visModule]);

  useEffect(() => {
    if (!networkRef.current) {
      return;
    }

    if (nodes.length === 0) {
      networkRef.current.destroy();
      networkRef.current = null;
      return;
    }

    networkRef.current.setData(graphData);
  }, [graphData, nodes.length]);

  useEffect(() => {
    networkRef.current?.setSelection(getSelectedVisItem(selection), {
      unselectAll: true,
      highlightEdges: true,
    });
  }, [selection]);

  if (nodes.length === 0) {
    return <EmptyGraphState />;
  }

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div ref={containerRef} className="relative h-full w-full" aria-label="Evidence graph network visualization" />
    </div>
  );
}

const nodePositionsStorageKey = "workspace2:vis-node-positions";

function readPersistedNodePositions(): Record<string, PersistedNodePosition> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedPositions = window.localStorage.getItem(nodePositionsStorageKey);
    if (!storedPositions) {
      return {};
    }

    return JSON.parse(storedPositions) as Record<string, PersistedNodePosition>;
  } catch {
    return {};
  }
}

function writePersistedNodePositions(positions: Record<string, PersistedNodePosition>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(nodePositionsStorageKey, JSON.stringify(positions));
}

function EmptyGraphState() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/90 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <Workspace2Icon name="account_tree" className="mx-auto text-[32px] text-sky-700 dark:text-sky-300" />
          <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-slate-100">No graph yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Import a source from the search results. The article becomes a source node, then the extracted entities and relationships appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
