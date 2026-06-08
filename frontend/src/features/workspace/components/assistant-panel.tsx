import type { AssistantMode, ChatHistoryItem, ChatMessage, WorkspaceDocument } from "../types";
import { IconButton, WorkspaceIcon } from "./workspace-icons";

type AssistantPanelProps = {
  collapsed: boolean;
  mode: AssistantMode;
  historyOpen: boolean;
  loading: boolean;
  attachOpen: boolean;
  documents: WorkspaceDocument[];
  selectedDocumentIds: string[];
  messages: ChatMessage[];
  history: ChatHistoryItem[];
  onCollapse: () => void;
  onExpand: () => void;
  onModeChange: (mode: AssistantMode) => void;
  onToggleHistory: () => void;
  onToggleAttach: () => void;
  onToggleDocument: (documentId: string) => void;
  onResetDocuments: () => void;
  onSend: () => void;
  onSendToCanvas: (message: ChatMessage) => void;
};

const tabs: Array<{ mode: AssistantMode; label: string; short: string; icon: string }> = [
  { mode: "doc", label: "Doc Chat", short: "Doc", icon: "menu_book" },
  { mode: "web", label: "Web", short: "Web", icon: "travel_explore" },
  { mode: "sentiment", label: "Sentiment", short: "Sent", icon: "sentiment_satisfied" },
];

export function AssistantPanel({
  collapsed,
  mode,
  historyOpen,
  loading,
  attachOpen,
  documents,
  selectedDocumentIds,
  messages,
  history,
  onCollapse,
  onExpand,
  onModeChange,
  onToggleHistory,
  onToggleAttach,
  onToggleDocument,
  onResetDocuments,
  onSend,
  onSendToCanvas,
}: AssistantPanelProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center border-l border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
        <IconButton label="Expand assistant" icon="first_page" onClick={onExpand} />
        <span className="mt-5 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          <WorkspaceIcon name="support_agent" className="text-[20px]" />
        </span>
        <button
          type="button"
          title="New chat"
          className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-sky-800 dark:bg-sky-700 dark:hover:bg-sky-600"
        >
          <WorkspaceIcon name="chat_add_on" className="text-[18px]" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <WorkspaceIcon name="support_agent" className="text-[19px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">Evidence assistant</h2>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Review links before publishing</p>
          </div>
          <IconButton label="Conversation history" icon="history" onClick={onToggleHistory} className="h-8 w-8" />
          <IconButton label="New chat" icon="chat_add_on" className="h-8 w-8" />
          <IconButton label="Collapse assistant" icon="chevron_right" onClick={onCollapse} className="h-8 w-8" />
        </div>
        <div className="mt-3 grid grid-cols-3 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
          {tabs.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => onModeChange(tab.mode)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition ${
                mode === tab.mode
                  ? "bg-white text-sky-800 shadow-sm dark:bg-slate-800 dark:text-sky-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <WorkspaceIcon name={tab.icon} className="text-[16px]" />
              <span className="hidden xl:inline">{tab.label}</span>
              <span className="hidden sm:inline xl:hidden">{tab.short}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {historyOpen ? <HistoryList history={history} /> : <MessageList messages={messages} loading={loading} onSendToCanvas={onSendToCanvas} />}
      </div>

      <div className="relative shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        {attachOpen ? (
          <FocusMenu
            documents={documents}
            selectedDocumentIds={selectedDocumentIds}
            onToggleDocument={onToggleDocument}
            onResetDocuments={onResetDocuments}
          />
        ) : null}
        {selectedDocumentIds.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedDocumentIds.map((documentId) => {
              const document = documents.find((item) => item.id === documentId);
              return document ? (
                <span
                  key={document.id}
                  className="max-w-full truncate rounded-md bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                >
                  {document.title}
                </span>
              ) : null;
            })}
          </div>
        ) : null}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
          <textarea
            className="h-20 w-full resize-none bg-transparent px-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            placeholder={mode === "web" ? "Search the web for research context..." : "Ask about selected sources..."}
          />
          <div className="flex items-center justify-between">
            <IconButton label="Search focus" icon="attach_file" onClick={onToggleAttach} className="h-8 w-8 border-0 bg-transparent" />
            <button
              type="button"
              onClick={onSend}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-sky-800 active:scale-[0.97] dark:bg-sky-700 dark:hover:bg-sky-600"
              aria-label="Send message"
            >
              <WorkspaceIcon name="send" className="text-[17px]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MessageList({
  messages,
  loading,
  onSendToCanvas,
}: {
  messages: ChatMessage[];
  loading: boolean;
  onSendToCanvas: (message: ChatMessage) => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const user = message.role === "user";
        return (
          <div key={message.id} className={`flex gap-2 ${user ? "justify-end" : "justify-start"}`}>
            {!user ? <Avatar icon="auto_awesome" /> : null}
            <div
              className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                user
                  ? "rounded-br-sm bg-slate-950 text-white dark:bg-sky-700"
                  : "rounded-bl-sm border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              <p>{message.body}</p>
              {message.canSendToCanvas ? (
                <button
                  type="button"
                  onClick={() => onSendToCanvas(message)}
                  className="mt-2 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
                >
                  Send to Canvas
                </button>
              ) : null}
            </div>
            {user ? <Avatar label="RY" /> : null}
          </div>
        );
      })}
      {loading ? (
        <div className="flex items-center gap-2">
          <Avatar icon="auto_awesome" />
          <div className="flex rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
            <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-sky-700" />
            <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-sky-700 [animation-delay:120ms]" />
            <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-sky-700 [animation-delay:240ms]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistoryList({ history }: { history: ChatHistoryItem[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Conversation History</h3>
      <div className="mt-3 space-y-2">
        {history.length > 0 ? (
          history.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-sky-900 dark:hover:bg-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{item.date}</p>
              </div>
              <WorkspaceIcon name="delete" className="text-[17px] text-slate-400 opacity-0 transition group-hover:opacity-100" />
            </button>
          ))
        ) : (
          <div className="flex h-40 items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
            No saved conversations yet.
          </div>
        )}
      </div>
    </div>
  );
}

function FocusMenu({
  documents,
  selectedDocumentIds,
  onToggleDocument,
  onResetDocuments,
}: {
  documents: WorkspaceDocument[];
  selectedDocumentIds: string[];
  onToggleDocument: (documentId: string) => void;
  onResetDocuments: () => void;
}) {
  return (
    <div className="absolute bottom-[148px] left-3 right-3 z-30 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Search Focus</h3>
        {selectedDocumentIds.length > 0 ? (
          <button type="button" onClick={onResetDocuments} className="text-xs font-semibold text-sky-700 dark:text-sky-300">
            Reset
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onResetDocuments}
        className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <WorkspaceIcon name={selectedDocumentIds.length === 0 ? "check_box" : "check_box_outline_blank"} className="text-[18px]" />
        All workspace
      </button>
      {documents.map((document) => {
        const selected = selectedDocumentIds.includes(document.id);
        return (
          <button
            key={document.id}
            type="button"
            onClick={() => onToggleDocument(document.id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <WorkspaceIcon name={selected ? "check_box" : "check_box_outline_blank"} className="text-[18px] text-sky-700 dark:text-sky-300" />
            <span className="truncate">{document.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function Avatar({ icon, label }: { icon?: string; label?: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
      {icon ? <WorkspaceIcon name={icon} className="text-[16px]" /> : label}
    </span>
  );
}
