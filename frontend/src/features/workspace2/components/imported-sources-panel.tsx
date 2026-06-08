import type { NewsSource } from "../types";
import { Workspace2Icon } from "./workspace2-icons";

type ImportedSourcesPanelProps = {
  sources: NewsSource[];
  selectedSourceId?: string;
  collapsed: boolean;
  onSelectSource: (sourceId: string) => void;
  onCollapse: () => void;
  onExpand: () => void;
};

export function ImportedSourcesPanel({
  sources,
  selectedSourceId,
  collapsed,
  onSelectSource,
  onCollapse,
  onExpand,
}: ImportedSourcesPanelProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center border-r border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          aria-label="Expand imported sources"
          onClick={onExpand}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Workspace2Icon name="last_page" className="text-[19px]" />
        </button>
        <div className="mt-6 rotate-180 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 [writing-mode:vertical-rl]">
          Sources
        </div>
        <div className="mt-6 flex flex-1 flex-col items-center gap-2">
          {sources.slice(0, 6).map((source) => (
            <button
              key={source.id}
              type="button"
              aria-label={`Select ${source.title}`}
              title={source.title}
              onClick={() => onSelectSource(source.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                selectedSourceId === source.id
                  ? "border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              <Workspace2Icon name={source.type === "official" ? "gavel" : "article"} className="text-[18px]" />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Imported sources
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-slate-950 dark:text-slate-100">Evidence library</h2>
          </div>
          <button
            type="button"
            aria-label="Collapse imported sources"
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <Workspace2Icon name="chevron_left" className="text-[18px]" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {sources.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 px-5 text-center text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Import a search result to create the first source node and extracted subgraph.
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => onSelectSource(source.id)}
                className={`block w-full rounded-lg border bg-white p-3 text-left transition hover:border-sky-300 hover:bg-slate-50 dark:bg-slate-900 dark:hover:border-sky-800 dark:hover:bg-slate-800 ${
                  selectedSourceId === source.id
                    ? "border-sky-500 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Workspace2Icon name={source.type === "official" ? "gavel" : "article"} className="text-[15px]" />
                    {source.type}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{source.publishedAt}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                  {source.title}
                </h3>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{source.publisher}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    imported
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-sky-700 hover:underline dark:text-sky-300"
                    onClick={(event) => event.stopPropagation()}
                  >
                    open source
                  </a>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
