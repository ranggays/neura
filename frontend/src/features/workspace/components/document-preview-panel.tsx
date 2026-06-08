import type { WorkspaceDocument } from "../types";
import { IconButton, WorkspaceIcon } from "./workspace-icons";

type DocumentPreviewPanelProps = {
  document: WorkspaceDocument;
  onClose: () => void;
  onExtract: () => void;
};

export function DocumentPreviewPanel({ document, onClose, onExtract }: DocumentPreviewPanelProps) {
  return (
    <section className="flex h-full min-w-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <WorkspaceIcon name="description" className="text-[20px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Document Preview
            </p>
            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{document.title}</h2>
          </div>
        </div>
        <IconButton label="Close preview" icon="close" onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 bg-slate-100 p-3 dark:bg-slate-950">
        <div className="relative h-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <iframe title={`${document.title} preview`} src={document.viewerUrl} className="h-full w-full" />
          <div className="pointer-events-none absolute left-6 top-24 max-w-[280px] rounded-lg border border-slate-200 bg-white/95 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">{document.type}</p>
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{document.title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{document.summary}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-2 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">View mode</span>
        <button
          type="button"
          onClick={onExtract}
          className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"
        >
          Extract to Canvas
        </button>
      </div>
    </section>
  );
}
