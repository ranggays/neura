import type { WorkspaceDocument } from "../types";
import { IconButton, WorkspaceIcon } from "./workspace-icons";

type SourceLibraryPanelProps = {
  documents: WorkspaceDocument[];
  selectedDocumentId?: string;
  collapsed: boolean;
  uploading: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onSelectDocument: (document: WorkspaceDocument) => void;
  onUpload: () => void;
  onDeleteDocument: (documentId: string) => void;
};

export function SourceLibraryPanel({
  documents,
  selectedDocumentId,
  collapsed,
  uploading,
  onCollapse,
  onExpand,
  onSelectDocument,
  onUpload,
  onDeleteDocument,
}: SourceLibraryPanelProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center border-r border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
        <IconButton label="Expand source library" icon="last_page" onClick={onExpand} />
        <div className="mt-6 rotate-180 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 [writing-mode:vertical-rl]">
          Source Library
        </div>
        <div className="mt-6 flex flex-1 flex-col items-center gap-2">
          {documents.map((document) => (
            <button
              key={document.id}
              type="button"
              title={document.title}
              onClick={() => onSelectDocument(document)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sky-700 transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800 ${
                selectedDocumentId === document.id
                  ? "border-sky-500 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <WorkspaceIcon name="description" className="text-[19px]" />
            </button>
          ))}
        </div>
        <IconButton label="Upload source" icon={uploading ? "progress_activity" : "add_circle"} onClick={onUpload} />
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
        <IconButton label="Collapse source library" icon="chevron_left" onClick={onCollapse} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <WorkspaceIcon name="menu_book" className="text-[19px]" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">Source library</h2>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Curated public evidence</p>
          </div>
        </div>
        <IconButton label="Add source" icon="add_circle" onClick={onUpload} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {documents.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No sources yet. Upload a document to start building the canvas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                selected={selectedDocumentId === document.id}
                onSelect={() => onSelectDocument(document)}
                onDelete={() => onDeleteDocument(document.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={onUpload}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-sky-800 active:scale-[0.99] dark:bg-sky-700 dark:hover:bg-sky-600"
        >
          <WorkspaceIcon name={uploading ? "progress_activity" : "add_circle"} className="text-[18px]" />
          {uploading ? "Uploading..." : "Upload New Source"}
        </button>
      </div>
    </aside>
  );
}

type DocumentCardProps = {
  document: WorkspaceDocument;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

function DocumentCard({ document, selected, onSelect, onDelete }: DocumentCardProps) {
  const processing = document.status === "Processing";

  return (
    <article
      className={`group rounded-lg border bg-white p-3 transition hover:border-sky-300 hover:bg-slate-50 dark:bg-slate-900 dark:hover:border-sky-800 dark:hover:bg-slate-800/70 ${
        selected
          ? "border-sky-500 ring-2 ring-sky-100 dark:border-sky-700 dark:ring-sky-950"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <WorkspaceIcon name="description" className="text-[18px]" />
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
              processing
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {document.status}
          </span>
        </div>
        <h3 className="mt-2 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{document.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-400" title={document.summary}>
          {document.summary}
        </p>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {document.size}
        </span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{document.date}</span>
        <div className="ml-auto flex opacity-0 transition group-hover:opacity-100">
          <IconButton label="View source" icon="visibility" onClick={onSelect} className="h-7 w-7 border-0 bg-transparent" />
          <IconButton label="Visualize source" icon="account_tree" className="h-7 w-7 border-0 bg-transparent text-violet-600" />
          <IconButton label="Delete source" icon="delete" onClick={onDelete} className="h-7 w-7 border-0 bg-transparent" />
        </div>
      </div>
    </article>
  );
}
